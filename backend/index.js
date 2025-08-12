const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
const db = new sqlite3.Database('./db.sqlite');

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
app.use('/uploads', express.static('uploads'));

// Rate limiters
const userLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
});
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
});

// Create tables once with full schema
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstname TEXT,
    lastname TEXT,
    phone TEXT,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT,
    referralId TEXT,
    idNumber TEXT,
    role TEXT,
    status TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    amount INTEGER,
    txn_id TEXT,
    status TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bonuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    amount INTEGER,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS password_reset_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    email TEXT,
    requested_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    media_url TEXT,
    media_type TEXT,
    author TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
});

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
    db.run(
      `INSERT INTO users (firstname, lastname, phone, email, username, password, referralId, idNumber, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstname, lastname, phone, email, username, hash, referralId || null, idNumber, 'user', 'pending'],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ message: 'Email or username already exists' });
          }
          return res.status(500).json({ message: 'Server error' });
        }
        res.json({ message: 'Signup successful, wait for admin approval' });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Login (user)
app.post('/api/auth/login', userLoginLimiter, (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.status !== 'approved') return res.status(403).json({ message: 'User not approved yet' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ token, role: user.role, status: user.status });
  });
});

// Admin login
app.post('/api/auth/admin-login', adminLoginLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  // Basic validations (email format and password complexity)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) return res.status(400).json({ message: 'Password does not meet complexity requirements' });

  db.get(`SELECT * FROM users WHERE email = ? AND role = 'admin'`, [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ token });
  });
});


// User routes
// Get user bonus
app.get('/api/user/bonus', authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  db.get(`SELECT SUM(amount) as totalBonus FROM bonuses WHERE userId = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ totalBonus: row.totalBonus || 0 });
  });
});

// Get user dashboard data (transactions)
app.get('/api/user/dashboard', authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  db.all(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ transactions: rows });
  });
});

