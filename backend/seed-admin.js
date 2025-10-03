require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('./utils/database');

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
  try {
    const hash = await bcrypt.hash(password, 10);

    // Check if admin user already exists
    const existingAdmin = await query(
      `SELECT id FROM users WHERE phone = $1 AND role = $2`,
      [phone, 'admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Insert admin user with minimal required fields
    const result = await query(
      `INSERT INTO users (firstname, lastname, phone, email, username, password, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      ['Admin', 'User', phone, 'admin@kedi.com', 'admin', hash, 'admin', 'approved']
    );

    console.log(`Admin user seeded successfully!`);
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);
    console.log(`Admin ID: ${result.rows[0].id}`);
    console.log(`Note: Credentials loaded from environment variables`);

  } catch (err) {
    console.error('Error seeding admin user:', err.message);
    process.exit(1);
  }
}

seedAdmin();
