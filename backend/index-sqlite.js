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
const sqlite3 = require('sqlite3').verbose();

// Load environment variables
dotenv.config();

const app = express();

// SQLite Database setup
const dbPath = process.env.NODE_ENV === 'production'
  ? './kedi_money_network.db'
  : './kedi_money_network.db';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
    console.error('Database path:', dbPath);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Database query wrapper
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
};

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

// Create tables
const createTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstname TEXT,
      lastname TEXT,
      phone TEXT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT,
      referralId TEXT,
      idNumber TEXT,
      role TEXT,
      status TEXT,
      profile_picture TEXT,
      estimated_balance REAL DEFAULT 0
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      amount INTEGER,
      txn_id TEXT,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS bonuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      amount INTEGER,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      email TEXT,
      requested_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS stakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount INTEGER,
      stake_period INTEGER,
      interest_rate REAL,
      start_date TEXT DEFAULT CURRENT_TIMESTAMP,
      end_date TEXT,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      stake_id INTEGER,
      amount INTEGER,
      request_date TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      processed_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (stake_id) REFERENCES stakes (id)
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      media_url TEXT,
      media_type TEXT,
      author TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      admin_id INTEGER,
      subject TEXT,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      type TEXT DEFAULT 'notification',
      activity_type TEXT,
      activity_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (admin_id) REFERENCES users (id)
    )`);

    console.log('Tables created or already exist.');
  } catch (err) {
    console.error('Error creating tables', err);
  }
};

// Seed admin user
async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'kedimoneynetwork@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  console.log('Seeding admin user...');
  console.log('Admin Email:', adminEmail);
  console.log('Admin Password set:', !!adminPassword);

  if (!adminPassword) {
    console.error('Error: ADMIN_PASSWORD environment variable is not set.');
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  try {
    const res = await query(`SELECT * FROM users WHERE email = ? AND role = 'admin'`, [adminEmail]);
    const row = res.rows[0];
    if (row) {
      console.log('Admin user already exists');
      return;
    }

    await query(
      `INSERT INTO users (firstname, lastname, phone, email, username, password, referralId, idNumber, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Admin', 'User', '0000000000', adminEmail, 'admin', hash, null, '0000000000', 'admin', 'approved']
    );
    console.log(`Admin user seeded successfully: ${adminEmail}`);
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
}

// JWT Secret
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

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
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  });
}

// Routes

