const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const { query } = require('./utils/database');

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));

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
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(255),
      lastname VARCHAR(255),
      phone VARCHAR(20),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      referralId VARCHAR(255),
      idNumber VARCHAR(20),
      role VARCHAR(50),
      status VARCHAR(50),
      profile_picture VARCHAR(500),
      estimated_balance DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      type VARCHAR(50),
      amount DECIMAL(10,2),
      txn_id VARCHAR(255),
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS bonuses (
      id SERIAL PRIMARY KEY,
      userId INTEGER REFERENCES users(id),
      amount DECIMAL(10,2),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
      id SERIAL PRIMARY KEY,
      userId INTEGER REFERENCES users(id),
      email VARCHAR(255),
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS stakes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      amount DECIMAL(10,2),
      stake_period INTEGER,
      interest_rate DECIMAL(5,4),
      start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMP,
      status VARCHAR(50) DEFAULT 'active'
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      stake_id INTEGER REFERENCES stakes(id),
      amount DECIMAL(10,2),
      request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending',
      processed_date TIMESTAMP
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500),
      content TEXT,
      media_url VARCHAR(500),
      media_type VARCHAR(50),
      author INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`
      CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      admin_id INTEGER REFERENCES users(id),
      subject VARCHAR(255),
      message TEXT,
      is_read BOOLEAN DEFAULT false,
      type VARCHAR(50) DEFAULT 'notification',
      activity_type VARCHAR(50),
      activity_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tree Plan table for tree planting investments
    await query(`
      CREATE TABLE IF NOT EXISTS tree_plans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      amount DECIMAL(10,2),
      trees_planted INTEGER,
      location VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Savings table for user savings accounts
    await query(`
      CREATE TABLE IF NOT EXISTS savings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      amount DECIMAL(10,2),
      interest_rate DECIMAL(5,4) DEFAULT 0.05,
      maturity_date TIMESTAMP,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Loan Repayment table for tracking loan repayments
    await query(`
      CREATE TABLE IF NOT EXISTS loan_repayments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      loan_id INTEGER,
      amount DECIMAL(10,2),
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'completed'
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
    const res = await query(`SELECT * FROM users WHERE email = $1 AND role = $2`, [adminEmail, 'admin']);
    const row = res.rows[0];
    if (row) {
      console.log('Admin user already exists');
      return;
    }

    await query(
      `INSERT INTO users (firstname, lastname, phone, email, username, password, referralId, idNumber, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      ['Admin', 'User', '0000000000', adminEmail, 'admin', hash, null, '0000000000', 'admin', 'approved']
    );
    console.log(`Admin user seeded successfully: ${adminEmail}`);
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

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Debug endpoint to check admin user status
app.get('/api/debug/admin-status', async (req, res) => {
  try {
    const result = await query(`SELECT id, email, role, status FROM users WHERE role = 'admin'`);
    const adminUsers = result.rows;

    const envCheck = {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'kedimoneynetwork@gmail.com',
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