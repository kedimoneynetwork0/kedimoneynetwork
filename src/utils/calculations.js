// Calculation utilities for KEDI BUSINESS & AGRI FUNDS

/**
 * Calculate user balance from transactions and stakes
 * Balance = (Total Deposits + Total Referral Bonus + Total Stakes Interest) - (Total Withdrawals + Loan Repayments)
 */
export const calculateBalance = (transactions = [], stakes = [], referralBonus = 0) => {
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalLoanRepayments = 0;
  let totalStakesInterest = 0;

  // Calculate from transactions
  transactions.forEach(txn => {
    if (txn.status === 'approved') {
      if (txn.type === 'tree_plan' || txn.type === 'saving') {
        totalDeposits += txn.amount;
      } else if (txn.type === 'withdrawal') {
        totalWithdrawals += txn.amount;
      } else if (txn.type === 'loan') {
        totalLoanRepayments += txn.amount;
      }
    }
  });

  // Calculate stakes interest
  stakes.forEach(stake => {
    if (stake.status === 'active') {
      const interest = stake.amount * stake.interest_rate * (stake.stake_period / 365); // Daily interest
      totalStakesInterest += interest;
    }
  });

  const balance = totalDeposits + referralBonus + totalStakesInterest - totalWithdrawals - totalLoanRepayments;
  return Math.max(0, balance); // Ensure balance doesn't go negative
};

/**
 * Calculate referral bonus
 * Each approved referral = 5,000 RWF
 */
export const calculateReferralBonus = (referralCount = 0) => {
  const BONUS_PER_REFERRAL = 5000;
  return referralCount * BONUS_PER_REFERRAL;
};

/**
 * Calculate total stakes interest
 */
export const calculateStakesInterest = (stakes = []) => {
  return stakes
    .filter(stake => stake.status === 'active')
    .reduce((total, stake) => {
      const interest = stake.amount * stake.interest_rate * (stake.stake_period / 365);
      return total + interest;
    }, 0);
};

/**
 * Calculate total active stakes amount
 */
export const calculateTotalStakes = (stakes = []) => {
  return stakes
    .filter(stake => stake.status === 'active')
    .reduce((total, stake) => total + stake.amount, 0);
};

/**
 * Get last N transactions sorted by date
 */
export const getRecentTransactions = (transactions = [], limit = 10) => {
  return transactions
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
};

/**
 * Calculate admin dashboard metrics
 */
export const calculateAdminMetrics = (users = [], transactions = [], stakes = []) => {
  const totalUsers = users.length;
  const pendingUsers = users.filter(user => user.status === 'pending').length;
  const approvedUsers = users.filter(user => user.status === 'approved').length;

  const totalTransactions = transactions.length;
  const approvedTransactions = transactions.filter(txn => txn.status === 'approved').length;
  const pendingTransactions = transactions.filter(txn => txn.status === 'pending').length;

  // Calculate revenue from approved transactions
  let totalDeposits = 0;
  let totalWithdrawals = 0;

  transactions.forEach(txn => {
    if (txn.status === 'approved') {
      if (txn.type === 'tree_plan' || txn.type === 'saving') {
        totalDeposits += txn.amount;
      } else if (txn.type === 'withdrawal') {
        totalWithdrawals += txn.amount;
      }
    }
  });

  const totalRevenue = totalDeposits - totalWithdrawals;
  const totalStakesAmount = calculateTotalStakes(stakes);

  return {
    totalUsers,
    pendingUsers,
    approvedUsers,
    totalTransactions,
    approvedTransactions,
    pendingTransactions,
    totalDeposits,
    totalWithdrawals,
    totalRevenue,
    totalStakesAmount
  };
};

/**
 * Filter transactions by type and status
 */
export const filterTransactions = (transactions = [], typeFilter = 'all', statusFilter = 'all') => {
  return transactions.filter(txn => {
    const typeMatch = typeFilter === 'all' || txn.type === typeFilter;
    const statusMatch = statusFilter === 'all' || txn.status === statusFilter;
    return typeMatch && statusMatch;
  });
};

/**
 * Get transaction type options
 */
export const getTransactionTypes = () => {
  return [
    { value: 'all', label: 'All Types' },
    { value: 'tree_plan', label: 'Tree Plan' },
    { value: 'saving', label: 'Savings' },
    { value: 'loan', label: 'Loan' },
    { value: 'withdrawal', label: 'Withdrawal' }
  ];
};

/**
 * Get transaction status options
 */
export const getTransactionStatuses = () => {
  return [
    { value: 'all', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' }
  ];
};

/**
 * Format currency for Rwandan Franc
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-RW').format(amount);
};

/**
 * Calculate stake maturity date
 */
export const calculateMaturityDate = (startDate, stakePeriod) => {
  const start = new Date(startDate);
  const maturity = new Date(start);
  maturity.setDate(start.getDate() + stakePeriod);
  return maturity;
};

/**
 * Check if stake is matured
 */
export const isStakeMatured = (stake) => {
  const maturityDate = calculateMaturityDate(stake.start_date, stake.stake_period);
  const now = new Date();
  return now >= maturityDate;
};

/**
 * Calculate stake interest earned
 */
export const calculateStakeInterest = (stake) => {
  const daysElapsed = Math.min(
    stake.stake_period,
    Math.floor((new Date() - new Date(stake.start_date)) / (1000 * 60 * 60 * 24))
  );

  return stake.amount * stake.interest_rate * (daysElapsed / 365);
};

/**
 * Get user statistics
 */
export const getUserStats = (user, transactions = [], stakes = []) => {
  const approvedTransactions = transactions.filter(txn => txn.status === 'approved');
  const pendingTransactions = transactions.filter(txn => txn.status === 'pending');
  const activeStakes = stakes.filter(stake => stake.status === 'active');
  const maturedStakes = activeStakes.filter(isStakeMatured);

  return {
    totalTransactions: transactions.length,
    approvedTransactions: approvedTransactions.length,
    pendingTransactions: pendingTransactions.length,
    activeStakes: activeStakes.length,
    maturedStakes: maturedStakes.length,
    totalStakesValue: calculateTotalStakes(activeStakes),
    estimatedInterest: calculateStakesInterest(activeStakes)
  };
};