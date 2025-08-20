const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');

dotenv.config();

const app = express();

// --- PostgreSQL Connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});


// Trust the first proxy hop (Render's load balancer)
app.set('trust proxy', 1);

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images, videos, and PDFs
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and PDF files are allowed!'));
    }
  }
});

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));
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

// Create tables once with full schema
const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
    CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firstname TEXT,
    lastname TEXT,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT,
    referralId TEXT,
    idNumber TEXT,
    role TEXT,
    status TEXT
  )`);

    await client.query(`
    CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    type TEXT,
    amount INTEGER,
    txn_id TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`);

    await client.query(`
    CREATE TABLE IF NOT EXISTS bonuses (
    id SERIAL PRIMARY KEY,
    userId INTEGER,
    amount INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`);

    await client.query(`
    CREATE TABLE IF NOT EXISTS password_reset_requests (
    id SERIAL PRIMARY KEY,
    userId INTEGER,
    email TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`);

    await client.query(`
    CREATE TABLE IF NOT EXISTS stakes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    amount INTEGER,
    stake_period INTEGER, -- 30, 90, or 180 days
    interest_rate REAL, -- Interest rate for this stake
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE, -- Calculated end date based on stake_period
    status TEXT DEFAULT 'active', -- active, completed, withdrawn
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

    await client.query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    stake_id INTEGER,
    amount INTEGER,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    processed_date TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (stake_id) REFERENCES stakes (id)
  )`);

    await client.query(`
    CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    media_url TEXT,
    media_type TEXT,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`);
    console.log('Tables created or already exist.');
  } catch (err) {
    console.error('Error creating tables', err.stack);
  } finally {
    client.release();
  }
};

// --- Seeding Admin User ---
async function seedAdmin() {
  // Use environment variables for security. Fallback for local dev.
  const adminEmail = process.env.ADMIN_EMAIL || 'kedimoneynetwork@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('Error: ADMIN_PASSWORD environment variable is not set. Create a backend/.env file or set it in your hosting provider.');
    return; // Don't exit the whole app, just log the error
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  // Check if admin user already exists to make this script safe to run multiple times
  try {
    const res = await pool.query(`SELECT * FROM users WHERE email = $1 AND role = 'admin'`, [adminEmail]);
    const row = res.rows[0];
    if (row) {
      // Admin user already exists, do nothing.
      return;
    }

    // Use the full schema from your main app to avoid conflicts
    await pool.query(
      `INSERT INTO users (firstname, lastname, phone, email, username, password, referralId, idNumber, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      ['Admin', 'User', '0000000000', adminEmail, 'admin', hash, null, '0000000000', 'admin', 'approved']
    );
    console.log(`Admin user seeded: ${adminEmail}`);
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
}

