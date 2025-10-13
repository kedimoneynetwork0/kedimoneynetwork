const express = require('express');
const { query } = require('../utils/database-sqlite');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Create transaction
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { type, amount, txn_id } = req.body;

  if (!type || !amount || !txn_id) {
    return res.status(400).json({ message: 'Type, amount, and transaction ID are required' });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  try {
    const result = await query(
      `INSERT INTO transactions (user_id, type, amount, txn_id, status) VALUES (?, ?, ?, ?, ?)`,
      [userId, type, amount, txn_id, 'pending']
    );
    res.json({ message: 'Transaction submitted for approval', id: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;