require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./db.sqlite');

// Get admin credentials from environment variables
const phone = process.env.ADMIN_PHONE;
const password = process.env.ADMIN_PASSWORD;

// Validate required environment variables
if (!phone || !password) {
  console.error('Error: ADMIN_PHONE and ADMIN_PASSWORD environment variables are required');
  console.error('Please set them in your .env file or environment');
  process.exit(1);
}

async function seedAdmin() {
  const hash = await bcrypt.hash(password, 10);

  // Create table with current schema (matching database-sqlite.js)
  db.run(
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
    (err) => {
      if (err) return console.error(err.message);

      // Insert admin user with minimal required fields
      db.run(
        `INSERT OR IGNORE INTO users (firstname, lastname, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Admin', 'User', phone, hash, 'admin', 'approved'],
        function(err) {
          if (err) return console.error(err.message);
          console.log(`Admin user seeded successfully!`);
          console.log(`Phone: ${phone}`);
          console.log(`Password: ${password}`);
          console.log(`Admin ID: ${this.lastID}`);
          console.log(`Note: Credentials loaded from environment variables`);
          db.close();
        }
      );
    }
  );
}

seedAdmin();
