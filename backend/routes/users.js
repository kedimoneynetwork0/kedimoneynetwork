const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const { query } = require('../utils/database-sqlite');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

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
    // Accept images, videos, and PDFs
    if (file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and PDF files are allowed!'));
    }
  }
});

// User routes
router.get('/bonus', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT SUM(amount) as totalBonus FROM bonuses WHERE userId = ?`, [userId]);
    const row = result.rows[0];
    res.json({ totalBonus: row.totalBonus || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dashboard', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    // Get transactions with database-level calculations
    const transactionsQuery = await query(`
      SELECT * FROM transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);

    // Calculate total deposits (tree_plan + saving) - database level
    const depositsQuery = await query(`
      SELECT COALESCE(SUM(amount), 0) as total_deposits
      FROM transactions
      WHERE user_id = ?
      AND status = 'approved'
      AND type IN ('tree_plan', 'saving', 'deposit', 'investment')
    `, [userId]);

    // Calculate total withdrawals - database level
    const withdrawalsQuery = await query(`
      SELECT COALESCE(SUM(amount), 0) as total_withdrawals
      FROM transactions
      WHERE user_id = ?
      AND status = 'approved'
      AND type = 'withdrawal'
    `, [userId]);

    // Calculate total loan repayments - database level
    const loansQuery = await query(`
      SELECT COALESCE(SUM(amount), 0) as total_loans
      FROM transactions
      WHERE user_id = ?
      AND status = 'approved'
      AND type = 'loan'
    `, [userId]);

    // Calculate active stakes and interest - database level
    const stakesQuery = await query(`
      SELECT
        COALESCE(SUM(amount), 0) as total_stakes,
        COALESCE(SUM(amount * interest_rate * (stake_period / 365.0)), 0) as total_interest
      FROM stakes
      WHERE user_id = ? AND status = 'active'
    `, [userId]);

    // Calculate referral bonus (5,000 per referral) - database level
    const referralQuery = await query(`
      SELECT COUNT(*) * 5000 as referral_bonus
      FROM users
      WHERE referralId IS NOT NULL
      AND id = ?
    `, [userId]);

    const transactions = transactionsQuery.rows;
    const totalDeposits = parseFloat(depositsQuery.rows[0].total_deposits) || 0;
    const totalWithdrawals = parseFloat(withdrawalsQuery.rows[0].total_withdrawals) || 0;
    const totalLoans = parseFloat(loansQuery.rows[0].total_loans) || 0;
    const totalStakes = parseFloat(stakesQuery.rows[0].total_stakes) || 0;
    const totalInterest = parseFloat(stakesQuery.rows[0].total_interest) || 0;
    const referralBonus = parseFloat(referralQuery.rows[0].referral_bonus) || 0;

    // Calculate final balance: Deposits + Referral Bonus + Stakes Interest - Withdrawals - Loan Repayments
    const calculatedBalance = totalDeposits + referralBonus + totalInterest - totalWithdrawals - totalLoans;

    res.json({
      transactions: transactions,
      calculations: {
        totalDeposits,
        totalWithdrawals,
        totalLoans,
        totalStakes,
        totalInterest,
        referralBonus,
        calculatedBalance: Math.max(0, calculatedBalance), // Ensure non-negative
        breakdown: {
          deposits: totalDeposits,
          withdrawals: totalWithdrawals,
          loans: totalLoans,
          stakes: totalStakes,
          interest: totalInterest,
          referralBonus: referralBonus
        }
      }
    });
  } catch (err) {
    console.error('Dashboard calculation error:', err);
    res.status(500).json({ message: 'Server error calculating dashboard data' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT firstname, lastname, phone, email, username, referralId, idNumber, profile_picture, estimated_balance FROM users WHERE id = ?`, [userId]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: 'User not found' });

    // Generate referral ID if user doesn't have one
    if (!row.referralId) {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const countryCode = 'RW';
      const companyPrefix = 'KEDI';

      // Get the next sequential number
      const countResult = await query('SELECT COUNT(*) as count FROM users WHERE referral_id IS NOT NULL');
      const userCount = countResult.rows[0].count;
      const sequentialNumber = (userCount + 1).toString().padStart(3, '0');

      const newReferralId = `${companyPrefix}${sequentialNumber}${countryCode}${currentYear}`;

      // Update user with new referral ID
      await query(`UPDATE users SET referralId = ?, referral_id = ? WHERE id = ?`, [newReferralId, newReferralId, userId]);
      row.referralId = newReferralId;
    }

    res.json(row);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old password and new password are required' });
  }

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long, include a number and a special character' });
  }

  try {
    const result = await query(`SELECT password FROM users WHERE id = ?`, [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Old password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE users SET password = ? WHERE id = ?`, [hash, userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/upload-profile-picture', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const profilePictureUrl = `/uploads/${req.file.filename}`;

  try {
    await query(`UPDATE users SET profile_picture = ? WHERE id = ?`, [profilePictureUrl, userId]);
    res.json({ message: 'Profile picture uploaded successfully', profilePicture: profilePictureUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User Stake routes
router.post('/stakes', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { amount, stakePeriod } = req.body;

  // Validate input
  if (!amount || !stakePeriod) {
    return res.status(400).json({ message: 'Amount and stake period are required' });
  }

  // Validate amount is a positive number
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  // Validate stake period is one of the allowed values (30, 90, 180)
  const allowedPeriods = [30, 90, 180];
  if (!allowedPeriods.includes(stakePeriod)) {
    return res.status(400).json({ message: 'Invalid stake period. Must be 30, 90, or 180 days' });
  }

  // Calculate interest rate based on stake period (example rates)
  let interestRate;
  switch (stakePeriod) {
    case 30:
      interestRate = 0.05; // 5% for 30 days
      break;
    case 90:
      interestRate = 0.15; // 15% for 90 days
      break;
    case 180:
      interestRate = 0.30; // 30% for 180 days
      break;
    default:
      interestRate = 0;
  }

  // Calculate end date
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + stakePeriod);

  try {
    const result = await query(
      `INSERT INTO stakes (user_id, amount, stake_period, interest_rate, end_date) VALUES (?, ?, ?, ?, ?)`,
      [userId, amount, stakePeriod, interestRate, endDate.toISOString()]
    );
    res.json({ message: 'Stake deposit created successfully', id: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stakes', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT * FROM stakes WHERE user_id = ? ORDER BY start_date DESC`, [userId]);
    const rows = result.rows;
    res.json({ stakes: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/withdrawals', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Umubare wamafaranga ushaka kubikura ni ngombwa kandi ugomba kuba umubare uhagije' });
  }

  try {
    // Check user eligibility for withdrawal (3 months registration + 2000 RWF/month savings)
    const userResult = await query(`SELECT created_at FROM users WHERE id = ?`, [userId]);
    const user = userResult.rows[0];

    if (!user) return res.status(404).json({ message: 'User not found' });

    const currentDate = new Date();
    const registrationDate = new Date(user.created_at);
    const monthsSinceRegistration = Math.floor((currentDate - registrationDate) / (1000 * 60 * 60 * 24 * 30));

    // User must be registered for at least 3 months
    if (monthsSinceRegistration < 3) {
      return res.status(400).json({
        message: `Kwemererwa gukoresha serivise ya KEDI bisaba kuba umpaje amezi atatu wizigama byibura 2000RWF buri kwezi. Uratwaye amezi ${monthsSinceRegistration} gusa.`
      });
    }

    // Check if user has saved at least 2000 RWF per month for the past 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const savingsQuery = await query(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        SUM(amount) as monthly_savings
      FROM transactions
      WHERE user_id = ?
        AND status = 'approved'
        AND type IN ('tree_plan', 'saving', 'deposit', 'investment')
        AND created_at >= ?
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `, [userId, threeMonthsAgo.toISOString()]);

    const monthlySavings = savingsQuery.rows;

    // Check if user has at least 2000 RWF savings for each of the past 3 months
    let eligibleMonths = 0;
    for (let i = 0; i < 3; i++) {
      const targetMonth = new Date();
      targetMonth.setMonth(targetMonth.getMonth() - i);
      const targetMonthStr = targetMonth.toISOString().substring(0, 7); // YYYY-MM format

      const monthData = monthlySavings.find(m => m.month === targetMonthStr);
      if (monthData && parseFloat(monthData.monthly_savings) >= 2000) {
        eligibleMonths++;
      }
    }

    if (eligibleMonths < 3) {
      return res.status(400).json({
        message: `Kwemererwa gukoresha serivise ya KEDI bisaba kuba umpaje amezi atatu wizigama byibura 2000RWF buri kwezi. Uratwaye amezi ${eligibleMonths} gusa ahagije.`
      });
    }

    // Calculate user's current estimated balance
    const balanceQuery = await query(`
      SELECT
        -- Deposits: tree_plan + saving + deposit + investment
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE user_id = ? AND status = 'approved'
         AND type IN ('tree_plan', 'saving', 'deposit', 'investment')) as total_deposits,

        -- Withdrawals
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE user_id = ? AND status = 'approved' AND type = 'withdrawal') as total_withdrawals,

        -- Loan repayments
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE user_id = ? AND status = 'approved' AND type = 'loan') as total_loans,

        -- Active stakes and interest
        (SELECT COALESCE(SUM(amount), 0) FROM stakes
         WHERE user_id = ? AND status = 'active') as total_stakes,

        (SELECT COALESCE(SUM(amount * interest_rate * (stake_period / 365.0)), 0) FROM stakes
         WHERE user_id = ? AND status = 'active') as total_interest,

        -- Referral bonus (5,000 per approved referral)
        (SELECT COUNT(*) * 5000 FROM users WHERE referralId IS NOT NULL AND id = ?) as referral_bonus
    `, [userId, userId, userId, userId, userId, userId]);

    const calc = balanceQuery.rows[0];

    const totalDeposits = parseFloat(calc.total_deposits) || 0;
    const totalWithdrawals = parseFloat(calc.total_withdrawals) || 0;
    const totalLoans = parseFloat(calc.total_loans) || 0;
    const totalStakes = parseFloat(calc.total_stakes) || 0;
    const totalInterest = parseFloat(calc.total_interest) || 0;
    const referralBonus = parseFloat(calc.referral_bonus) || 0;

    // Calculate available balance: Deposits + Referral Bonus + Stakes Interest - Withdrawals - Loan Repayments
    const availableBalance = totalDeposits + referralBonus + totalInterest - totalWithdrawals - totalLoans;

    // Check if requested amount doesn't exceed available balance
    if (amount > availableBalance) {
      return res.status(400).json({
        message: `Umubare wamafaranga ushaka kubikura (${amount} RWF) urenze amafaranga ufite kuri konti yawe (${availableBalance.toLocaleString()} RWF)`
      });
    }

    // Create withdrawal request (pending approval)
    const withdrawalResult = await query(
      `INSERT INTO withdrawals (user_id, amount, status, request_date) VALUES (?, ?, 'pending', NOW())`,
      [userId, amount]
    );

    res.json({
      message: 'Icypuramutungo cyo kubikura cyoherejwe neza. Tega ko cyemererwa nuyobozi.',
      id: withdrawalResult.lastID,
      amount: amount,
      status: 'pending'
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ message: 'Server error during withdrawal request' });
  }
});

router.get('/withdrawals', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT * FROM withdrawals WHERE user_id = ? ORDER BY request_date DESC`, [userId]);
    const rows = result.rows;
    res.json({ withdrawals: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User Savings routes
router.get('/savings', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT * FROM savings WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    const rows = result.rows;
    res.json({ savings: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/savings/withdraw', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { savingsId, amount } = req.body;

  if (!savingsId || !amount) {
    return res.status(400).json({ message: 'Savings ID and amount are required' });
  }

  // Validate amount is a positive number
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  try {
    // Get savings details
    const savingsResult = await query(`SELECT * FROM savings WHERE id = ? AND user_id = ?`, [savingsId, userId]);
    const savings = savingsResult.rows[0];

    if (!savings) return res.status(404).json({ message: 'Savings account not found' });

    // Check if savings has matured (if there's a maturity date)
    if (savings.maturity_date) {
      const currentDate = new Date();
      const maturityDate = new Date(savings.maturity_date);
      if (currentDate < maturityDate) {
        return res.status(400).json({ message: 'Savings has not matured yet' });
      }
    }

    // Check if withdrawal amount doesn't exceed available balance
    if (amount > savings.amount) {
      return res.status(400).json({ message: 'Withdrawal amount exceeds available savings balance' });
    }

    // Create savings withdrawal record (similar to stake withdrawal)
    const withdrawalResult = await query(
      `INSERT INTO savings_withdrawals (user_id, savings_id, amount, request_date) VALUES (?, ?, ?, NOW())`,
      [userId, savingsId, amount]
    );

    // Update savings balance
    await query(`UPDATE savings SET amount = amount - ? WHERE id = ?`, [amount, savingsId]);

    res.json({
      message: 'Savings withdrawal request submitted successfully',
      id: withdrawalResult.lastID,
      amount: amount
    });
  } catch (err) {
    console.error('Savings withdrawal error:', err);
    res.status(500).json({ message: 'Server error during savings withdrawal' });
  }
});

// Message routes
router.get('/messages', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`
      SELECT m.*, u.firstname as admin_firstname, u.lastname as admin_lastname
      FROM messages m
      LEFT JOIN users u ON m.admin_id = u.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
    `, [userId]);
    const rows = result.rows;
    res.json({ messages: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/messages/:id/read', authMiddleware, async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;

  try {
    await query(`UPDATE messages SET is_read = true WHERE id = ? AND user_id = ?`, [messageId, userId]);
    res.json({ message: 'Message marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Quick balance calculation endpoint for real-time updates
router.get('/balance', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    // Single optimized query for balance calculation
    const balanceQuery = await query(`
      SELECT
        -- Deposits: tree_plan + saving + deposit + investment
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE user_id = ? AND status = 'approved'
         AND type IN ('tree_plan', 'saving', 'deposit', 'investment')) as total_deposits,

        -- Withdrawals
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE user_id = ? AND status = 'approved' AND type = 'withdrawal') as total_withdrawals,

        -- Loan repayments
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE user_id = ? AND status = 'approved' AND type = 'loan') as total_loans,

        -- Active stakes and interest
        (SELECT COALESCE(SUM(amount), 0) FROM stakes
         WHERE user_id = ? AND status = 'active') as total_stakes,

        (SELECT COALESCE(SUM(amount * interest_rate * (stake_period / 365.0)), 0) FROM stakes
         WHERE user_id = ? AND status = 'active') as total_interest,

        -- Referral bonus (5,000 per approved referral)
        (SELECT COUNT(*) * 5000 FROM users WHERE referralId IS NOT NULL AND id = ?) as referral_bonus
    `, [userId]);

    const calc = balanceQuery.rows[0];

    const totalDeposits = parseFloat(calc.total_deposits) || 0;
    const totalWithdrawals = parseFloat(calc.total_withdrawals) || 0;
    const totalLoans = parseFloat(calc.total_loans) || 0;
    const totalStakes = parseFloat(calc.total_stakes) || 0;
    const totalInterest = parseFloat(calc.total_interest) || 0;
    const referralBonus = parseFloat(calc.referral_bonus) || 0;

    // Balance calculation: Deposits + Referral Bonus + Stakes Interest - Withdrawals - Loan Repayments
    const calculatedBalance = totalDeposits + referralBonus + totalInterest - totalWithdrawals - totalLoans;

    res.json({
      balance: Math.max(0, calculatedBalance),
      breakdown: {
        deposits: totalDeposits,
        withdrawals: totalWithdrawals,
        loans: totalLoans,
        stakes: totalStakes,
        interest: totalInterest,
        referralBonus: referralBonus
      },
      calculatedAt: new Date().toISOString(),
      method: 'database_optimized'
    });
  } catch (err) {
    console.error('Balance calculation error:', err);
    res.status(500).json({ message: 'Error calculating balance' });
  }
});

module.exports = router;