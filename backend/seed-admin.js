const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./db.sqlite');

const phone = '0788123456'; // Admin phone number
const password = 'kedi@123';

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
          db.close();
        }
      );
    }
  );
}

seedAdmin();
