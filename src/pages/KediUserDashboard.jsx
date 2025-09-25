import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaTachometerAlt, FaExchangeAlt, FaPiggyBank, FaHistory, FaGift, FaCog, FaSignOutAlt, FaUser, FaWallet, FaMoneyBillWave, FaPlus, FaSyncAlt, FaArrowLeft, FaLeaf } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);
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
  getFullUrl,
  getUserSavings,
  requestSavingsWithdrawal
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
  const [savings, setSavings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Enhanced filtering states
  const [transactionFilters, setTransactionFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'all'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [advancedUserSearch, setAdvancedUserSearch] = useState({
    showAdvanced: false,
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    transactionType: '',
    status: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

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

  const [savingsWithdrawalForm, setSavingsWithdrawalForm] = useState({
    savingsId: '',
    amount: ''
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
      const [profileRes, bonusRes, dashboardRes, stakesRes, withdrawalsRes, savingsRes] = await Promise.all([
        getUserProfile(),
        getUserBonus(),
        getUserDashboard(),
        getUserStakes(),
        getUserWithdrawals(),
        getUserSavings()
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
      setSavings(savingsRes.data?.savings || []);

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

  const handleSavingsWithdrawalSubmit = async (e) => {
    e.preventDefault();
    if (!savingsWithdrawalForm.savingsId || !savingsWithdrawalForm.amount) {
      setError('Please select savings account and enter amount');
      return;
    }

    const amount = parseFloat(savingsWithdrawalForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await requestSavingsWithdrawal({
        savingsId: parseInt(savingsWithdrawalForm.savingsId),
        amount: amount
      });

      // Reset form and refresh data
      setSavingsWithdrawalForm({ savingsId: '', amount: '' });
      await loadUserData();
      alert('Savings withdrawal request submitted successfully!');

    } catch (err) {
      console.error('Savings withdrawal error:', err);
      setError(err.response?.data?.message || 'Failed to submit savings withdrawal request');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  // Calculate real balance based on approved transactions, stakes, and withdrawals
  const calculateRealBalance = () => {
    let balance = 0;

    // Add approved transactions (deposits/investments)
    transactions.forEach(txn => {
      if (txn.status === 'approved') {
        balance += txn.amount;
      }
    });

    // Add referral bonus
    balance += userData.bonus;

    // Add stake principals and calculate interest for matured stakes
    stakes.forEach(stake => {
      if (stake.status === 'active') {
        balance += stake.amount; // Principal amount

        // Calculate interest for matured stakes
        const currentDate = new Date().toLocaleString('en-RW', { timeZone: 'Africa/Kigali' });
        const endDate = new Date(stake.end_date).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' });
        if (new Date(currentDate) >= new Date(endDate)) {
          const interest = stake.amount * stake.interest_rate;
          balance += interest;
        }
      }
    });

    // Subtract processed withdrawals
    withdrawals.forEach(withdrawal => {
      if (withdrawal.status === 'approved') {
        balance -= withdrawal.amount;
      }
    });

    return Math.max(0, balance); // Ensure balance doesn't go negative
  };

  // Filter stakes that can be withdrawn (matured and not yet withdrawn)
  const withdrawableStakes = (Array.isArray(stakes) ? stakes : []).filter(stake => {
    if (!stake || !stake.end_date) return false;
    const currentDate = new Date().toLocaleString('en-RW', { timeZone: 'Africa/Kigali' });
    const endDate = new Date(stake.end_date).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' });
    return new Date(currentDate) >= new Date(endDate) && stake.status === 'active';
  });

  // Pagination functions
  const getPaginatedTransactions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filterUserTransactions(transactions).slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filterUserTransactions(transactions).length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, transactionFilters]);

  // Enhanced filtering functions
  const filterUserTransactions = (transactions) => {
    return (Array.isArray(transactions) ? transactions : []).filter(txn => {
      if (!txn) return false;

      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!txn.type?.toLowerCase().includes(searchLower) &&
            !txn.txn_id?.toLowerCase().includes(searchLower) &&
            !txn.status?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (transactionFilters.type !== 'all' && txn.type !== transactionFilters.type) {
        return false;
      }

      // Status filter
      if (transactionFilters.status !== 'all' && txn.status !== transactionFilters.status) {
        return false;
      }

      // Date range filter
      if (transactionFilters.dateRange !== 'all') {
        const txnDate = new Date(txn.created_at);
        const now = new Date();

        switch (transactionFilters.dateRange) {
          case 'today':
            if (txnDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (txnDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (txnDate < monthAgo) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
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

  // Chart data generation functions for user dashboard
  const generateUserTransactionData = () => {
    // Get last 6 months of transaction data
    const last6Months = [];
    const transactionCounts = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      last6Months.push(date.toLocaleDateString('en-US', { month: 'short' }));

      // Count transactions for this month
      const monthTransactions = (Array.isArray(transactions) ? transactions : []).filter(txn => {
        if (!txn || !txn.created_at) return false;
        const txnDate = new Date(txn.created_at);
        return txnDate.getMonth() === date.getMonth() && txnDate.getFullYear() === date.getFullYear();
      });
      transactionCounts.push(monthTransactions.length);
    }

    return {
      labels: last6Months,
      datasets: [{
        label: 'Transactions',
        data: transactionCounts,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    };
  };

  const generateUserBalanceData = () => {
    // Mock balance growth data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const balances = [50000, 75000, 95000, 120000, 145000, calculateRealBalance()];

    return {
      labels: months,
      datasets: [{
        label: 'Balance (RWF)',
        data: balances,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    };
  };

  const userChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        callbacks: {
          label: function(context) {
            if (context.dataset.label.includes('Balance')) {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            if (this.chart.data.datasets[0].label.includes('Balance')) {
              return formatCurrency(value);
            }
            return value;
          }
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg shadow-lg transition-colors duration-200"
        onClick={toggleSidebar}
      >
        <FaBars size={20} />
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-green-800 to-green-900 text-white transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-green-700">
            <h2 className="text-lg font-bold text-white">KEDI BUSINESS & AGRI FUNDS</h2>
            <button
              className="lg:hidden text-white hover:text-green-200 transition-colors"
              onClick={toggleSidebar}
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="px-6 py-4 border-b border-green-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-green-800">
                  {userData.avatar}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{userData.name}</p>
                <p className="text-green-200 text-sm truncate">{userData.email}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  currentSection === item.id
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-green-100 hover:bg-green-700 hover:text-white'
                }`}
                onClick={() => showSection(item.id)}
              >
                <item.icon className="mr-3 text-lg" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-green-700">
            <button
              className="w-full flex items-center px-4 py-3 text-left text-red-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
              onClick={logout}
            >
              <FaSignOutAlt className="mr-3" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8">
        {/* Dashboard Section */}
        {currentSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {userData.name}!
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Here's an overview of your account and recent activities.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowInbox(!showInbox)}
                      className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors relative"
                    >
                      <FaUser size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={refreshDashboard}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FaSyncAlt className="mr-2" />
                    )}
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <FaWallet className="text-xl text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Estimated Balance</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {formatCurrency(calculateRealBalance())} RWF
                    </div>
                    <p className="text-gray-500 text-sm">
                      Total wallet balance
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FaGift className="text-xl text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Referral Bonus</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {formatCurrency(userData.bonus || 0)} RWF
                    </div>
                    <p className="text-gray-500 text-sm">
                      Total referral earnings
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => showSection('transaction')}
                  className="flex items-center justify-center px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
                >
                  <FaPlus className="mr-2" />
                  Make Transaction
                </button>

                <button
                  onClick={() => showSection('stake')}
                  className="flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
                >
                  <FaPiggyBank className="mr-2" />
                  Deposit Stake
                </button>

                <button
                  onClick={() => showSection('history')}
                  className="flex items-center justify-center px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
                >
                  <FaMoneyBillWave className="mr-2" />
                  Withdraw
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
                <button
                  onClick={() => showSection('history')}
                  className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
                >
                  View All →
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getRecentTransactions(transactions, 3).map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(txn.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {txn.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            {formatCurrency(txn.amount)} RWF
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(txn.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {getRecentTransactions(transactions, 3).length === 0 && (
                  <div className="text-center py-8">
                    <FaExchangeAlt className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent transactions</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Stakes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Active Stakes</h3>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Principal</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Interest</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Value</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(Array.isArray(stakes) ? stakes : []).filter(stake => stake && stake.status === 'active').map((stake) => {
                        const interestEarned = stake.amount * stake.interest_rate * (stake.stake_period / 365);
                        const totalValue = stake.amount + interestEarned;

                        return (
                          <tr key={stake.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatCurrency(stake.amount)} RWF
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {stake.stake_period} days
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {(stake.interest_rate * 100)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                              {formatCurrency(interestEarned)} RWF
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {formatCurrency(totalValue)} RWF
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(stake.status)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {(Array.isArray(stakes) ? stakes : []).filter(stake => stake && stake.status === 'active').length === 0 && (
                  <div className="text-center py-8">
                    <FaPiggyBank className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No active stakes</p>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Analytics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Analytics</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transaction Activity */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Transaction Activity</h4>
                  <div className="h-48">
                    <Line data={generateUserTransactionData()} options={userChartOptions} />
                  </div>
                </div>

                {/* Balance Growth */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Balance Growth</h4>
                  <div className="h-48">
                    <Line data={generateUserBalanceData()} options={userChartOptions} />
                  </div>
                </div>
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
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Transaction History</h3>
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                  {filterUserTransactions(transactions).length} of {transactions.length} transactions
                </div>
              </div>

              {/* Enhanced Filters */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
                  <div className="flex-1 w-full">
                    <div className="relative">
                      <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setAdvancedUserSearch({...advancedUserSearch, showAdvanced: !advancedUserSearch.showAdvanced})}
                    className={`px-4 py-3 font-medium rounded-lg transition-colors ${
                      advancedUserSearch.showAdvanced
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <FaFilter className="inline mr-2" />
                    {advancedUserSearch.showAdvanced ? 'Hide Advanced' : 'Advanced'}
                  </button>
                </div>

                {/* Quick Filter Tags */}
                {searchTerm && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-sm text-gray-600">Searching for:</span>
                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}

                {/* Basic Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={transactionFilters.type}
                      onChange={(e) => setTransactionFilters({...transactionFilters, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="tree_plan">Tree Plan</option>
                      <option value="loan">Loan</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={transactionFilters.status}
                      onChange={(e) => setTransactionFilters({...transactionFilters, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select
                      value={transactionFilters.dateRange}
                      onChange={(e) => setTransactionFilters({...transactionFilters, dateRange: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 days</option>
                      <option value="month">Last 30 days</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchTerm || transactionFilters.type !== 'all' || transactionFilters.status !== 'all' || transactionFilters.dateRange !== 'all') && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setTransactionFilters({ type: 'all', status: 'all', dateRange: 'all' });
                        setAdvancedUserSearch({...advancedUserSearch, showAdvanced: false});
                      }}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Advanced Search Panel */}
              {advancedUserSearch.showAdvanced && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaFilter className="mr-2 text-blue-600" />
                    Advanced Search & Filters
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date Range */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Date From</label>
                      <input
                        type="date"
                        value={advancedUserSearch.dateFrom}
                        onChange={(e) => setAdvancedUserSearch({...advancedUserSearch, dateFrom: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Date To</label>
                      <input
                        type="date"
                        value={advancedUserSearch.dateTo}
                        onChange={(e) => setAdvancedUserSearch({...advancedUserSearch, dateTo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Amount Range */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Min Amount (RWF)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={advancedUserSearch.minAmount}
                        onChange={(e) => setAdvancedUserSearch({...advancedUserSearch, minAmount: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Max Amount (RWF)</label>
                      <input
                        type="number"
                        placeholder="No limit"
                        value={advancedUserSearch.maxAmount}
                        onChange={(e) => setAdvancedUserSearch({...advancedUserSearch, maxAmount: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {filterUserTransactions(transactions).length} of {transactions.length} transactions match filters
                    </div>
                    <button
                      onClick={() => setAdvancedUserSearch({...advancedUserSearch, showAdvanced: false})}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getPaginatedTransactions().map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(txn.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {txn.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            {formatCurrency(txn.amount)} RWF
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                            {txn.txn_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(txn.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filterUserTransactions(transactions).length === 0 && (
                  <div className="text-center py-12">
                    <FaHistory className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No transactions found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls for User Transactions */}
              {filterUserTransactions(transactions).length > itemsPerPage && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filterUserTransactions(transactions).length)} of {filterUserTransactions(transactions).length} transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? 'text-white bg-green-600 border border-green-600'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
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

      {/* Inbox Modal */}
      {showInbox && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Inbox</h3>
              <button
                onClick={() => setShowInbox(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            </div>

            {messages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6c757d' }}>No messages yet</p>
            ) : (
              <div>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      padding: '15px',
                      marginBottom: '15px',
                      backgroundColor: msg.is_read ? '#f8f9fa' : '#fff3cd'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#28a745' }}>{msg.subject}</h4>
                        <small style={{ color: '#6c757d' }}>
                          From: {msg.admin_firstname} {msg.admin_lastname} • {new Date(msg.created_at).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}
                        </small>
                      </div>
                      {!msg.is_read && (
                        <button
                          onClick={async () => {
                            try {
                              await markMessageAsRead(msg.id);
                              // Update local state
                              setMessages(messages.map(m =>
                                m.id === msg.id ? { ...m, is_read: 1 } : m
                              ));
                              setUnreadCount(prev => Math.max(0, prev - 1));
                            } catch (error) {
                              console.error('Error marking message as read:', error);
                            }
                          }}
                          style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                    <p style={{ margin: 0, lineHeight: '1.5' }}>{msg.message}</p>
                    {msg.activity_type && (
                      <small style={{ color: '#6c757d', marginTop: '10px', display: 'block' }}>
                        Related to: {msg.activity_type} #{msg.activity_id}
                      </small>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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