import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaTachometerAlt, FaExchangeAlt, FaPiggyBank, FaHistory, FaGift, FaCog, FaSignOutAlt, FaUser, FaWallet, FaMoneyBillWave, FaPlus, FaSyncAlt, FaArrowLeft, FaLeaf } from 'react-icons/fa';
import {
  getUserBonus,
  getUserDashboard,
  getUserProfile,
  createTransaction,
  createStake,
  getUserStakes,
  requestWithdrawal,
  getUserWithdrawals,
  getUserMessages,
  markMessageAsRead,
  getFullUrl
} from '../api';
import {
  calculateBalance,
  calculateReferralBonus,
  calculateStakesInterest,
  calculateTotalStakes,
  getRecentTransactions,
  getUserStats,
  formatCurrency
} from '../utils/calculations';
import './admin-dashboard.css'; // Import original dashboard styles

const KediUserDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Real data from API
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    avatar: '',
    balance: 0,
    bonus: 0,
    profilePicture: ''
  });

  const [transactions, setTransactions] = useState([]);
  const [stakes, setStakes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Form states
  const [transactionForm, setTransactionForm] = useState({
    type: '',
    amount: '',
    txnId: ''
  });

  const [stakeForm, setStakeForm] = useState({
    amount: '',
    period: 30
  });

  const [withdrawalForm, setWithdrawalForm] = useState({
    stakeId: ''
  });

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { id: 'transaction', label: 'Make Transaction', icon: FaExchangeAlt },
    { id: 'stake', label: 'Deposit Stake', icon: FaPiggyBank },
    { id: 'history', label: 'Transaction History', icon: FaHistory },
    { id: 'bonus', label: 'Referral Bonus', icon: FaGift },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
    loadMessages();

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load all user data from API
  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profileRes, bonusRes, dashboardRes, stakesRes, withdrawalsRes] = await Promise.all([
        getUserProfile(),
        getUserBonus(),
        getUserDashboard(),
        getUserStakes(),
        getUserWithdrawals()
      ]);

      // Update user profile data
      const profile = profileRes.data || {};
      const transactions = dashboardRes.data?.transactions || [];
      const stakes = stakesRes.data?.stakes || [];

      // Calculate referral bonus (mock: 5,000 RWF per referral)
      const referralCount = profile.referralId ? 1 : 0; // Simple mock calculation
      const referralBonus = calculateReferralBonus(referralCount);

      // Calculate balance using the new calculation logic
      const calculatedBalance = calculateBalance(transactions, stakes, referralBonus);

      setUserData({
        name: `${profile.firstname || ''} ${profile.lastname || ''}`.trim() || 'User',
        email: profile.email || '',
        avatar: profile.firstname?.charAt(0)?.toUpperCase() || 'U',
        balance: calculatedBalance,
        bonus: referralBonus,
        profilePicture: profile.profile_picture || '',
        stats: getUserStats(profile, transactions, stakes)
      });

      // Update other data
      setTransactions(dashboardRes.data?.transactions || []);
      setStakes(stakesRes.data?.stakes || []);
      setWithdrawals(withdrawalsRes.data?.withdrawals || []);

    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user messages
  const loadMessages = async () => {
    try {
      const response = await getUserMessages();
      const userMessages = response.data?.messages || [];
      setMessages(userMessages);
      setUnreadCount(userMessages.filter(msg => !msg.is_read).length);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const showSection = (section) => {
    setCurrentSection(section);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const goBack = () => {
    setCurrentSection('dashboard');
  };

  const refreshDashboard = async () => {
    await loadUserData();
  };

  const logout = () => {
    // Clear authentication tokens and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  // Form submission handlers
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!transactionForm.type || !transactionForm.amount || !transactionForm.txnId) {
      setError('Please fill all transaction fields');
      return;
    }

    // Show payment verification popup
    const userConfirmed = window.confirm(
      'Nyamuneka banza ugenzure ko wishyuye ukanze *182*8*1*1594092# kuri kivin\n\n' +
      'Please first check if you have paid by dialing *182*8*1*1594092# on your phone\n\n' +
      'Click OK to continue with the transaction.'
    );

    if (!userConfirmed) {
      return; // User cancelled
    }

    setIsLoading(true);
    setError(null);

    try {
      await createTransaction({
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        txn_id: transactionForm.txnId
      });

      // Reset form and refresh data
      setTransactionForm({ type: '', amount: '', txnId: '' });
      await loadUserData();
      alert('Transaction submitted successfully!');

    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.response?.data?.message || 'Failed to submit transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStakeSubmit = async (e) => {
    e.preventDefault();
    if (!stakeForm.amount) {
      setError('Please enter stake amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createStake({
        amount: parseFloat(stakeForm.amount),
        stakePeriod: parseInt(stakeForm.period)
      });

      // Reset form and refresh data
      setStakeForm({ amount: '', period: 30 });
      await loadUserData();
      alert('Stake created successfully!');

    } catch (err) {
      console.error('Stake error:', err);
      setError(err.response?.data?.message || 'Failed to create stake');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawalForm.stakeId) {
      setError('Please select a stake to withdraw');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await requestWithdrawal({
        stakeId: parseInt(withdrawalForm.stakeId)
      });

      // Reset form and refresh data
      setWithdrawalForm({ stakeId: '' });
      await loadUserData();
      alert('Withdrawal request submitted successfully!');

    } catch (err) {
      console.error('Withdrawal error:', err);
      setError(err.response?.data?.message || 'Failed to submit withdrawal request');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={toggleSidebar}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: '1001',
          backgroundColor: '#2e8b57',
          color: 'white',
          border: 'none',
          padding: '12px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        <FaBars size={20} />
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>KEDI BUSINESS & AGRI FUNDS</h2>
          <button
            className="sidebar-close-btn"
            onClick={toggleSidebar}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'none'
            }}
          >
            <FaTimes />
          </button>
        </div>
        <div className="tabs">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`tab-button ${currentSection === item.id ? 'active' : ''}`}
              onClick={() => showSection(item.id)}
            >
              <item.icon className="mr-2" />
              <span className="tab-text">{item.label}</span>
            </button>
          ))}
          <button
            className="logout-button"
            onClick={logout}
          >
            <FaSignOutAlt className="mr-2" />
            <span className="tab-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: '999',
            display: 'none'
          }}
        ></div>
      )}

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
        {/* Dashboard Section */}
        {currentSection === 'dashboard' && (
          <div>
            {/* Welcome Section */}
            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Welcome back, {userData.name}!
                  </h1>
                  <p className="text-gray-600">
                    Here's an overview of your account and recent activities.
                  </p>
                </div>
                <button
                  onClick={refreshDashboard}
                  disabled={isLoading}
                  className="action-button"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <FaSyncAlt className="mr-2" />
                  )}
                  Refresh
                </button>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaWallet className="text-2xl text-green-600" />
                      <span className="text-lg font-medium">Estimated Balance</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {formatCurrency(userData.balance || 0)} RWF
                    </div>
                    <p className="text-gray-600 text-sm">
                      Total wallet balance
                    </p>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaGift className="text-2xl text-blue-600" />
                      <span className="text-lg font-medium">Referral Bonus</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {formatCurrency(userData.bonus || 0)} RWF
                    </div>
                    <p className="text-gray-600 text-sm">
                      Total referral earnings
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card">
              <h3>Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => showSection('transaction')}
                  className="action-button"
                >
                  <FaPlus className="mr-2" />
                  Make Transaction
                </button>

                <button
                  onClick={() => showSection('stake')}
                  className="action-button"
                >
                  <FaPiggyBank className="mr-2" />
                  Deposit Stake
                </button>

                <button
                  onClick={() => showSection('history')}
                  className="action-button"
                >
                  <FaMoneyBillWave className="mr-2" />
                  Withdraw
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-4">
                <h3>Recent Transactions</h3>
                <button
                  onClick={() => showSection('history')}
                  className="action-button"
                >
                  View All →
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getRecentTransactions(transactions, 3).map((txn) => (
                      <tr key={txn.id}>
                        <td>{new Date(txn.created_at).toLocaleDateString()}</td>
                        <td>{txn.type}</td>
                        <td className="font-medium">{formatCurrency(txn.amount)} RWF</td>
                        <td>{getStatusBadge(txn.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Stakes */}
            <div className="dashboard-card">
              <h3>Active Stakes</h3>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Principal</th>
                      <th>Duration</th>
                      <th>Rate</th>
                      <th>Interest</th>
                      <th>Total Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakes.filter(stake => stake.status === 'active').map((stake) => {
                      const interestEarned = stake.amount * stake.interest_rate * (stake.stake_period / 365);
                      const totalValue = stake.amount + interestEarned;

                      return (
                        <tr key={stake.id}>
                          <td className="font-medium">{formatCurrency(stake.amount)} RWF</td>
                          <td>{stake.stake_period} days</td>
                          <td>{(stake.interest_rate * 100)}%</td>
                          <td>{formatCurrency(interestEarned)} RWF</td>
                          <td className="font-medium text-green-600">{formatCurrency(totalValue)} RWF</td>
                          <td>{getStatusBadge(stake.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Section */}
        {currentSection === 'transaction' && (
          <div>
            <div className="dashboard-card">
              <h3>Make a Transaction</h3>

              <form onSubmit={handleTransactionSubmit}>
                <div className="form-group">
                  <label>Transaction Type</label>
                  <select
                    value={transactionForm.type}
                    onChange={(e) => setTransactionForm({...transactionForm, type: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="tree_plan">Tree Plan</option>
                    <option value="loan">Loan</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount (RWF)</label>
                  <input
                    type="number"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Transaction ID</label>
                  <input
                    type="text"
                    value={transactionForm.txnId}
                    onChange={(e) => setTransactionForm({...transactionForm, txnId: e.target.value})}
                    placeholder="Enter transaction ID"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="action-button"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <FaExchangeAlt className="mr-2" />
                    )}
                    Submit Transaction
                  </button>
                  <button
                    type="button"
                    onClick={() => showSection('dashboard')}
                    className="action-button secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stake Section */}
        {currentSection === 'stake' && (
          <div>
            <div className="dashboard-card">
              <h3>Deposit Stake</h3>

              <form onSubmit={handleStakeSubmit}>
                <div className="form-group">
                  <label>Amount (RWF)</label>
                  <input
                    type="number"
                    value={stakeForm.amount}
                    onChange={(e) => setStakeForm({...stakeForm, amount: e.target.value})}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stake Period</label>
                  <select
                    value={stakeForm.period}
                    onChange={(e) => setStakeForm({...stakeForm, period: parseInt(e.target.value)})}
                    required
                  >
                    <option value="30">30 Days (5% interest)</option>
                    <option value="90">90 Days (15% interest)</option>
                    <option value="180">180 Days (30% interest)</option>
                  </select>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="action-button"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <FaPiggyBank className="mr-2" />
                    )}
                    Deposit Stake
                  </button>
                  <button
                    type="button"
                    onClick={() => showSection('dashboard')}
                    className="action-button secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Section */}
        {currentSection === 'history' && (
          <div>
            <div className="dashboard-card">
              <h3>Transaction History</h3>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Transaction ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id}>
                        <td>{new Date(txn.created_at).toLocaleDateString()}</td>
                        <td>{txn.type}</td>
                        <td className="font-medium">{formatCurrency(txn.amount)} RWF</td>
                        <td>{txn.txn_id}</td>
                        <td>{getStatusBadge(txn.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bonus Section */}
        {currentSection === 'bonus' && (
          <div>
            <div className="dashboard-card text-center">
              <div className="text-6xl text-green-600 mb-6">
                <FaGift />
              </div>
              <h3>Referral Bonus</h3>
              <div className="text-4xl font-bold text-green-600 mb-4">
                {formatCurrency(userData.bonus)} RWF
              </div>
              <p className="text-gray-600">
                Total referral bonus earned from your network
              </p>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {currentSection === 'settings' && (
          <div>
            <div className="dashboard-card text-center">
              <div className="text-6xl text-gray-400 mb-6">
                <FaCog />
              </div>
              <h3>Account Settings</h3>
              <p className="text-gray-600">
                Account settings and preferences will be available here.
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="message error">
            <strong>Error:</strong> {error}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default KediUserDashboard;