// Get user profile
app.get('/api/user/profile', authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  db.get(`SELECT firstname, lastname, phone, email, username, referralId, idNumber FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!row) return res.status(404).json({ message: 'User not found' });
    res.json(row);
  });
});

// Create transaction
app.post('/api/transactions', authMiddleware, (req, res) => {
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
  
  db.run(
    `INSERT INTO transactions (user_id, type, amount, txn_id, status) VALUES (?, ?, ?, ?, ?)`,
    [userId, type, amount, txn_id, 'pending'],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Transaction submitted for approval', id: this.lastID });
    }
  );
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
  
  // Get current user
  db.get(`SELECT password FROM users WHERE id = ?`, [userId], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check old password
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Old password is incorrect' });
    
    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hash, userId], (err) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Password updated successfully' });
    });
  });
});

// Request password reset
app.post('/api/user/request-password-reset', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  
  db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // In a real app, you would send an email to the user with a reset link
    // For now, we'll just create a record in the password_reset_requests table
    db.run(`INSERT INTO password_reset_requests (userId, email) VALUES (?, ?)`, [user.id, email], (err) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Password reset request submitted. Contact admin for reset.' });
    });
  });
});

// News routes
// Get all news (public)
app.get('/api/news', (req, res) => {
  db.all(`SELECT * FROM news ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

// Admin routes
// Get pending users
app.get('/api/admin/pending-users', adminMiddleware, (req, res) => {
  db.all(`SELECT id, email, firstname, lastname FROM users WHERE status = 'pending'`, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

// Get pending transactions
app.get('/api/admin/pending-transactions', adminMiddleware, (req, res) => {
  db.all(`SELECT t.id, t.type, t.amount, t.txn_id, t.status, t.created_at, u.email
           FROM transactions t
           JOIN users u ON t.user_id = u.id
           WHERE t.status = 'pending'
           ORDER BY t.created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

// Create news (admin only) with media support
app.post('/api/admin/news', adminMiddleware, upload.single('media'), (req, res) => {
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
  
  db.run(
    `INSERT INTO news (title, content, media_url, media_type, author) VALUES (?, ?, ?, ?, ?)`,
    [title, content, mediaUrl, mediaType, author],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'News created successfully', id: this.lastID });
    }
  );
});

// Update news (admin only) with media support
app.put('/api/admin/news/:id', adminMiddleware, upload.single('media'), (req, res) => {
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
  if (req.file) {
    db.run(
      `UPDATE news SET title = ?, content = ?, media_url = ?, media_type = ? WHERE id = ?`,
      [title, content, mediaUrl, mediaType, newsId],
      function (err) {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (this.changes === 0) return res.status(404).json({ message: 'News not found' });
        res.json({ message: 'News updated successfully' });
      }
    );
  } else {
    // No new media file, just update title and content
    db.run(
      `UPDATE news SET title = ?, content = ? WHERE id = ?`,
      [title, content, newsId],
      function (err) {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (this.changes === 0) return res.status(404).json({ message: 'News not found' });
        res.json({ message: 'News updated successfully' });
      }
    );
  }
});

// Delete news (admin only)
app.delete('/api/admin/news/:id', adminMiddleware, (req, res) => {
  const newsId = req.params.id;
  
  db.run(`DELETE FROM news WHERE id = ?`, [newsId], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'News deleted successfully' });
  });
});

// Get all users (admin only)
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  db.all(`SELECT id, firstname, lastname, email, username, status FROM users`, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

// Get user transactions (admin only)
app.get('/api/admin/users/:id/transactions', adminMiddleware, (req, res) => {
  const userId = req.params.id;
  
  db.all(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

// Get all transactions (admin only)
app.get('/api/admin/transactions', adminMiddleware, (req, res) => {
  db.all(`SELECT t.id, t.type, t.amount, t.txn_id, t.status, t.created_at, u.email
           FROM transactions t
           JOIN users u ON t.user_id = u.id
           ORDER BY t.created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

// Approve/reject user
app.put('/api/admin/users/:id/approve', adminMiddleware, (req, res) => {
  const userId = req.params.id;
  const { approve } = req.body;
  
  if (approve === undefined) {
    return res.status(400).json({ message: 'Approve field is required' });
  }
  
  const newStatus = approve ? 'approved' : 'rejected';
  
  db.run(`UPDATE users SET status = ? WHERE id = ?`, [newStatus, userId], (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ message: `User ${approve ? 'approved' : 'rejected'} successfully` });
  });
});

// Approve/reject transaction
app.put('/api/admin/transactions/:id/approve', adminMiddleware, (req, res) => {
  const txnId = req.params.id;
  const { approve } = req.body;
  
  if (approve === undefined) {
    return res.status(400).json({ message: 'Approve field is required' });
  }
  
  const newStatus = approve ? 'approved' : 'rejected';
  
  db.run(`UPDATE transactions SET status = ? WHERE id = ?`, [newStatus, txnId], (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    
    // If approved and it's a referral transaction, add bonus
    if (approve) {
      // Get transaction details
      db.get(`SELECT user_id, type, amount FROM transactions WHERE id = ?`, [txnId], (err, txn) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        
        // Add bonus for referral transactions (10% of amount)
        if (txn.type === 'tree_plan' && txn.amount >= 1000) {
          const bonusAmount = Math.floor(txn.amount * 0.1);
          db.run(`INSERT INTO bonuses (userId, amount, description) VALUES (?, ?, ?)`,
            [txn.user_id, bonusAmount, `Referral bonus for transaction #${txnId}`], (err) => {
              if (err) console.error('Error adding bonus:', err);
          });
        }
        
        res.json({ message: `Transaction ${approve ? 'approved' : 'rejected'} successfully` });
      });
    } else {
      res.json({ message: `Transaction ${approve ? 'approved' : 'rejected'} successfully` });
    }
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
