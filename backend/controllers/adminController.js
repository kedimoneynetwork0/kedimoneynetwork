const User = require('../models/user');
const Transaction = require('../models/transaction');

exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isApproved: false });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending users', error: error.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isApproved: true },
      { new: true }
    );
    res.json({ message: 'User approved', user });
  } catch (error) {
    res.status(500).json({ message: 'Error approving user', error: error.message });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User rejected and deleted', user });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting user', error: error.message });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('user', 'fullName email');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

exports.getFinancialSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    let income = 0;
    let expenses = 0;

    transactions.forEach(tx => {
      if (tx.type === 'deposit' || tx.type === 'save') income += tx.amount;
      if (tx.type === 'withdraw' || tx.type === 'loan') expenses += tx.amount;
    });

    res.json({
      income,
      expenses,
      balance: income - expenses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching financial summary', error: error.message });
  }
};
