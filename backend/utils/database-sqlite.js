const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite database configuration
const dbPath = path.join(__dirname, '..', 'kedi_money_network.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database');
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

// Database run wrapper for INSERT, UPDATE, DELETE
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// Initialize database tables
const initDatabase = () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
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
      status TEXT,
      profile_picture TEXT,
      estimated_balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      amount REAL,
      txn_id TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,
    `CREATE TABLE IF NOT EXISTS stakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL,
      stake_period INTEGER,
      interest_rate REAL,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,
    `CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      stake_id INTEGER,
      amount REAL,
      request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      processed_date DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (stake_id) REFERENCES stakes (id)
    )`,
    `CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      media_url TEXT,
      media_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS bonuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      admin_id INTEGER,
      message TEXT,
      is_from_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  ];

  tables.forEach(sql => {
    db.run(sql, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      }
    });
  });
};

// Initialize database on module load
initDatabase();

// Graceful shutdown
process.on('SIGINT', () => {
  db.close(() => {
    console.log('SQLite database connection closed');
    process.exit(0);
  });
});

module.exports = {
  db,
  query,
  run
};