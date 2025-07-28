const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');

// POST transaction (deposit, withdraw, save, loan)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, amount } = req.body;
    const userId = req.userId;

    // Check if user is approved
    const user = await User.findById(userId);
    if (!user || user.status !== 'approved') {
      return res.status(403).json({ message: 'User not approved yet' });
    }

    const transaction = new Transaction({ userId, type, amount });
    await transaction.save();
    res.status(201).json({ message: 'Transaction successful', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// GET all user transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
