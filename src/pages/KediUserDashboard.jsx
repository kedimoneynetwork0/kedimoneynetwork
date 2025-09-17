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

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  // Support form state
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: ''
  });

  // Profile update form state
  const [profileForm, setProfileForm] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: ''
  });

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { id: 'transaction', label: 'Make Transaction', icon: FaExchangeAlt },
    { id: 'stake', label: 'Deposit Stake', icon: FaPiggyBank },
    { id: 'history', label: 'Transaction History', icon: FaHistory },
    { id: 'bonus', label: 'Referral Bonus', icon: FaGift },
    { id: 'inbox', label: 'Inbox', icon: FaUser },
    { id: 'support', label: 'Support', icon: FaLeaf },
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

    // Show custom payment verification modal
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    setShowPaymentModal(false);
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

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
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

  // Support form submission handler
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportForm.subject || !supportForm.message) {
      setError('Please fill all support fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would send a message to admin
      // For now, we'll simulate sending a support message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Reset form and show success
      setSupportForm({ subject: '', message: '' });
      alert('Support message sent successfully! Our team will respond within 24 hours.');

    } catch (err) {
      console.error('Support error:', err);
      setError('Failed to send support message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Profile update form submission handler
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileForm.firstname || !profileForm.lastname || !profileForm.email) {
      setError('Please fill all required profile fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would update the user profile
      // For now, we'll simulate updating the profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Update local user data
      setUserData(prev => ({
        ...prev,
        name: `${profileForm.firstname} ${profileForm.lastname}`,
        email: profileForm.email
      }));

      alert('Profile updated successfully!');

    } catch (err) {
      console.error('Profile update error:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile data into form
  const loadProfileData = () => {
    if (userData.name && userData.email) {
      const nameParts = userData.name.split(' ');
      setProfileForm({
        firstname: nameParts[0] || '',
        lastname: nameParts.slice(1).join(' ') || '',
        phone: '', // Would come from API
        email: userData.email
      });
    }
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

        {/* Inbox Section */}
        {currentSection === 'inbox' && (
          <div>
            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-6">
                <h3>Messages & Notifications</h3>
                <div className="text-sm text-gray-600">
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Sample messages - in real app this would come from API */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-blue-800">Welcome to KEDI!</h4>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Welcome to KEDI Business & Agri Funds! Your account has been successfully activated.
                    You can now start making transactions and earning from our various investment options.
                  </p>
                  <div className="mt-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      System Message
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-green-800">Transaction Approved</h4>
                    <span className="text-xs text-gray-500">1 week ago</span>
                  </div>
                  <p className="text-green-700 text-sm">
                    Your tree planting transaction of 50,000 RWF has been approved and processed.
                    Your estimated balance has been updated accordingly.
                  </p>
                  <div className="mt-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Transaction Update
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-yellow-800">Stake Reminder</h4>
                    <span className="text-xs text-gray-500">2 weeks ago</span>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    Your 90-day stake investment is maturing soon. Consider reinvesting your earnings
                    for even higher returns with our extended stake options.
                  </p>
                  <div className="mt-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      Investment Reminder
                    </span>
                  </div>
                </div>
              </div>

              {messages.length === 0 && (
                <div className="text-center py-12">
                  <FaUser className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No messages yet</p>
                  <p className="text-gray-500 text-sm">Your messages and notifications will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Support Section */}
        {currentSection === 'support' && (
          <div>
            <div className="dashboard-grid">
              {/* Contact Support */}
              <div className="dashboard-card">
                <h3>Contact Support</h3>
                <p className="text-gray-600 mb-4">
                  Need help? Our support team is here to assist you 24/7.
                  Send us a message and we'll respond within 24 hours.
                </p>

                <form onSubmit={handleSupportSubmit}>
                  <div className="form-group">
                    <label>Subject *</label>
                    <input
                      type="text"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Message *</label>
                    <textarea
                      value={supportForm.message}
                      onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                      placeholder="Please describe your issue in detail..."
                      rows="6"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="action-button"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <FaLeaf className="mr-2" />
                    )}
                    Send Support Request
                  </button>
                </form>
              </div>

              {/* Quick Support Options */}
              <div className="dashboard-card">
                <h3>Quick Support</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">📞 Phone Support</h4>
                    <p className="text-blue-700 text-sm mb-2">
                      Call our support hotline for immediate assistance
                    </p>
                    <p className="font-mono text-blue-800">+250 788 123 456</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">💬 Live Chat</h4>
                    <p className="text-green-700 text-sm mb-2">
                      Chat with our support agents in real-time
                    </p>
                    <button className="action-button">
                      Start Live Chat
                    </button>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">📧 Email Support</h4>
                    <p className="text-purple-700 text-sm mb-2">
                      Send detailed inquiries to our support team
                    </p>
                    <p className="font-mono text-purple-800">support@kedimoney.rw</p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">📱 WhatsApp</h4>
                    <p className="text-orange-700 text-sm mb-2">
                      Quick support via WhatsApp
                    </p>
                    <p className="font-mono text-orange-800">+250 788 123 456</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {currentSection === 'settings' && (
          <div>
            <div className="dashboard-grid">
              {/* Profile Settings */}
              <div className="dashboard-card">
                <h3>Update Profile</h3>
                <p className="text-gray-600 mb-4">
                  Keep your profile information up to date for better account management.
                </p>

                <form onSubmit={handleProfileUpdate}>
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={profileForm.firstname}
                      onChange={(e) => setProfileForm({...profileForm, firstname: e.target.value})}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={profileForm.lastname}
                      onChange={(e) => setProfileForm({...profileForm, lastname: e.target.value})}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      placeholder="Enter your email address"
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
                        <FaUser className="mr-2" />
                      )}
                      Update Profile
                    </button>
                    <button
                      type="button"
                      onClick={loadProfileData}
                      className="action-button secondary"
                    >
                      Load Current Data
                    </button>
                  </div>
                </form>
              </div>

              {/* Account Security */}
              <div className="dashboard-card">
                <h3>Account Security</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">🔒 Change Password</h4>
                    <p className="text-blue-700 text-sm mb-3">
                      Regularly update your password to keep your account secure.
                    </p>
                    <button className="action-button">
                      Change Password
                    </button>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">📱 Two-Factor Authentication</h4>
                    <p className="text-green-700 text-sm mb-3">
                      Add an extra layer of security to your account.
                    </p>
                    <button className="action-button">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">🔔 Notification Preferences</h4>
                    <p className="text-yellow-700 text-sm mb-3">
                      Choose how you want to receive notifications.
                    </p>
                    <button className="action-button">
                      Manage Notifications
                    </button>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">🚪 Account Deactivation</h4>
                    <p className="text-red-700 text-sm mb-3">
                      Temporarily or permanently deactivate your account.
                    </p>
                    <button className="action-button danger">
                      Deactivate Account
                    </button>
                  </div>
                </div>
              </div>
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

      {/* Payment Verification Modal */}
      {showPaymentModal && (
        <>
          {/* Modal Overlay */}
          <div
            className="modal-overlay"
            onClick={handlePaymentCancel}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: '1000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}
          ></div>

          {/* Modal Content */}
          <div
            className="payment-modal"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: '1001',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
              maxWidth: '500px',
              width: '90%',
              padding: '0',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #2e8b57 0%, #228b22 100%)',
                color: 'white',
                padding: '24px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
              <h3 style={{ margin: '0', fontSize: '24px', fontWeight: '600' }}>
                Payment Verification Required
              </h3>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <p style={{
                  fontSize: '16px',
                  color: '#374151',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}>
                  <strong style={{ color: '#2e8b57' }}>
                    Nyamuneka banza ugenzure ko wishyuye ukanze *182*8*1*1594092# kuri kivin
                  </strong>
                </p>

                <div style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '2px solid #e5e7eb'
                }}>
                  <p style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: '0',
                    fontFamily: 'monospace'
                  }}>
                    *182*8*1*1594092#
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '8px 0 0 0'
                  }}>
                    Dial this code on your phone to verify payment
                  </p>
                </div>

                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  lineHeight: '1.5'
                }}>
                  Please verify your payment by dialing the code above on your mobile phone.
                  Once confirmed, click "Continue with Transaction" to proceed.
                </p>
              </div>

              {/* Transaction Summary */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Transaction Summary
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Type:</span>
                  <span style={{ fontWeight: '500' }}>{transactionForm.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Amount:</span>
                  <span style={{ fontWeight: '500' }}>{formatCurrency(transactionForm.amount)} RWF</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Transaction ID:</span>
                  <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>{transactionForm.txnId}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handlePaymentCancel}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.color = '#6b7280';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: '#2e8b57',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = '#228b22';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(46, 139, 87, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = '#2e8b57';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {isLoading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Processing...
                  </div>
                ) : (
                  'Continue with Transaction'
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add CSS animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default KediUserDashboard;