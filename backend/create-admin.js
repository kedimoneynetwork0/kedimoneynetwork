require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('./utils/database');

async function createAdminUser() {
  try {
    const phone = process.env.ADMIN_PHONE || '0788123456';
    const password = process.env.ADMIN_PASSWORD || 'kedi@123';

    console.log('Creating admin user...');
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);

    // Check if admin already exists
    const existingAdmin = await query(
      `SELECT id FROM users WHERE phone = $1 AND role = $2`,
      [phone, 'admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists!');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Insert admin user
    const result = await query(
      `INSERT INTO users (firstname, lastname, phone, password, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING id`,
      ['Admin', 'User', phone, hashedPassword, 'admin', 'approved']
    );

    console.log(`✅ Admin user created successfully!`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 Admin ID: ${result.rows[0].id}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };