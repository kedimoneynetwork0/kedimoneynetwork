const express = require('express');
const multer = require('multer');
const path = require('path');
const { query } = require('../utils/database');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Function to calculate estimated balance for a user
async function calculateEstimatedBalance(userId) {
  try {
    // Get tree plan investments
    const treePlanResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total_tree_plan
      FROM tree_plans
      WHERE user_id = $1 AND status = 'active'
    `, [userId]);

    // Get stake revenue (active stakes with interest)
    const stakeResult = await query(`
      SELECT COALESCE(SUM(amount * (1 + interest_rate)), 0) as total_stake_revenue
      FROM stakes
      WHERE user_id = $1 AND status = 'active'
    `, [userId]);

    // Get savings with interest
    const savingsResult = await query(`
      SELECT COALESCE(SUM(amount * (1 + interest_rate)), 0) as total_savings
      FROM savings
      WHERE user_id = $1 AND status = 'active'
    `, [userId]);

    // Get loan repayments (to subtract)
    const loanRepaymentResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total_loan_repayments
      FROM loan_repayments
      WHERE user_id = $1 AND status = 'completed'
    `, [userId]);

    // Get bonuses
    const bonusResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total_bonuses
      FROM bonuses
      WHERE userId = $1
    `, [userId]);

    const treePlan = parseFloat(treePlanResult.rows[0].total_tree_plan) || 0;
    const stakeRevenue = parseFloat(stakeResult.rows[0].total_stake_revenue) || 0;
    const savings = parseFloat(savingsResult.rows[0].total_savings) || 0;
    const loanRepayments = parseFloat(loanRepaymentResult.rows[0].total_loan_repayments) || 0;
    const bonuses = parseFloat(bonusResult.rows[0].total_bonuses) || 0;

    // Calculate estimated balance: (Tree Plan + Stake Revenue + Savings + Bonuses) - Loan Repayments
    const estimatedBalance = (treePlan + stakeRevenue + savings + bonuses) - loanRepayments;

    return {
      estimatedBalance: Math.max(0, estimatedBalance), // Ensure non-negative
      breakdown: {
        treePlan,
        stakeRevenue,
        savings,
        bonuses,
        loanRepayments,
        totalCredits: treePlan + stakeRevenue + savings + bonuses,
        totalDebits: loanRepayments
      }
    };
  } catch (error) {
    console.error('Error calculating estimated balance:', error);
    return { estimatedBalance: 0, breakdown: {} };
  }
}

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
    const { search } = req.query;
    let queryStr = `SELECT id, firstname, lastname, email, username, status, profile_picture FROM users`;
    let params = [];

    if (search) {
      queryStr += ` WHERE firstname ILIKE $1 OR lastname ILIKE $1 OR email ILIKE $1 OR username ILIKE $1 OR CAST(id AS TEXT) ILIKE $1`;
      params = [`%${search}%`];
    }

    queryStr += ` ORDER BY id DESC`;

    const result = await query(queryStr, params);
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

    // Calculate estimated balance using the new formula
    const balanceCalculation = await calculateEstimatedBalance(userId);

    // Update user's estimated balance in database
    await query(`UPDATE users SET estimated_balance = $1 WHERE id = $2`,
      [balanceCalculation.estimatedBalance, userId]);

    // Add calculated balance to user object
    user.estimated_balance = balanceCalculation.estimatedBalance;
    user.balance_breakdown = balanceCalculation.breakdown;

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

    // Get user's tree plans
    const treePlansResult = await query(`
      SELECT * FROM tree_plans WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);

    // Get user's savings
    const savingsResult = await query(`
      SELECT * FROM savings WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);

    // Get user's loan repayments
    const loanRepaymentsResult = await query(`
      SELECT * FROM loan_repayments WHERE user_id = $1 ORDER BY payment_date DESC
    `, [userId]);

    res.json({
      user: user,
      balanceCalculation: balanceCalculation,
      transactions: transactionsResult.rows,
      stakes: stakesResult.rows,
      withdrawals: withdrawalsResult.rows,
      bonuses: bonusesResult.rows,
      treePlans: treePlansResult.rows,
      savings: savingsResult.rows,
      loanRepayments: loanRepaymentsResult.rows
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
        // Handle different transaction types according to the new balance calculation formula
        if (txn.type === 'tree_plan') {
          // Add to tree_plans table
          const treesPlanted = Math.floor(txn.amount / 100); // Assuming 100 RWF per tree
          await query(`INSERT INTO tree_plans (user_id, amount, trees_planted, status) VALUES ($1, $2, $3, $4)`,
            [txn.user_id, txn.amount, treesPlanted, 'active']);

          // Add referral bonus if amount >= 1000
          if (txn.amount >= 1000) {
            const bonusAmount = Math.floor(txn.amount * 0.1);
            await query(`INSERT INTO bonuses (userId, amount, description) VALUES ($1, $2, $3)`,
              [txn.user_id, bonusAmount, `Referral bonus for tree plan transaction #${txnId}`]);
          }
        } else if (txn.type === 'saving') {
          // Add to savings table
          const maturityDate = new Date();
          maturityDate.setFullYear(maturityDate.getFullYear() + 1); // 1 year maturity
          await query(`INSERT INTO savings (user_id, amount, maturity_date, status) VALUES ($1, $2, $3, $4)`,
            [txn.user_id, txn.amount, maturityDate.toISOString(), 'active']);
        } else if (txn.type === 'stake') {
          // Stakes are already handled in the stakes table, just ensure they're active
          await query(`UPDATE stakes SET status = 'active' WHERE user_id = $1 AND amount = $2 AND status = 'pending'`,
            [txn.user_id, txn.amount]);
        } else if (txn.type === 'loan_repayment') {
          // Add to loan_repayments table (this will reduce the balance)
          await query(`INSERT INTO loan_repayments (user_id, amount, status) VALUES ($1, $2, $3)`,
            [txn.user_id, txn.amount, 'completed']);
        }

        // Recalculate estimated balance after transaction approval
        const balanceCalculation = await calculateEstimatedBalance(txn.user_id);
        await query(`UPDATE users SET estimated_balance = $1 WHERE id = $2`,
          [balanceCalculation.estimatedBalance, txn.user_id]);

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

