const express = require('express');
const multer = require('multer');
const path = require('path');
const { query } = require('../utils/database');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and PDF files are allowed!'));
    }
  }
});

// Admin user management
router.get('/pending-users', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT id, email, firstname, lastname FROM users WHERE status = 'pending'`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/approve', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { approve } = req.body;

  if (approve === undefined) {
    return res.status(400).json({ message: 'Approve field is required' });
  }

  const newStatus = approve ? 'approved' : 'rejected';

  try {
    await query(`UPDATE users SET status = $1 WHERE id = $2`, [newStatus, userId]);
    res.json({ message: `User ${approve ? 'approved' : 'rejected'} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT id, firstname, lastname, email, username, status, profile_picture FROM users ORDER BY id DESC`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:id/details', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    // Get user basic info
    const userResult = await query(`
      SELECT id, firstname, lastname, phone, email, username, referralId, idNumber, role, status, profile_picture
      FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user's transactions
    const transactionsResult = await query(`
      SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);

    // Get user's stakes
    const stakesResult = await query(`
      SELECT * FROM stakes WHERE user_id = $1 ORDER BY start_date DESC
    `, [userId]);

    // Get user's withdrawals
    const withdrawalsResult = await query(`
      SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY request_date DESC
    `, [userId]);

    // Get user's bonuses
    const bonusesResult = await query(`
      SELECT * FROM bonuses WHERE userId = $1 ORDER BY created_at DESC
    `, [userId]);

    res.json({
      user: user,
      transactions: transactionsResult.rows,
      stakes: stakesResult.rows,
      withdrawals: withdrawalsResult.rows,
      bonuses: bonusesResult.rows
    });
  } catch (err) {
    console.error('Error getting user details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Transaction management
router.get('/pending-transactions', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.type, t.amount, t.txn_id, t.status, t.created_at, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'pending'
      ORDER BY t.created_at DESC
    `);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/transactions/:id/approve', adminMiddleware, async (req, res) => {
  const txnId = req.params.id;
  const { approve } = req.body;

  if (approve === undefined) {
    return res.status(400).json({ message: 'Approve field is required' });
  }

  const newStatus = approve ? 'approved' : 'rejected';

  try {
    await query(`UPDATE transactions SET status = $1 WHERE id = $2`, [newStatus, txnId]);

    if (approve) {
      const txnResult = await query(`SELECT user_id, type, amount FROM transactions WHERE id = $1`, [txnId]);
      const txn = txnResult.rows[0];

      if (txn) {
        // Calculate estimated balance for tree_plan and saving transactions
        let estimatedBalanceIncrease = 0;

        if (txn.type === 'tree_plan') {
          // Tree plan: 10% bonus + principal amount
          const bonusAmount = Math.floor(txn.amount * 0.1);
          estimatedBalanceIncrease = txn.amount + bonusAmount;

          // Add referral bonus if amount >= 1000
          if (txn.amount >= 1000) {
            await query(`INSERT INTO bonuses (userId, amount, description) VALUES ($1, $2, $3)`,
              [txn.user_id, bonusAmount, `Referral bonus for transaction #${txnId}`]);
          }
        } else if (txn.type === 'saving') {
          // Saving: principal amount with interest
          // Assuming 5% annual interest for savings
          const interestRate = 0.05;
          const interestAmount = Math.floor(txn.amount * interestRate);
          estimatedBalanceIncrease = txn.amount + interestAmount;
        } else if (txn.type === 'loan') {
          // Loan: just add the principal amount (no interest for loans)
          estimatedBalanceIncrease = txn.amount;
        }

        // Update user's estimated balance
        if (estimatedBalanceIncrease > 0) {
          await query(`UPDATE users SET estimated_balance = estimated_balance + $1 WHERE id = $2`,
            [estimatedBalanceIncrease, txn.user_id]);
        }

        // Send notification message to user
        const messageText = `Your ${txn.type} transaction of ${txn.amount} RWF has been approved. Your estimated balance has been updated.`;
        await query(
          `INSERT INTO messages (user_id, admin_id, subject, message, type, activity_type, activity_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [txn.user_id, req.user.id, 'Transaction Approved', messageText, 'notification', 'transaction', txnId]
        );
      }
    } else {
      // Send rejection message
      const txnResult = await query(`SELECT user_id, type, amount FROM transactions WHERE id = $1`, [txnId]);
      const txn = txnResult.rows[0];

      if (txn) {
        const messageText = `Your ${txn.type} transaction of ${txn.amount} RWF has been rejected. Please contact support for more information.`;
        await query(
          `INSERT INTO messages (user_id, admin_id, subject, message, type, activity_type, activity_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [txn.user_id, req.user.id, 'Transaction Rejected', messageText, 'notification', 'transaction', txnId]
        );
      }
    }
    res.json({ message: `Transaction ${approve ? 'approved' : 'rejected'} successfully` });
  } catch (err) {
    console.error('Error processing transaction approval:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/transactions', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.type, t.amount, t.txn_id, t.status, t.created_at, u.email, u.firstname, u.lastname
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:id/transactions', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await query(`SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Withdrawal management
router.get('/withdrawals/pending', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT w.*, u.email, u.firstname, u.lastname, s.amount as stake_amount, s.stake_period
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      JOIN stakes s ON w.stake_id = s.id
      WHERE w.status = 'pending'
      ORDER BY w.request_date DESC
    `);
    const rows = result.rows;
    res.json({ withdrawals: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/withdrawals/:id/approve', adminMiddleware, async (req, res) => {
  const withdrawalId = req.params.id;
  const { approve } = req.body;

  if (approve === undefined) {
    return res.status(400).json({ message: 'Approve field is required' });
  }

  const newStatus = approve ? 'approved' : 'rejected';
  const processedDate = new Date().toISOString();

  try {
    await query(`UPDATE withdrawals SET status = $1, processed_date = $2 WHERE id = $3`,
      [newStatus, processedDate, withdrawalId]);

    // Send notification message to user
    const withdrawalResult = await query(`SELECT user_id, amount FROM withdrawals WHERE id = $1`, [withdrawalId]);
    const withdrawal = withdrawalResult.rows[0];

    if (withdrawal) {
      const messageText = approve
        ? `Your withdrawal request of ${withdrawal.amount} RWF has been approved and processed.`
        : `Your withdrawal request of ${withdrawal.amount} RWF has been rejected. Please contact support for more information.`;

      await query(
        `INSERT INTO messages (user_id, admin_id, subject, message, type, activity_type, activity_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [withdrawal.user_id, req.user.id, `Withdrawal ${approve ? 'Approved' : 'Rejected'}`, messageText, 'notification', 'withdrawal', withdrawalId]
      );
    }

    res.json({ message: `Withdrawal ${approve ? 'approved' : 'rejected'} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Message management
router.post('/messages', adminMiddleware, async (req, res) => {
  const { userId, subject, message, type, activityType, activityId } = req.body;
  const adminId = req.user.id;

  if (!userId || !subject || !message) {
    return res.status(400).json({ message: 'User ID, subject, and message are required' });
  }

  try {
    const result = await query(
      `INSERT INTO messages (user_id, admin_id, subject, message, type, activity_type, activity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, adminId, subject, message, type || 'notification', activityType, activityId]
    );
    res.json({ message: 'Message sent successfully', id: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:id/messages', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await query(`
      SELECT m.*, u.firstname as admin_firstname, u.lastname as admin_lastname
      FROM messages m
      LEFT JOIN users u ON m.admin_id = u.id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
    `, [userId]);
    const rows = result.rows;
    res.json({ messages: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Company assets
router.get('/company-assets', adminMiddleware, async (req, res) => {
  try {
    const queries = [
      query(`SELECT SUM(amount) as totalTransactions FROM transactions WHERE status = 'approved'`),
      query(`SELECT SUM(amount) as totalStakes FROM stakes`),
      query(`SELECT SUM(amount) as totalWithdrawals FROM withdrawals WHERE status = 'approved'`),
      query(`SELECT SUM(amount) as totalBonuses FROM bonuses`),
      query(`SELECT COUNT(*) as totalUsers FROM users`),
      query(`SELECT COUNT(*) as approvedUsers FROM users WHERE status = 'approved'`),
    ];

    const results = await Promise.all(queries);

    res.json({
      totalTransactions: results[0].rows[0].totalTransactions || 0,
      totalStakes: results[1].rows[0].totalStakes || 0,
      totalWithdrawals: results[2].rows[0].totalWithdrawals || 0,
      totalBonuses: results[3].rows[0].totalBonuses || 0,
      totalUsers: results[4].rows[0].totalUsers || 0,
      approvedUsers: results[5].rows[0].approvedUsers || 0,
    });
  } catch (err) {
    console.error('Failed to get company assets:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CSV Download functionality
function generateCSV(data, headers) {
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

// Download users list as CSV
router.get('/download/users', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, firstname, lastname, phone, email, username, referralId, idNumber, role, status, profile_picture, estimated_balance
      FROM users
      ORDER BY id DESC
    `);

    const users = result.rows;

    // Define CSV headers
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'Username',
      'Referral ID',
      'ID Number',
      'Role',
      'Status',
      'Profile Picture',
      'Estimated Balance'
    ];

    // Map database fields to CSV headers
    const csvData = users.map(user => ({
      'ID': user.id,
      'First Name': user.firstname,
      'Last Name': user.lastname,
      'Phone': user.phone,
      'Email': user.email,
      'Username': user.username,
      'Referral ID': user.referralId || '',
      'ID Number': user.idNumber,
      'Role': user.role,
      'Status': user.status,
      'Profile Picture': user.profile_picture || '',
      'Estimated Balance': user.estimated_balance || 0
    }));

    const csvContent = generateCSV(csvData, headers);

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="kedi_users_${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvContent);
  } catch (err) {
    console.error('Error generating users CSV:', err);
    res.status(500).json({ message: 'Server error generating CSV' });
  }
});

// Download transactions history as CSV
router.get('/download/transactions', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        t.id,
        t.type,
        t.amount,
        t.txn_id,
        t.status,
        t.created_at,
        u.firstname,
        u.lastname,
        u.email,
        u.username
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);

    const transactions = result.rows;

    // Define CSV headers
    const headers = [
      'Transaction ID',
      'Type',
      'Amount (RWF)',
      'Transaction Reference',
      'Status',
      'Date Created',
      'User First Name',
      'User Last Name',
      'User Email',
      'Username'
    ];

    // Map database fields to CSV headers
    const csvData = transactions.map(txn => ({
      'Transaction ID': txn.id,
      'Type': txn.type,
      'Amount (RWF)': txn.amount,
      'Transaction Reference': txn.txn_id,
      'Status': txn.status,
      'Date Created': new Date(txn.created_at).toLocaleString(),
      'User First Name': txn.firstname,
      'User Last Name': txn.lastname,
      'User Email': txn.email,
      'Username': txn.username
    }));

    const csvContent = generateCSV(csvData, headers);

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="kedi_transactions_${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvContent);
  } catch (err) {
    console.error('Error generating transactions CSV:', err);
    res.status(500).json({ message: 'Server error generating CSV' });
  }
});

module.exports = router;