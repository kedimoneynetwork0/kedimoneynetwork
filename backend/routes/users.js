const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const { query } = require('../utils/database');
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
    const result = await query(`SELECT SUM(amount) as totalBonus FROM bonuses WHERE userId = $1`, [userId]);
    const row = result.rows[0];
    res.json({ totalBonus: row.totalBonus || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dashboard', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    const rows = result.rows;
    res.json({ transactions: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT firstname, lastname, phone, email, username, referralId, idNumber, profile_picture, estimated_balance FROM users WHERE id = $1`, [userId]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: 'User not found' });
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
    const result = await query(`SELECT password FROM users WHERE id = $1`, [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Old password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, userId]);
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
    await query(`UPDATE users SET profile_picture = $1 WHERE id = $2`, [profilePictureUrl, userId]);
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
      `INSERT INTO stakes (user_id, amount, stake_period, interest_rate, end_date) VALUES ($1, $2, $3, $4, $5)`,
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
    const result = await query(`SELECT * FROM stakes WHERE user_id = $1 ORDER BY start_date DESC`, [userId]);
    const rows = result.rows;
    res.json({ stakes: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/withdrawals', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { stakeId } = req.body;

  if (!stakeId) {
    return res.status(400).json({ message: 'Stake ID is required' });
  }

  try {
    // Get stake details
    const stakeResult = await query(`SELECT * FROM stakes WHERE id = $1 AND user_id = $2`, [stakeId, userId]);
    const stake = stakeResult.rows[0];

    if (!stake) return res.status(404).json({ message: 'Stake not found' });

    const currentDate = new Date();
    const endDate = new Date(stake.end_date);
    if (currentDate < endDate) {
      return res.status(400).json({ message: 'Stake has not matured yet' });
    }

    if (stake.status === 'withdrawn') {
      return res.status(400).json({ message: 'Stake already withdrawn' });
    }

    const principal = stake.amount;
    const interest = Math.floor(principal * stake.interest_rate);
    const totalAmount = principal + interest;

    // Update stake status
    await query(`UPDATE stakes SET status = 'withdrawn' WHERE id = $1`, [stakeId]);

    // Create withdrawal record
    const withdrawalResult = await query(
      `INSERT INTO withdrawals (user_id, stake_id, amount) VALUES ($1, $2, $3)`,
      [userId, stakeId, totalAmount]
    );

    res.json({
      message: 'Withdrawal request submitted successfully',
      id: withdrawalResult.lastID,
      amount: totalAmount
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during withdrawal' });
  }
});

router.get('/withdrawals', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY request_date DESC`, [userId]);
    const rows = result.rows;
    res.json({ withdrawals: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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
      WHERE m.user_id = $1
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
    await query(`UPDATE messages SET is_read = true WHERE id = $1 AND user_id = $2`, [messageId, userId]);
    res.json({ message: 'Message marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;