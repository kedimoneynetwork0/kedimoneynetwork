const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const dbUtils = process.env.NODE_ENV === 'production'
  ? require('./utils/database')
  : require('./utils/database-sqlite');

const { query: rawQuery } = dbUtils;

// Helper function to handle different query syntaxes
const query = (sql, params = []) => {
  if (process.env.NODE_ENV === 'production') {
    // PostgreSQL syntax - already correct
    return rawQuery(sql, params);
  } else {
    // SQLite syntax - convert $1, $2, etc. to ?
    let convertedSql = sql;
    const convertedParams = [];

    // Replace $N with ? in order from highest to lowest to avoid conflicts
    const paramNumbers = [];
    const paramRegex = /\$(\d+)/g;
    let match;
    while ((match = paramRegex.exec(sql)) !== null) {
      paramNumbers.push(parseInt(match[1]));
    }

    // Remove duplicates and sort descending
    const uniqueParamNumbers = [...new Set(paramNumbers)].sort((a, b) => b - a);

    for (const num of uniqueParamNumbers) {
      const regex = new RegExp(`\\$${num}`, 'g');
      convertedSql = convertedSql.replace(regex, '?');
      if (params[num - 1] !== undefined) {
        convertedParams.push(params[num - 1]);
      }
    }

    // If no $ parameters found, use params as-is
    if (convertedParams.length === 0 && params.length > 0) {
      convertedParams.push(...params);
    }

    return rawQuery(convertedSql, convertedParams);
  }
};

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));

// Set correct MIME type for JavaScript modules
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news');
const transactionRoutes = require('./routes/transactions');

// Create tables
const createTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstname TEXT,
      lastname TEXT,
      phone TEXT,
      email TEXT,
      username TEXT UNIQUE,
      password TEXT,
      referralId TEXT,
      idNumber TEXT,
      role TEXT,
      status TEXT,
      profile_picture TEXT,
      estimated_balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      amount REAL,
      txn_id TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS bonuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      amount REAL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      email TEXT,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS stakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL,
      stake_period INTEGER,
      interest_rate REAL,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      stake_id INTEGER,
      amount REAL,
      request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      processed_date DATETIME,
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
      author INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author) REFERENCES users (id)
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (admin_id) REFERENCES users (id)
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS savings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL,
      interest_rate REAL DEFAULT 0.05,
      maturity_date DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS savings_withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      savings_id INTEGER,
      amount REAL,
      request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      processed_date DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (savings_id) REFERENCES savings (id)
    )`);

    // Tree Plan table for tree planting investments
    await query(`
      CREATE TABLE IF NOT EXISTS tree_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL,
      trees_planted INTEGER,
      location TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Loan Repayment table for tracking loan repayments
    await query(`
      CREATE TABLE IF NOT EXISTS loan_repayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      loan_id INTEGER,
      amount REAL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'completed',
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    console.log('Tables created or already exist.');
  } catch (err) {
    console.error('Error creating tables', err);
  }
};

// Seed admin user
async function seedAdmin() {
  const adminPhone = process.env.ADMIN_PHONE || '0795772698';
  const adminPassword = process.env.ADMIN_PASSWORD;

  console.log('Seeding admin user...');
  console.log('Admin Phone:', adminPhone);
  console.log('Admin Password set:', !!adminPassword);

  if (!adminPassword) {
    console.error('Error: ADMIN_PASSWORD environment variable is not set.');
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  try {
    const res = await query(`SELECT * FROM users WHERE phone = ? AND role = ?`, [adminPhone, 'admin']);
    const row = res.rows[0];
    if (row) {
      console.log('Admin user already exists');
      return;
    }

    await query(
      `INSERT INTO users (firstname, lastname, phone, username, password, referralId, idNumber, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Admin', 'User', adminPhone, 'admin', hash, null, '0000000000', 'admin', 'approved']
    );
    console.log(`Admin user seeded successfully: ${adminPhone}`);
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
}

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/transactions', transactionRoutes);

// All routes are now handled by modular route files above

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Debug endpoint to check admin user status
app.get('/api/debug/admin-status', async (req, res) => {
  try {
    const result = await query(`SELECT id, phone, role, status FROM users WHERE role = ?`, ['admin']);
    const adminUsers = result.rows;

    const envCheck = {
      ADMIN_PHONE: process.env.ADMIN_PHONE || '0795772698',
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV
    };

    res.json({
      adminUsers: adminUsers,
      environment: envCheck,
      totalUsers: (await query(`SELECT COUNT(*) as count FROM users`)).rows[0].count
    });
  } catch (err) {
    console.error('Debug endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server only if this file is run directly (not imported for testing)
const PORT = process.env.PORT || 4000;

if (require.main === module) {
  // Test database connection
  query('SELECT 1').then(() => {
    console.log('Database connection successful');
    // Initialize database and start server
    createTables().then(() => {
      seedAdmin();
      app.listen(PORT, () => {
        console.log(`Backend listening on port ${PORT}`);
      });
    }).catch((err) => {
      console.error('Error creating tables:', err.message);
      console.error('Error stack:', err.stack);
      process.exit(1);
    });
  }).catch((err) => {
    console.error('Database connection failed:', err.message);
    console.error('Error stack:', err.stack);
    process.exit(1);
  });
}

// Export app for testing
module.exports = app;