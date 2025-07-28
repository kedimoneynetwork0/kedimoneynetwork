const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Transaction = require('../models/transaction');
const adminAuth = require('../middleware/adminAuth');

// Get all users pending approval
router.get('/pending-users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Approve user
router.post('/approve-user/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status: 'approved' },
      { new: true }
    );
    res.json({ message: 'User approved', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Reject user
router.post('/reject-user/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User rejected and removed', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get all transactions
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('userId', 'fullName email');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get financial summary
router.get('/summary', adminAuth, async (req, res) => {
  try {
    const allTransactions = await Transaction.find();
    let income = 0;
    let expenses = 0;

    allTransactions.forEach(tx => {
      if (tx.type === 'deposit' || tx.type === 'save') {
        income += tx.amount;
      } else if (tx.type === 'withdraw' || tx.type === 'loan') {
        expenses += tx.amount;
      }
    });

    res.json({ income, expenses, balance: income - expenses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
