const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Configure dotenv to find the .env file in the same directory as this script
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const db = new sqlite3.Database('./db.sqlite');

// Use environment variables for security
const adminEmail = process.env.ADMIN_EMAIL || 'kedimoneynetwork@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error('Error: ADMIN_PASSWORD environment variable is not set in backend/.env');
  process.exit(1);
}

async function seedAdmin() {
  const hash = await bcrypt.hash(adminPassword, 10);

  db.get(`SELECT * FROM users WHERE email = ?`, [adminEmail], (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    if (row) {
      console.log('Admin user already exists.');
      db.close();
      return;
    }

    // Use the full schema from your main app to avoid conflicts
    db.run(
      `INSERT INTO users (firstname, lastname, phone, email, username, password, referralId, idNumber, role, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Admin', 'User', '0000000000', adminEmail, 'admin', hash, null, '0000000000', 'admin', 'approved'],
      function (err) {
        if (err) return console.error(err.message);
        console.log(`Admin user seeded: ${adminEmail}`);
        db.close();
      }
    );
  });
}

seedAdmin();
