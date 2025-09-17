import React, { useState, useEffect } from 'react';
import {
  FaBars, FaTimes, FaTachometerAlt, FaUsers, FaClock, FaExchangeAlt,
  FaChartLine, FaBullhorn, FaCog, FaSignOutAlt, FaUser, FaCheck,
  FaTimes as FaReject, FaEye, FaPlus, FaLeaf, FaChevronDown,
  FaUserCheck, FaUserClock, FaMoneyBillWave, FaCoins, FaFilter
} from 'react-icons/fa';
import {
  getPendingUsers,
  getPendingTransactions,
  getAllUsers,
  getAllTransactions,
  approveUser,
  approveTransaction,
  getCompanyAssets,
  getUserDetails,
  createNews,
  getNews,
  getFullUrl
} from '../api';
import {
  calculateAdminMetrics,
  filterTransactions,
  getTransactionTypes,
  getTransactionStatuses,
  formatCurrency
} from '../utils/calculations';
import './admin-dashboard.css'; // Import original dashboard styles

const KediAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSection, setCurrentSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0
  });

  const [pendingUsers, setPendingUsers] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [companyAssets, setCompanyAssets] = useState(null);
  const [news, setNews] = useState([]);

  // Filtering states
  const [transactionFilters, setTransactionFilters] = useState({
    type: 'all',
    status: 'all'
  });

  // Form states
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    media: null
  });

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: FaTachometerAlt },
    { id: 'users', label: 'User Management', icon: FaUsers },
    { id: 'pending', label: 'Pending Approvals', icon: FaClock },
    { id: 'transactions', label: 'Transactions', icon: FaExchangeAlt },
    { id: 'revenue', label: 'Revenue Report', icon: FaChartLine },
    { id: 'announcements', label: 'Announcements', icon: FaBullhorn },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load all dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        pendingUsersRes,
        allUsersRes,
        transactionsRes,
        assetsRes,
        newsRes
      ] = await Promise.all([
        getPendingUsers(),
        getAllUsers(),
        getAllTransactions(),
        getCompanyAssets(),
        getNews()
      ]);

      // Mock stakes data for calculations (in real app this would come from API)

      // Update stats using calculation functions
      const pendingUsersData = pendingUsersRes.data || [];
      const allUsersData = allUsersRes.data || [];
      const transactionsData = transactionsRes.data || [];
      const stakesData = []; // Mock stakes data for calculations (in real app this would come from API)
      const assetsData = assetsRes.data || {};
      const newsData = newsRes.data || [];

      // Calculate admin metrics using the calculation functions
      const adminMetrics = calculateAdminMetrics(allUsersData, transactionsData, stakesData);

      setStats({
        totalUsers: adminMetrics.totalUsers,
        pendingUsers: adminMetrics.pendingUsers,
        totalTransactions: adminMetrics.totalTransactions,
        totalRevenue: adminMetrics.totalRevenue,
        totalDeposits: adminMetrics.totalDeposits,
        totalWithdrawals: adminMetrics.totalWithdrawals,
        approvedUsers: adminMetrics.approvedUsers,
        totalStakesAmount: adminMetrics.totalStakesAmount
      });

      // Update data states
      setPendingUsers(pendingUsersData);
      setAllUsers(allUsersData);
      setAllTransactions(transactionsData);
      setCompanyAssets(assetsData);
      setNews(newsData);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/admin-login';
  };

  // Admin actions
  const handleApproveUser = async (userId, approve) => {
    try {
      await approveUser(userId, approve);
      await loadDashboardData(); // Refresh data
      alert(`User ${approve ? 'approved' : 'rejected'} successfully!`);
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Failed to update user status');
    }
  };

  const handleApproveTransaction = async (txnId, approve) => {
    try {
      await approveTransaction(txnId, approve);
      await loadDashboardData(); // Refresh data
      alert(`Transaction ${approve ? 'approved' : 'rejected'} successfully!`);
    } catch (err) {
      console.error('Error approving transaction:', err);
      setError('Failed to update transaction status');
    }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.content) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', newsForm.title);
      formData.append('content', newsForm.content);
      if (newsForm.media) {
        formData.append('media', newsForm.media);
      }

      await createNews(formData);

      // Reset form and refresh data
      setNewsForm({ title: '', content: '', media: null });
      await loadDashboardData();
      alert('Announcement created successfully!');

    } catch (err) {
      console.error('Error creating news:', err);
      setError('Failed to create announcement');
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
      {/* Sidebar */}
      <div className="sidebar">
        <h2>KEDI BUSINESS & AGRI FUNDS</h2>
        <div className="tabs">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`tab-button ${currentSection === item.id ? 'active' : ''}`}
              onClick={() => showSection(item.id)}
            >
              <item.icon className="mr-2" />
              {item.label}
            </button>
          ))}
          <button
            className="logout-button"
            onClick={logout}
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container">
        {/* Overview Section */}
        {currentSection === 'overview' && (
          <div>
            {/* Welcome Section */}
            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Admin Dashboard - Manage KEDI Funds
                  </h1>
                  <p className="text-gray-600">
                    Monitor users, transactions, and system performance
                  </p>
                </div>
                <button
                  onClick={loadDashboardData}
                  disabled={isLoading}
                  className="action-button"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <FaExchangeAlt className="mr-2" />
                  )}
                  Refresh Data
                </button>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaUsers className="text-2xl text-blue-600" />
                      <span className="text-lg font-medium">Total Users</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {stats.totalUsers}
                    </div>
                    <p className="text-gray-600 text-sm">
                      Registered users
                    </p>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaUserClock className="text-2xl text-yellow-600" />
                      <span className="text-lg font-medium">Pending Approvals</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {stats.pendingUsers}
                    </div>
                    <p className="text-gray-600 text-sm">
                      Awaiting approval
                    </p>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaExchangeAlt className="text-2xl text-green-600" />
                      <span className="text-lg font-medium">Total Transactions</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {stats.totalTransactions}
                    </div>
                    <p className="text-gray-600 text-sm">
                      All transactions
                    </p>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaCoins className="text-2xl text-purple-600" />
                      <span className="text-lg font-medium">Total Revenue</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {formatCurrency(stats.totalRevenue)} RWF
                    </div>
                    <p className="text-gray-600 text-sm">
                      System assets
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="dashboard-grid">
              {/* Pending Users Preview */}
              <div className="dashboard-card">
                <div className="flex justify-between items-center mb-4">
                  <h3>Recent Pending Users</h3>
                  <button
                    onClick={() => showSection('pending')}
                    className="action-button"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-4">
                  {pendingUsers.slice(0, 3).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.email}</p>
                          <p className="text-sm text-gray-600">Pending approval</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveUser(user.id, true)}
                          className="action-button"
                        >
                          <FaCheck className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleApproveUser(user.id, false)}
                          className="danger"
                        >
                          <FaReject className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingUsers.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No pending users</p>
                  )}
                </div>
              </div>

              {/* Recent Transactions Preview */}
              <div className="dashboard-card">
                <div className="flex justify-between items-center mb-4">
                  <h3>Recent Transactions</h3>
                  <button
                    onClick={() => showSection('transactions')}
                    className="action-button"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-4">
                  {allTransactions.slice(0, 3).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaExchangeAlt className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{txn.email}</p>
                          <p className="text-sm text-gray-600">{txn.type} - {formatCurrency(txn.amount)} RWF</p>
                        </div>
                      </div>
                      {getStatusBadge(txn.status)}
                    </div>
                  ))}
                  {allTransactions.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No transactions</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals Section */}
        {currentSection === 'pending' && (
          <div>
            <div className="dashboard-card">
              <h3>Pending User Approvals</h3>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>{getStatusBadge('pending')}</td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveUser(user.id, true)}
                              className="action-button"
                            >
                              <FaCheck className="mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveUser(user.id, false)}
                              className="danger"
                            >
                              <FaReject className="mr-1" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingUsers.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No pending users to approve</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {currentSection === 'transactions' && (
          <div>
            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-4">
                <h3>All Transactions</h3>
                <div className="flex items-center space-x-4">
                  <FaFilter className="text-gray-500" />
                  <select
                    value={transactionFilters.type}
                    onChange={(e) => setTransactionFilters({...transactionFilters, type: e.target.value})}
                    className="form-group"
                  >
                    {getTransactionTypes().map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <select
                    value={transactionFilters.status}
                    onChange={(e) => setTransactionFilters({...transactionFilters, status: e.target.value})}
                    className="form-group"
                  >
                    {getTransactionStatuses().map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status).map((txn) => (
                      <tr key={txn.id}>
                        <td>{new Date(txn.created_at).toLocaleDateString()}</td>
                        <td>{txn.email}</td>
                        <td>{txn.type}</td>
                        <td className="font-medium">{formatCurrency(txn.amount)} RWF</td>
                        <td>{getStatusBadge(txn.status)}</td>
                        <td>
                          {txn.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveTransaction(txn.id, true)}
                                className="action-button"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproveTransaction(txn.id, false)}
                                className="danger"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status).length === 0 && (
                  <p className="text-center text-gray-500 py-8">No transactions found matching the filters</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Revenue Report Section */}
        {currentSection === 'revenue' && (
          <div>
            <div className="dashboard-grid">
              {/* Revenue Summary Cards */}
              <div className="dashboard-card">
                <h3>Revenue Summary</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Deposits</p>
                      <p className="text-2xl font-bold text-green-800">{formatCurrency(stats.totalDeposits || 0)} RWF</p>
                    </div>
                    <FaMoneyBillWave className="text-3xl text-green-500" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Total Withdrawals</p>
                      <p className="text-2xl font-bold text-red-800">{formatCurrency(stats.totalWithdrawals || 0)} RWF</p>
                    </div>
                    <FaMoneyBillWave className="text-3xl text-red-500" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Net Revenue</p>
                      <p className={`text-2xl font-bold ${stats.totalRevenue >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                        {formatCurrency(stats.totalRevenue || 0)} RWF
                      </p>
                    </div>
                    <FaChartLine className={`text-3xl ${stats.totalRevenue >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Active Stakes Value</p>
                      <p className="text-2xl font-bold text-purple-800">{formatCurrency(stats.totalStakesAmount || 0)} RWF</p>
                    </div>
                    <FaCoins className="text-3xl text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Revenue Chart Placeholder */}
              <div className="dashboard-card">
                <h3>Revenue Analytics</h3>

                <div className="text-center py-12">
                  <FaChartLine className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">Interactive revenue chart will be displayed here.</p>
                  <p className="text-gray-500 text-sm">Chart.js or Recharts integration can be added for visual analytics.</p>

                  {/* Simple Bar Chart Representation */}
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Deposits</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-green-200 rounded-full h-4">
                          <div className="bg-green-600 h-4 rounded-full" style={{width: '70%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">{formatCurrency(stats.totalDeposits || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Withdrawals</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-red-200 rounded-full h-4">
                          <div className="bg-red-600 h-4 rounded-full" style={{width: '30%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">{formatCurrency(stats.totalWithdrawals || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Net Revenue</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-32 rounded-full h-4 ${stats.totalRevenue >= 0 ? 'bg-blue-200' : 'bg-orange-200'}`}>
                          <div className={`h-4 rounded-full ${stats.totalRevenue >= 0 ? 'bg-blue-600' : 'bg-orange-600'}`} style={{width: '50%'}}></div>
                        </div>
                        <span className={`text-sm ${stats.totalRevenue >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {formatCurrency(stats.totalRevenue || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Announcements Section */}
        {currentSection === 'announcements' && (
          <div>
            <div className="dashboard-grid">
              {/* Create Announcement */}
              <div className="dashboard-card">
                <h3>Create Announcement</h3>

                <form onSubmit={handleCreateNews}>
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                      placeholder="Announcement title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Content *</label>
                    <textarea
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                      placeholder="Announcement content"
                      rows="6"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Media (Optional)</label>
                    <input
                      type="file"
                      onChange={(e) => setNewsForm({...newsForm, media: e.target.files[0]})}
                      accept="image/*,video/*"
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
                      <FaPlus className="mr-2" />
                    )}
                    Post Announcement
                  </button>
                </form>
              </div>

              {/* Existing Announcements */}
              <div className="dashboard-card">
                <h3>Recent Announcements</h3>

                <div className="space-y-4">
                  {news.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{item.content}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        {item.media_url && (
                          <span className="text-green-600">📎 Media attached</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {news.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No announcements yet</p>
                  )}
                </div>
              </div>
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
              <h3>Admin Settings</h3>
              <p className="text-gray-600">
                System configuration and preferences will be available here.
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

export default KediAdminDashboard;