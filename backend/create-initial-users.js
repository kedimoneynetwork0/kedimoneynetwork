require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('./utils/database');

async function createInitialUsers() {
  try {
    console.log('🚀 Creating initial users for KEDI Money Network...\n');

    // Create first admin user
    const adminPhone = process.env.ADMIN_PHONE || '0788123456';
    const adminPassword = process.env.ADMIN_PASSWORD || 'kedi@123';

    console.log('📱 Creating admin user...');
    console.log(`Phone: ${adminPhone}`);
    console.log(`Password: ${adminPassword}\n`);

    // Check if admin already exists
    const existingAdmin = await query(
      `SELECT id FROM users WHERE phone = $1 AND role = $2`,
      [adminPhone, 'admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✅ Admin user already exists');
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Insert admin user
      const result = await query(
        `INSERT INTO users (firstname, lastname, phone, password, role, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING id`,
        ['Admin', 'User', adminPhone, hashedPassword, 'admin', 'approved']
      );

      console.log(`✅ Admin user created successfully!`);
      console.log(`🆔 Admin ID: ${result.rows[0].id}\n`);
    }

    // Create a sample user that can be used as referral (ID: 1)
    console.log('👤 Creating sample user for referrals...');

    const sampleUserPhone = '0788123457';
    const sampleUserPassword = 'user@123';

    const existingSample = await query(
      `SELECT id FROM users WHERE phone = $1`,
      [sampleUserPhone]
    );

    if (existingSample.rows.length > 0) {
      console.log('✅ Sample user already exists');
      console.log(`🆔 Sample User ID: ${existingSample.rows[0].id}\n`);
    } else {
      // Hash password
      const hashedSamplePassword = await bcrypt.hash(sampleUserPassword, 10);

      // Insert sample user
      const sampleResult = await query(
        `INSERT INTO users (firstname, lastname, phone, password, referralId, idNumber, province, district, sector, cell, village, role, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
         RETURNING id`,
        ['John', 'Doe', sampleUserPhone, hashedSamplePassword, null, '1234567890', 'Kigali', 'Gasabo', 'Remera', 'Gisimenti', 'Kacyiru', 'user', 'approved']
      );

      console.log(`✅ Sample user created successfully!`);
      console.log(`🆔 Sample User ID: ${sampleResult.rows[0].id}`);
      console.log(`📱 Phone: ${sampleUserPhone}`);
      console.log(`🔑 Password: ${sampleUserPassword}\n`);
    }

    // Show summary
    console.log('🎉 Initial setup complete!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 ADMIN LOGIN:');
    console.log(`   Phone: ${adminPhone}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   URL: https://your-app.railway.app/admin-login`);
    console.log('');
    console.log('👤 SAMPLE USER LOGIN (for testing referrals):');
    console.log(`   Phone: ${sampleUserPhone}`);
    console.log(`   Password: ${sampleUserPassword}`);
    console.log(`   URL: https://your-app.railway.app/login`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Use the Sample User ID as referral ID for new signups!');

  } catch (error) {
    console.error('❌ Error creating initial users:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createInitialUsers();
}

module.exports = { createInitialUsers };