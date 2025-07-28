const Transaction = require('../models/transaction');
const User = require('../models/user');

exports.createTransaction = async (req, res) => {
  const { type, amount } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user || !user.isApproved) {
      return res.status(403).json({ message: 'User not approved yet' });
    }

    const transaction = new Transaction({
      user: userId,
      type,
      amount,
      status: 'pending'
    });

    await transaction.save();
    res.status(201).json({ message: 'Transaction created', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error creating transaction', error: error.message });
  }
};

exports.getUserTransactions = async (req, res) => {
  const userId = req.userId;

  try {
    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};
