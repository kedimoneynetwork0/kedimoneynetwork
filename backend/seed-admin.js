const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Configure dotenv to find the .env file in this directory
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Use path.resolve to ensure the db path is always relative to this file's directory
const db = new sqlite3.Database(path.resolve(__dirname, 'db.sqlite'));

// Use environment variables for security. Fallback for local dev.
const adminEmail = process.env.ADMIN_EMAIL || 'kedimoneynetwork@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error('Error: ADMIN_PASSWORD environment variable is not set. Create a backend/.env file or set it in your hosting provider.');
  process.exit(1);
}

async function seedAdmin() {
  const hash = await bcrypt.hash(adminPassword, 10);

  // Check if admin user already exists to make this script safe to run multiple times
  db.get(`SELECT * FROM users WHERE email = ? AND role = 'admin'`, [adminEmail], (err, row) => {
    if (err) {
      return console.error('Database error checking for admin:', err.message);
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
        if (err) return console.error('Error seeding admin user:', err.message);
        console.log(`Admin user seeded: ${adminEmail}`);
        db.close();
      }
    );
  });
}

seedAdmin();
