const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { query } = require('../utils/database');
const { generateToken } = require('../middleware/auth');

// Referral ID generator function
const generateReferralId = async () => {
  const currentYear = new Date().getFullYear().toString().slice(-2); // Get last 2 digits of year
  const countryCode = 'RW'; // Rwanda
  const companyPrefix = 'KEDI';

  // Get the next sequential number
  const result = await query('SELECT COUNT(*) as count FROM users');
  const userCount = parseInt(result.rows[0].count) || 0;
  const sequentialNumber = (userCount + 1).toString().padStart(3, '0');

  return `${companyPrefix}${sequentialNumber}${countryCode}${currentYear}`;
};

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
    const { firstname, lastname, phone, email, username, password, referralId, idNumber, province, district, sector, cell, village } = req.body;

    const requiredFields = { firstname, lastname, phone, email, username, password, idNumber, province, district, sector, cell, village };
    for (let [key, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === '') {
        return res.status(400).json({ message: `${key} is required` });
      }
    }

    // Validate phone number format (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }

    // Check if phone number is already taken
    const phoneCheck = await query(`SELECT id FROM users WHERE phone = $1`, [phone]);
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email is already taken
    const emailCheck = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check if username is already taken
    const usernameCheck = await query(`SELECT id FROM users WHERE username = $1`, [username]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long, include a number and a special character' });
    }

    // Validate referral ID if provided
    if (referralId && referralId.trim() !== '') {
      const referralCheck = await query(`SELECT id FROM users WHERE referral_id = $1 AND status = 'approved'`, [referralId.trim()]);
      if (referralCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Referral ID not found or user not approved' });
      }
    }

    const hash = await bcrypt.hash(password, 10);

    // Generate unique referral ID for the new user
    const newReferralId = await generateReferralId();

    try {
      await query(
        `INSERT INTO users (firstname, lastname, phone, email, username, password, referralId, referral_id, idNumber, province, district, sector, cell, village, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [firstname, lastname, phone, email, username, hash, referralId || null, newReferralId, idNumber, province, district, sector, cell, village, 'user', 'pending']
      );
      res.json({
        message: 'Signup successful, wait for admin approval',
        referralId: newReferralId
      });
    } catch (err) {
      console.error('Signup error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Login (user)
router.post('/login', userLoginLimiter, async (req, res) => {
  const { phone, password } = req.body;

  console.log('User login attempt for phone:', phone);

  if (!phone || !password) {
    console.log('Missing phone or password');
    return res.status(400).json({ message: 'Phone number and password are required' });
  }

  // Validate phone number format
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }

  try {
    const result = await query(`SELECT * FROM users WHERE phone = $1`, [phone]);
    const user = result.rows[0];

    console.log('User found:', !!user);
    if (user) {
      console.log('User status:', user.status);
      console.log('User role:', user.role);
    }

    if (!user) {
      console.log('No user found with phone:', phone);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'approved') {
      console.log('User not approved, status:', user.status);
      return res.status(403).json({ message: 'User not approved yet' });
    }

    const match = await bcrypt.compare(password, user.password);
    console.log('Password match result:', match);

    if (!match) {
      console.log('Password does not match for user:', phone);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, role: user.role });
    console.log('User login successful for phone:', phone);
    res.json({ token, role: user.role, status: user.status, message: 'Login successful' });
  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login
router.post('/admin-login', adminLoginLimiter, async (req, res) => {
  const { phone, password } = req.body;

  console.log('Admin login attempt for phone:', phone);

  if (!phone || !password) {
    console.log('Missing phone or password');
    return res.status(400).json({ message: 'Phone number and password are required' });
  }

  // Validate phone number format
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }

  try {
    const result = await query(`SELECT * FROM users WHERE phone = $1 AND role = 'admin'`, [phone]);
    const user = result.rows[0];

    console.log('Admin user found:', !!user);
    if (user) {
      console.log('User role:', user.role);
      console.log('User status:', user.status);
    }

    if (!user) {
      console.log('No admin user found with phone:', phone);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    console.log('Password match result:', match);

    if (!match) {
      console.log('Password does not match for user:', phone);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, role: user.role });
    console.log('Admin login successful for phone:', phone);
    res.json({ token, message: 'Login successful' });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;