// Signup
app.post('/api/auth/signup', async (req, res) => {
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
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
app.post('/api/auth/login', userLoginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query(`SELECT * FROM users WHERE email = ?`, [email]);
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

  console.log('Admin login attempt for:', email);

  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) return res.status(400).json({ message: 'Password does not meet complexity requirements' });

  try {
    const result = await query(`SELECT * FROM users WHERE email = ? AND role = 'admin'`, [email]);
    const user = result.rows[0];

    console.log('Admin user found:', !!user);
    console.log('User role:', user?.role);
    console.log('User status:', user?.status);

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    console.log('Password match:', match);

    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Admin login successful for:', email);
    res.json({ token });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User routes
app.get('/api/user/bonus', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT SUM(amount) as totalBonus FROM bonuses WHERE userId = ?`, [userId]);
    const row = result.rows[0];
    res.json({ totalBonus: row.totalBonus || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/user/dashboard', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    const rows = result.rows;
    res.json({ transactions: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/user/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT firstname, lastname, phone, email, username, referralId, idNumber, profile_picture, estimated_balance FROM users WHERE id = ?`, [userId]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: 'User not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/transactions', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { type, amount, txn_id } = req.body;

  if (!type || !amount || !txn_id) {
    return res.status(400).json({ message: 'Type, amount, and transaction ID are required' });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  try {
    const result = await query(
      `INSERT INTO transactions (user_id, type, amount, txn_id, status) VALUES (?, ?, ?, ?, ?)`,
      [userId, type, amount, txn_id, 'pending']
    );
    res.json({ message: 'Transaction submitted for approval', id: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/user/change-password', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old password and new password are required' });
  }

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long, include a number and a special character' });
  }

  try {
    const result = await query(`SELECT password FROM users WHERE id = ?`, [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Old password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE users SET password = ? WHERE id = ?`, [hash, userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/user/upload-profile-picture', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const profilePictureUrl = `/uploads/${req.file.filename}`;

  try {
    await query(`UPDATE users SET profile_picture = ? WHERE id = ?`, [profilePictureUrl, userId]);
    res.json({ message: 'Profile picture uploaded successfully', profilePicture: profilePictureUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Message routes
// Get user messages
app.get('/api/user/messages', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`
      SELECT m.*, u.firstname as admin_firstname, u.lastname as admin_lastname
      FROM messages m
      LEFT JOIN users u ON m.admin_id = u.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
    `, [userId]);
    const rows = result.rows;
    res.json({ messages: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read
app.put('/api/user/messages/:id/read', authMiddleware, async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;

  try {
    await query(`UPDATE messages SET is_read = 1 WHERE id = ? AND user_id = ?`, [messageId, userId]);
    res.json({ message: 'Message marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Send message to user
app.post('/api/admin/messages', adminMiddleware, async (req, res) => {
  const { userId, subject, message, type, activityType, activityId } = req.body;
  const adminId = req.user.id;

  if (!userId || !subject || !message) {
    return res.status(400).json({ message: 'User ID, subject, and message are required' });
  }

  try {
    const result = await query(
      `INSERT INTO messages (user_id, admin_id, subject, message, type, activity_type, activity_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, adminId, subject, message, type || 'notification', activityType, activityId]
    );
    res.json({ message: 'Message sent successfully', id: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all messages for a user
app.get('/api/admin/users/:id/messages', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await query(`
      SELECT m.*, u.firstname as admin_firstname, u.lastname as admin_lastname
      FROM messages m
      LEFT JOIN users u ON m.admin_id = u.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
    `, [userId]);
    const rows = result.rows;
    res.json({ messages: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// News routes
app.get('/api/news', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM news ORDER BY created_at DESC`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/news', adminMiddleware, upload.single('media'), async (req, res) => {
  const { title, content } = req.body;
  const author = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  let mediaUrl = null;
  let mediaType = null;

  if (req.file) {
    mediaUrl = `/uploads/${req.file.filename}`;
    mediaType = req.file.mimetype.split('/')[0];
  }

  try {
    const result = await query(
      `INSERT INTO news (title, content, media_url, media_type, author) VALUES (?, ?, ?, ?, ?)`,
      [title, content, mediaUrl, mediaType, author]
    );
    res.json({ message: 'News created successfully', id: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

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
    mediaType = req.file.mimetype.split('/')[0];
  }

  try {
    if (req.file) {
      await query(
        `UPDATE news SET title = ?, content = ?, media_url = ?, media_type = ? WHERE id = ?`,
        [title, content, mediaUrl, mediaType, newsId]
      );
    } else {
      await query(
        `UPDATE news SET title = ?, content = ? WHERE id = ?`,
        [title, content, newsId]
      );
    }
    res.json({ message: 'News updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/admin/news/:id', adminMiddleware, async (req, res) => {
  const newsId = req.params.id;
  try {
    await query(`DELETE FROM news WHERE id = ?`, [newsId]);
    res.json({ message: 'News deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
app.get('/api/admin/pending-users', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT id, email, firstname, lastname FROM users WHERE status = 'pending'`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/pending-transactions', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.type, t.amount, t.txn_id, t.status, t.created_at, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'pending'
      ORDER BY t.created_at DESC
    `);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/users/:id/approve', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { approve } = req.body;

  if (approve === undefined) {
    return res.status(400).json({ message: 'Approve field is required' });
  }

  const newStatus = approve ? 'approved' : 'rejected';

  try {
    await query(`UPDATE users SET status = ? WHERE id = ?`, [newStatus, userId]);
    res.json({ message: `User ${approve ? 'approved' : 'rejected'} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/transactions/:id/approve', adminMiddleware, async (req, res) => {
  const txnId = req.params.id;
  const { approve } = req.body;

  if (approve === undefined) {
    return res.status(400).json({ message: 'Approve field is required' });
  }

  const newStatus = approve ? 'approved' : 'rejected';

  try {
    await query(`UPDATE transactions SET status = ? WHERE id = ?`, [newStatus, txnId]);

    if (approve) {
      const txnResult = await query(`SELECT user_id, type, amount FROM transactions WHERE id = ?`, [txnId]);
      const txn = txnResult.rows[0];

      if (txn) {
        // Calculate estimated balance for tree_plan and saving transactions
        let estimatedBalanceIncrease = 0;

        if (txn.type === 'tree_plan') {
          // Tree plan: 10% bonus + principal amount
          const bonusAmount = Math.floor(txn.amount * 0.1);
          estimatedBalanceIncrease = txn.amount + bonusAmount;

          // Add referral bonus if amount >= 1000
          if (txn.amount >= 1000) {
            await query(`INSERT INTO bonuses (userId, amount, description) VALUES (?, ?, ?)`,
              [txn.user_id, bonusAmount, `Referral bonus for transaction #${txnId}`]);
          }
        } else if (txn.type === 'saving') {
          // Saving: principal amount with interest
          // Assuming 5% annual interest for savings
          const interestRate = 0.05;
          const interestAmount = Math.floor(txn.amount * interestRate);
          estimatedBalanceIncrease = txn.amount + interestAmount;
        }

        // Update user's estimated balance
        if (estimatedBalanceIncrease > 0) {
          await query(`UPDATE users SET estimated_balance = estimated_balance + ? WHERE id = ?`,
            [estimatedBalanceIncrease, txn.user_id]);
        }

        // Send notification message to user
        const messageText = `Your ${txn.type} transaction of ${txn.amount} RWF has been approved. Your estimated balance has been updated.`;
        await query(
          `INSERT INTO messages (user_id, admin_id, subject, message, type, activity_type, activity_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [txn.user_id, req.user.id, 'Transaction Approved', messageText, 'notification', 'transaction', txnId]
        );
      }
    } else {
      // Send rejection message
      const txnResult = await query(`SELECT user_id, type, amount FROM transactions WHERE id = ?`, [txnId]);
      const txn = txnResult.rows[0];

      if (txn) {
        const messageText = `Your ${txn.type} transaction of ${txn.amount} RWF has been rejected. Please contact support for more information.`;
        await query(
          `INSERT INTO messages (user_id, admin_id, subject, message, type, activity_type, activity_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [txn.user_id, req.user.id, 'Transaction Rejected', messageText, 'notification', 'transaction', txnId]
        );
      }
    }
    res.json({ message: `Transaction ${approve ? 'approved' : 'rejected'} successfully` });
  } catch (err) {
    console.error('Error processing transaction approval:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT id, firstname, lastname, email, username, status, profile_picture FROM users ORDER BY id DESC`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions (admin only)
app.get('/api/admin/transactions', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.type, t.amount, t.txn_id, t.status, t.created_at, u.email, u.firstname, u.lastname
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
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
    const result = await query(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions (admin only)
app.get('/api/admin/transactions', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.type, t.amount, t.txn_id, t.status, t.created_at, u.email, u.firstname, u.lastname
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
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
    const result = await query(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending withdrawals (admin only)
app.get('/api/admin/withdrawals/pending', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT w.*, u.email, u.firstname, u.lastname, s.amount as stake_amount, s.stake_period
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      JOIN stakes s ON w.stake_id = s.id
      WHERE w.status = 'pending'
      ORDER BY w.request_date DESC
    `);
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
    await query(`UPDATE withdrawals SET status = ?, processed_date = ? WHERE id = ?`,
      [newStatus, processedDate, withdrawalId]);

    // Send notification message to user
    const withdrawalResult = await query(`SELECT user_id, amount FROM withdrawals WHERE id = ?`, [withdrawalId]);
    const withdrawal = withdrawalResult.rows[0];

    if (withdrawal) {
      const messageText = approve
        ? `Your withdrawal request of ${withdrawal.amount} RWF has been approved and processed.`
        : `Your withdrawal request of ${withdrawal.amount} RWF has been rejected. Please contact support for more information.`;

      await query(
        `INSERT INTO messages (user_id, admin_id, subject, message, type, activity_type, activity_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [withdrawal.user_id, req.user.id, `Withdrawal ${approve ? 'Approved' : 'Rejected'}`, messageText, 'notification', 'withdrawal', withdrawalId]
      );
    }

    res.json({ message: `Withdrawal ${approve ? 'approved' : 'rejected'} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get company financial summary
app.get('/api/admin/company-assets', adminMiddleware, async (req, res) => {
  try {
    const queries = [
      query(`SELECT SUM(amount) as totalTransactions FROM transactions WHERE status = 'approved'`),
      query(`SELECT SUM(amount) as totalStakes FROM stakes`),
      query(`SELECT SUM(amount) as totalWithdrawals FROM withdrawals WHERE status = 'approved'`),
      query(`SELECT SUM(amount) as totalBonuses FROM bonuses`),
      query(`SELECT COUNT(*) as totalUsers FROM users`),
      query(`SELECT COUNT(*) as approvedUsers FROM users WHERE status = 'approved'`),
    ];

    const results = await Promise.all(queries);

    res.json({
      totalTransactions: results[0].rows[0].totalTransactions || 0,
      totalStakes: results[1].rows[0].totalStakes || 0,
      totalWithdrawals: results[2].rows[0].totalWithdrawals || 0,
      totalBonuses: results[3].rows[0].totalBonuses || 0,
      totalUsers: results[4].rows[0].totalUsers || 0,
      approvedUsers: results[5].rows[0].approvedUsers || 0,
    });
  } catch (err) {
    console.error('Failed to get company assets:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed user information
app.get('/api/admin/users/:id/details', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    // Get user basic info
    const userResult = await query(`
      SELECT id, firstname, lastname, phone, email, username, referralId, idNumber, role, status, profile_picture
      FROM users WHERE id = ?
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user's transactions
    const transactionsResult = await query(`
      SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC
    `, [userId]);

    // Get user's stakes
    const stakesResult = await query(`
      SELECT * FROM stakes WHERE user_id = ? ORDER BY start_date DESC
    `, [userId]);

    // Get user's withdrawals
    const withdrawalsResult = await query(`
      SELECT * FROM withdrawals WHERE user_id = ? ORDER BY request_date DESC
    `, [userId]);

    // Get user's bonuses
    const bonusesResult = await query(`
      SELECT * FROM bonuses WHERE userId = ? ORDER BY created_at DESC
    `, [userId]);

    res.json({
      user: user,
      transactions: transactionsResult.rows,
      stakes: stakesResult.rows,
      withdrawals: withdrawalsResult.rows,
      bonuses: bonusesResult.rows
    });
  } catch (err) {
    console.error('Error getting user details:', err);
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
    const result = await query(
      `INSERT INTO stakes (user_id, amount, stake_period, interest_rate, end_date) VALUES (?, ?, ?, ?, ?)`,
      [userId, amount, stakePeriod, interestRate, endDate.toISOString()]
    );
    res.json({ message: 'Stake deposit created successfully', id: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user stakes
app.get('/api/user/stakes', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT * FROM stakes WHERE user_id = ? ORDER BY start_date DESC`, [userId]);
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

  const client = await db; // For SQLite, we don't need connection pooling
  try {
    // Get stake details
    const stakeResult = await query(`SELECT * FROM stakes WHERE id = ? AND user_id = ?`, [stakeId, userId]);
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

    // Update stake status
    await query(`UPDATE stakes SET status = 'withdrawn' WHERE id = ?`, [stakeId]);

    // Create withdrawal record
    const withdrawalResult = await query(
      `INSERT INTO withdrawals (user_id, stake_id, amount) VALUES (?, ?, ?)`,
      [userId, stakeId, totalAmount]
    );

    res.json({
      message: 'Withdrawal request submitted successfully',
      id: withdrawalResult.lastID,
      amount: totalAmount
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during withdrawal' });
  }
});

// Get user withdrawals
app.get('/api/user/withdrawals', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT * FROM withdrawals WHERE user_id = ? ORDER BY request_date DESC`, [userId]);
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
    const result = await query(`
      SELECT w.*, u.email, u.firstname, u.lastname, s.amount as stake_amount, s.stake_period
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      JOIN stakes s ON w.stake_id = s.id
      WHERE w.status = 'pending'
      ORDER BY w.request_date DESC
    `);
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
    await query(`UPDATE withdrawals SET status = ?, processed_date = ? WHERE id = ?`,
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
      query(`SELECT SUM(amount) as totalTransactions FROM transactions WHERE status = 'approved'`),
      query(`SELECT SUM(amount) as totalStakes FROM stakes`),
      query(`SELECT SUM(amount) as totalWithdrawals FROM withdrawals WHERE status = 'approved'`),
      query(`SELECT SUM(amount) as totalBonuses FROM bonuses`),
      query(`SELECT COUNT(*) as totalUsers FROM users`),
      query(`SELECT COUNT(*) as approvedUsers FROM users WHERE status = 'approved'`),
    ];

    const results = await Promise.all(queries);

    res.json({
      totalTransactions: results[0].rows[0].totalTransactions || 0,
      totalStakes: results[1].rows[0].totalStakes || 0,
      totalWithdrawals: results[2].rows[0].totalWithdrawals || 0,
      totalBonuses: results[3].rows[0].totalBonuses || 0,
      totalUsers: results[4].rows[0].totalUsers || 0,
      approvedUsers: results[5].rows[0].approvedUsers || 0,
    });
  } catch (err) {
    console.error('Failed to get company assets:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 4000;

// Initialize database and start server
createTables().then(() => {
  seedAdmin();
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
});