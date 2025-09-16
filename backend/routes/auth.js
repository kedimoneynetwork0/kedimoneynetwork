const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { query } = require('../utils/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiters
const userLoginLimiter = rateLimit({
  windowMs: 15 * 1000,
  max: 5,
  message: 'Too many login attempts from this IP, please try again after 15 seconds',
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 1000,
  max: 5,
  message: 'Too many login attempts from this IP, please try again after 15 seconds',
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { firstname, lastname, phone, email, username, password, referralId, idNumber } = req.body;

    const requiredFields = { firstname, lastname, phone, email, username, password, idNumber };
    for (let [key, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === '') {
        return res.status(400).json({ message: `${key} is required` });
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long, include a number and a special character' });
    }

    const hash = await bcrypt.hash(password, 10);

    try {
      await query(
        `INSERT INTO users (firstname, lastname, phone, email, username, password, referralId, idNumber, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [firstname, lastname, phone, email, username, hash, referralId || null, idNumber, 'user', 'pending']
      );
      res.json({ message: 'Signup successful, wait for admin approval' });
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Email or username already exists' });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Login (user)
router.post('/login', userLoginLimiter, async (req, res) => {
  const { email, password } = req.body;

  console.log('User login attempt for:', email);

  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];

    console.log('User found:', !!user);
    if (user) {
      console.log('User status:', user.status);
      console.log('User role:', user.role);
    }

    if (!user) {
      console.log('No user found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'approved') {
      console.log('User not approved, status:', user.status);
      return res.status(403).json({ message: 'User not approved yet' });
    }

    const match = await bcrypt.compare(password, user.password);
    console.log('Password match result:', match);

    if (!match) {
      console.log('Password does not match for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, role: user.role });
    console.log('User login successful for:', email);
    res.json({ token, role: user.role, status: user.status, message: 'Login successful' });
  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login
router.post('/admin-login', adminLoginLimiter, async (req, res) => {
  const { email, password } = req.body;

  console.log('Admin login attempt for:', email);

  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await query(`SELECT * FROM users WHERE email = $1 AND role = 'admin'`, [email]);
    const user = result.rows[0];

    console.log('Admin user found:', !!user);
    if (user) {
      console.log('User role:', user.role);
      console.log('User status:', user.status);
    }

    if (!user) {
      console.log('No admin user found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    console.log('Password match result:', match);

    if (!match) {
      console.log('Password does not match for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, role: user.role });
    console.log('Admin login successful for:', email);
    res.json({ token, message: 'Login successful' });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;