// Middleware to verify JWT and role
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// Admin middleware
function adminMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    req.user = decoded;
    next();
  });
}

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstname, lastname, phone, email, username, password, referralId, idNumber } = req.body;

    // Required fields except referralId
    const requiredFields = { firstname, lastname, phone, email, username, password, idNumber };

    for (let [key, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === '') {
        return res.status(400).json({ message: `${key} is required` });
      }
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long, include a number and a special character' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert into database
    try {
      await pool.query(
        `INSERT INTO users (firstname, lastname, phone, email, username, password, referralId, idNumber, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [firstname, lastname, phone, email, username, hash, referralId || null, idNumber, 'user', 'pending']
      );
        res.json({ message: 'Signup successful, wait for admin approval' });
    } catch (err) {
      if (err.code === '23505') { // PostgreSQL unique violation
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
app.post('/api/auth/login', userLoginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.status !== 'approved') return res.status(403).json({ message: 'User not approved yet' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, role: user.role, status: user.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login
app.post('/api/auth/admin-login', adminLoginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  // Basic validations (email format and password complexity)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) return res.status(400).json({ message: 'Password does not meet complexity requirements' });

  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1 AND role = 'admin'`, [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// User routes
// Get user bonus
app.get('/api/user/bonus', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`SELECT SUM(amount) as totalBonus FROM bonuses WHERE userId = $1`, [userId]);
    const row = result.rows[0];
    res.json({ totalBonus: row.totalBonus || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user dashboard data (transactions)
app.get('/api/user/dashboard', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    const rows = result.rows;
    res.json({ transactions: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`SELECT firstname, lastname, phone, email, username, "referralid" as "referralId", "idnumber" as "idNumber" FROM users WHERE id = $1`, [userId]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: 'User not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create transaction
app.post('/api/transactions', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { type, amount, txn_id } = req.body;
  
  // Validate input
  if (!type || !amount || !txn_id) {
    return res.status(400).json({ message: 'Type, amount, and transaction ID are required' });
  }
  
  // Validate amount is a positive number
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, txn_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, type, amount, txn_id, 'pending']
    );
    res.json({ message: 'Transaction submitted for approval', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
app.post('/api/user/change-password', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old password and new password are required' });
  }
  
  // Password complexity validation for new password
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long, include a number and a special character' });
  }
  
  try {
    // Get current user
    const result = await pool.query(`SELECT password FROM users WHERE id = $1`, [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check old password
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Old password is incorrect' });

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Request password reset
app.post('/api/user/request-password-reset', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  
  try {
    const result = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // In a real app, you would send an email to the user with a reset link
    // For now, we'll just create a record in the password_reset_requests table
    await pool.query(`INSERT INTO password_reset_requests (userId, email) VALUES ($1, $2)`, [user.id, email]);
    res.json({ message: 'Password reset request submitted. Contact admin for reset.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// News routes
// Get all news (public)
app.get('/api/news', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM news ORDER BY created_at DESC`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
// Get pending users
app.get('/api/admin/pending-users', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, email, firstname, lastname FROM users WHERE status = 'pending'`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending transactions
app.get('/api/admin/pending-transactions', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT t.id, t.type, t.amount, t.txn_id, t.status, t.created_at, u.email
           FROM transactions t
           JOIN users u ON t.user_id = u.id
           WHERE t.status = 'pending'
           ORDER BY t.created_at DESC`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create news (admin only) with media support
app.post('/api/admin/news', adminMiddleware, upload.single('media'), async (req, res) => {
  const { title, content } = req.body;
  const author = req.user.id; // Use admin's user ID as author
  
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }
  
  let mediaUrl = null;
  let mediaType = null;
  
  if (req.file) {
    mediaUrl = `/uploads/${req.file.filename}`;
    mediaType = req.file.mimetype.split('/')[0]; // 'image', 'video', or 'application' (for PDF)
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO news (title, content, media_url, media_type, author) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [title, content, mediaUrl, mediaType, author]
    );
    res.json({ message: 'News created successfully', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update news (admin only) with media support
app.put('/api/admin/news/:id', adminMiddleware, upload.single('media'), async (req, res) => {
  const newsId = req.params.id;
  const { title, content } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }
  
  let mediaUrl = null;
  let mediaType = null;
  
  if (req.file) {
    mediaUrl = `/uploads/${req.file.filename}`;
    mediaType = req.file.mimetype.split('/')[0]; // 'image', 'video', or 'application' (for PDF)
  }
  
  // If there's a new media file, update media fields
  try {
    let result;
    if (req.file) {
      result = await pool.query(
        `UPDATE news SET title = $1, content = $2, media_url = $3, media_type = $4 WHERE id = $5`,
        [title, content, mediaUrl, mediaType, newsId]
      );
    } else {
      // No new media file, just update title and content
      result = await pool.query(
        `UPDATE news SET title = $1, content = $2 WHERE id = $3`,
        [title, content, newsId]
      );
    }
    if (result.rowCount === 0) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'News updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete news (admin only)
app.delete('/api/admin/news/:id', adminMiddleware, async (req, res) => {
  const newsId = req.params.id;
  try {
    const result = await pool.query(`DELETE FROM news WHERE id = $1`, [newsId]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'News deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, firstname, lastname, email, username, status FROM users`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user transactions (admin only)
app.get('/api/admin/users/:id/transactions', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await pool.query(`SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions (admin only)
app.get('/api/admin/transactions', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT t.id, t.type, t.amount, t.txn_id, t.status, t.created_at, u.email
           FROM transactions t
           JOIN users u ON t.user_id = u.id
           ORDER BY t.created_at DESC`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject user
app.put('/api/admin/users/:id/approve', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { approve } = req.body;
  
  if (approve === undefined) {
    return res.status(400).json({ message: 'Approve field is required' });
  }
  
  const newStatus = approve ? 'approved' : 'rejected';
  
  try {
    await pool.query(`UPDATE users SET status = $1 WHERE id = $2`, [newStatus, userId]);
    res.json({ message: `User ${approve ? 'approved' : 'rejected'} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject transaction
app.put('/api/admin/transactions/:id/approve', adminMiddleware, async (req, res) => {
  const txnId = req.params.id;
  const { approve } = req.body;
  
  if (approve === undefined) {
    return res.status(400).json({ message: 'Approve field is required' });
  }
  
  const newStatus = approve ? 'approved' : 'rejected';
  
  try {
    await pool.query(`UPDATE transactions SET status = $1 WHERE id = $2`, [newStatus, txnId]);

    // If approved and it's a referral transaction, add bonus
    if (approve) {
      // Get transaction details
      const txnResult = await pool.query(`SELECT user_id, type, amount FROM transactions WHERE id = $1`, [txnId]);
      const txn = txnResult.rows[0];

      if (txn) {
        // Add bonus for referral transactions (10% of amount)
        if (txn.type === 'tree_plan' && txn.amount >= 1000) {
          const bonusAmount = Math.floor(txn.amount * 0.1);
          await pool.query(`INSERT INTO bonuses (userId, amount, description) VALUES ($1, $2, $3)`,
            [txn.user_id, bonusAmount, `Referral bonus for transaction #${txnId}`]);
        }
      }
    }
    res.json({ message: `Transaction ${approve ? 'approved' : 'rejected'} successfully` });
  } catch (err) {
    console.error('Error processing transaction approval:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User stake routes
  // Create stake deposit
  app.post('/api/user/stakes', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { amount, stakePeriod } = req.body;
    
    // Validate input
    if (!amount || !stakePeriod) {
      return res.status(400).json({ message: 'Amount and stake period are required' });
    }
    
    // Validate amount is a positive number
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    
    // Validate stake period is one of the allowed values (30, 90, 180)
    const allowedPeriods = [30, 90, 180];
    if (!allowedPeriods.includes(stakePeriod)) {
      return res.status(400).json({ message: 'Invalid stake period. Must be 30, 90, or 180 days' });
    }
    
    // Calculate interest rate based on stake period (example rates)
    let interestRate;
    switch (stakePeriod) {
      case 30:
        interestRate = 0.05; // 5% for 30 days
        break;
      case 90:
        interestRate = 0.15; // 15% for 90 days
        break;
      case 180:
        interestRate = 0.30; // 30% for 180 days
        break;
      default:
        interestRate = 0;
    }
    
    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + stakePeriod);
    
    try {
      const result = await pool.query(
        `INSERT INTO stakes (user_id, amount, stake_period, interest_rate, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userId, amount, stakePeriod, interestRate, endDate.toISOString()]
      );
      res.json({ message: 'Stake deposit created successfully', id: result.rows[0].id });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get user stakes
  app.get('/api/user/stakes', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
      const result = await pool.query(`SELECT * FROM stakes WHERE user_id = $1 ORDER BY start_date DESC`, [userId]);
      const rows = result.rows;
      res.json({ stakes: rows });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Request withdrawal
  app.post('/api/user/withdrawals', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { stakeId } = req.body;
    
    if (!stakeId) {
      return res.status(400).json({ message: 'Stake ID is required' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const stakeResult = await client.query(`SELECT * FROM stakes WHERE id = $1 AND user_id = $2 FOR UPDATE`, [stakeId, userId]);
      const stake = stakeResult.rows[0];

      if (!stake) return res.status(404).json({ message: 'Stake not found' });
      
      const currentDate = new Date();
      const endDate = new Date(stake.end_date);
      if (currentDate < endDate) {
        return res.status(400).json({ message: 'Stake has not matured yet' });
      }
      
      if (stake.status === 'withdrawn') {
        return res.status(400).json({ message: 'Stake already withdrawn' });
      }
      
      const principal = stake.amount;
      const interest = Math.floor(principal * stake.interest_rate);
      const totalAmount = principal + interest;
      
      await client.query(`UPDATE stakes SET status = 'withdrawn' WHERE id = $1`, [stakeId]);
      
      const withdrawalResult = await client.query(
        `INSERT INTO withdrawals (user_id, stake_id, amount) VALUES ($1, $2, $3) RETURNING id`,
        [userId, stakeId, totalAmount]
      );

      await client.query('COMMIT');
      res.json({ 
        message: 'Withdrawal request submitted successfully', 
        id: withdrawalResult.rows[0].id,
        amount: totalAmount
      });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ message: 'Server error during withdrawal' });
    } finally {
      client.release();
    }
  });

  // Get user withdrawals
  app.get('/api/user/withdrawals', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
      const result = await pool.query(`SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY request_date DESC`, [userId]);
      const rows = result.rows;
      res.json({ withdrawals: rows });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Admin withdrawal routes
  // Get pending withdrawals
  app.get('/api/admin/withdrawals/pending', adminMiddleware, async (req, res) => {
    try {
      const result = await pool.query(`SELECT w.*, u.email, s.amount as stake_amount, s.stake_period
             FROM withdrawals w
             JOIN users u ON w.user_id = u.id
             JOIN stakes s ON w.stake_id = s.id
             WHERE w.status = 'pending'
             ORDER BY w.request_date DESC`);
      const rows = result.rows;
      res.json({ withdrawals: rows });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Approve/reject withdrawal
  app.put('/api/admin/withdrawals/:id/approve', adminMiddleware, async (req, res) => {
    const withdrawalId = req.params.id;
    const { approve } = req.body;
    
    if (approve === undefined) {
      return res.status(400).json({ message: 'Approve field is required' });
    }
    
    const newStatus = approve ? 'approved' : 'rejected';
    const processedDate = new Date().toISOString();
    
    try {
      await pool.query(`UPDATE withdrawals SET status = $1, processed_date = $2 WHERE id = $3`, 
        [newStatus, processedDate, withdrawalId]);
      res.json({ message: `Withdrawal ${approve ? 'approved' : 'rejected'} successfully` });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Admin company assets route
  // Get company financial summary
  app.get('/api/admin/company-assets', adminMiddleware, async (req, res) => {
    try {
      const queries = [
        pool.query(`SELECT SUM(amount) as totalTransactions FROM transactions WHERE status = 'approved'`),
        pool.query(`SELECT SUM(amount) as totalStakes FROM stakes`),
        pool.query(`SELECT SUM(amount) as totalWithdrawals FROM withdrawals WHERE status = 'approved'`),
        pool.query(`SELECT SUM(amount) as totalBonuses FROM bonuses`),
        pool.query(`SELECT COUNT(*) as totalUsers FROM users`),
        pool.query(`SELECT COUNT(*) as approvedUsers FROM users WHERE status = 'approved'`),
      ];

      const results = await Promise.all(queries);

      res.json({
        totalTransactions: results[0].rows[0].totaltransactions || 0,
        totalStakes: results[1].rows[0].totalstakes || 0,
        totalWithdrawals: results[2].rows[0].totalwithdrawals || 0,
        totalBonuses: results[3].rows[0].totalbonuses || 0,
        totalUsers: results[4].rows[0].totalusers || 0,
        approvedUsers: results[5].rows[0].approvedusers || 0,
      });
    } catch (err) {
      console.error('Failed to get company assets:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// This block must come AFTER all other API routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (process.env.NODE_ENV === 'production') {
  // Serve the static files from the React app
  app.use(express.static(path.join(__dirname, '..', 'dist')));

  // Handles any requests that don't match the API ones above
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // Create tables and then seed the admin user
  createTables().then(() => {
    seedAdmin();
  });
  console.log(`Backend listening on port ${PORT}`);
});
