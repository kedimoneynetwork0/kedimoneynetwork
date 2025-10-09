const { query } = require('./backend/utils/database');
const bcrypt = require('bcrypt');

async function seedAdminAndTestUsers() {
  try {
    console.log('🌱 Seeding admin and test users...');

    // Seed admin user
    const adminEmail = 'kedimoneynetwork@gmail.com';
    const adminPassword = 'kedi@123';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    try {
      await query(
        `INSERT INTO users (firstname, lastname, phone, email, username, password, referralId, idNumber, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        ['Admin', 'User', '0000000000', adminEmail, 'admin', adminHash, null, '0000000000', 'admin', 'approved']
      );
      console.log(`✅ Admin user seeded: ${adminEmail} / ${adminPassword}`);
    } catch (err) {
      console.log('Admin user already exists or error:', err.message);
    }

    // Seed test user
    const testEmail = 'test@example.com';
    const testPassword = 'test123';
    const testHash = await bcrypt.hash(testPassword, 10);

    try {
      await query(
        `INSERT INTO users (firstname, lastname, phone, email, username, password, referralId, idNumber, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        ['Test', 'User', '+250788123456', testEmail, 'testuser', testHash, null, '123456789', 'user', 'approved']
      );
      console.log(`✅ Test user seeded: ${testEmail} / ${testPassword}`);
    } catch (err) {
      console.log('Test user already exists or error:', err.message);
    }

    // Seed sample transactions for test user
    try {
      const testUserResult = await query(`SELECT id FROM users WHERE email = $1`, [testEmail]);
      if (testUserResult.rows.length > 0) {
        const testUserId = testUserResult.rows[0].id;

        // Sample transactions
        const transactions = [
          { type: 'tree_plan', amount: 50000, status: 'approved' },
          { type: 'saving', amount: 25000, status: 'approved' },
          { type: 'loan', amount: 10000, status: 'approved' }
        ];

        for (const txn of transactions) {
          await query(
            `INSERT INTO transactions (user_id, type, amount, txn_id, status)
             VALUES ($1, $2, $3, $4, $5)`,
            [testUserId, txn.type, txn.amount, `TXN${Date.now()}${Math.random()}`, txn.status]
          );
        }

        console.log('✅ Sample transactions seeded for test user');
      }
    } catch (err) {
      console.log('Error seeding transactions:', err.message);
    }

    console.log('🎉 Seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: kedimoneynetwork@gmail.com / kedi@123');
    console.log('User: test@example.com / test123');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    process.exit(0);
  }
}

seedAdminAndTestUsers();