router.get('/messages', adminMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        m.*,
        u.firstname as user_firstname,
        u.lastname as user_lastname,
        u.email as user_email,
        a.firstname as admin_firstname,
        a.lastname as admin_lastname
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN users a ON m.admin_id = a.id
      ORDER BY m.created_at DESC
    `);
    const rows = result.rows;
    res.json({ messages: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/messages/:id/read', adminMiddleware, async (req, res) => {
  const messageId = req.params.id;
  try {
    await query(`UPDATE messages SET is_read = true WHERE id = $1`, [messageId]);
    res.json({ message: 'Message marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Company assets with database-level calculations for maximum performance
router.get('/company-assets', adminMiddleware, async (req, res) => {
  try {
    // Single optimized SQL query that calculates everything at database level
    const calculationsQuery = await query(`
      SELECT
        -- User statistics (database aggregation)
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE status = 'approved') as approved_users,
        (SELECT COUNT(*) FROM users WHERE status = 'approved' AND estimated_balance > 0) as active_users,

        -- Transaction statistics (database aggregation)
        (SELECT COUNT(*) FROM transactions) as total_transactions,
        (SELECT COUNT(*) FROM transactions WHERE status = 'approved') as approved_transactions,
        (SELECT COUNT(*) FROM transactions WHERE status = 'pending') as pending_transactions,

        -- Financial calculations with proper deposit logic (database aggregation)
        -- Deposits: tree_plan + saving + deposit + investment (only approved)
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE status = 'approved' AND type IN ('tree_plan', 'saving', 'deposit', 'investment')) as total_deposits,

        -- All approved transactions (for backward compatibility)
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'approved') as total_approved_transactions,

        -- Withdrawals from transactions table
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE status = 'approved' AND type = 'withdrawal') as transaction_withdrawals,

        -- Approved withdrawal records
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'approved') as approved_withdrawals,

        -- Pending withdrawal records
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'pending') as pending_withdrawals,

        -- Stakes and bonuses
        (SELECT COALESCE(SUM(amount), 0) FROM stakes WHERE status = 'active') as active_stakes,
        (SELECT COALESCE(SUM(amount), 0) FROM bonuses) as total_bonuses,

        -- User balances
        (SELECT COALESCE(SUM(estimated_balance), 0) FROM users WHERE status = 'approved') as total_user_balances
    `);

    const calc = calculationsQuery.rows[0];

    // Parse all values from database results
    const totalDeposits = parseFloat(calc.total_deposits) || 0;
    const totalApprovedTransactions = parseFloat(calc.total_approved_transactions) || 0;
    const transactionWithdrawals = parseFloat(calc.transaction_withdrawals) || 0;
    const approvedWithdrawals = parseFloat(calc.approved_withdrawals) || 0;
    const pendingWithdrawals = parseFloat(calc.pending_withdrawals) || 0;
    const activeStakes = parseFloat(calc.active_stakes) || 0;
    const totalBonuses = parseFloat(calc.total_bonuses) || 0;
    const totalUserBalances = parseFloat(calc.total_user_balances) || 0;

    // Calculate derived metrics
    // Assets = Deposits + Active Stakes + User Balances
    const totalAssets = totalDeposits + activeStakes + totalUserBalances;

    // Liabilities = All Withdrawals + Bonuses Paid
    const totalLiabilities = approvedWithdrawals + pendingWithdrawals + totalBonuses;

    // Net Assets = Assets - Liabilities
    const netAssets = totalAssets - totalLiabilities;

    res.json({
      // Asset breakdown (database-calculated)
      assets: {
        totalDeposits,              // 500 + 1000 = 1500 (your example)
        totalActiveStakes: activeStakes,
        totalUserBalances,
        totalAssets
      },

      // Liability breakdown (database-calculated)
      liabilities: {
        totalApprovedWithdrawals: approvedWithdrawals,
        totalPendingWithdrawals: pendingWithdrawals,
        totalBonuses,
        totalLiabilities
      },

      // Net position (calculated from database results)
      netAssets,

      // User statistics (database-aggregated)
      users: {
        totalUsers: parseInt(calc.total_users) || 0,
        approvedUsers: parseInt(calc.approved_users) || 0,
        activeUsers: parseInt(calc.active_users) || 0
      },

      // Transaction statistics (database-aggregated)
      transactions: {
        totalTransactions: parseInt(calc.total_transactions) || 0,
        approvedTransactions: parseInt(calc.approved_transactions) || 0,
        pendingTransactions: parseInt(calc.pending_transactions) || 0
      },

      // Summary with ratios (calculated from database results)
      summary: {
        totalAssets,
        totalLiabilities,
        netAssets,
        assetToLiabilityRatio: totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : 'N/A',
        profitMargin: totalDeposits > 0 ? ((netAssets / totalDeposits) * 100).toFixed(2) : '0.00'
      },

      // Database calculation metadata
      calculatedAt: new Date().toISOString(),
      calculationMethod: 'database_aggregation',
      performance: 'optimized'
    });
  } catch (err) {
    console.error('Database calculation error:', err);
    res.status(500).json({
      message: 'Server error calculating company assets',
      error: err.message,
      calculationMethod: 'failed'
    });
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