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

  const [userSearchTerm, setUserSearchTerm] = useState('');

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
    { id: 'messages', label: 'User Messages', icon: FaUser },
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

  // Filter users based on search term
  const filteredUsers = allUsers.filter(user => {
    if (!userSearchTerm) return true;

    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.firstname?.toLowerCase().includes(searchLower) ||
      user.lastname?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower) ||
      user.idNumber?.toLowerCase().includes(searchLower) ||
      user.id?.toString().includes(searchLower)
    );
  });

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

        {/* User Management Section */}
        {currentSection === 'users' && (
          <div>
            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-4">
                <h3>All Users Management</h3>
                <div className="text-sm text-gray-600">
                  Total Users: {allUsers.length} | Approved: {allUsers.filter(u => u.status === 'approved').length}
                </div>
              </div>

              {/* Search and Filter */}
              <div className="mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by name, email, phone, or ID number..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    {filteredUsers.length} of {allUsers.length} users
                  </div>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>ID Number</th>
                      <th>Status</th>
                      <th>Role</th>
                      <th>Balance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="font-medium text-gray-600">
                          {user.id}
                        </td>
                        <td className="font-medium">
                          {user.firstname} {user.lastname}
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td className="font-mono text-sm">
                          {user.idNumber || 'N/A'}
                        </td>
                        <td>{getStatusBadge(user.status)}</td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="font-medium text-green-600">
                          {formatCurrency(user.estimated_balance || 0)} RWF
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            {user.status === 'pending' && (
                              <>
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
                              </>
                            )}
                            <button
                              onClick={() => showSection('user-details')}
                              className="action-button secondary"
                            >
                              <FaEye className="mr-1" />
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No users found</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No users match your search criteria: "{userSearchTerm}"
                  </p>
                ) : null}
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

        {/* User Messages Section */}
        {currentSection === 'messages' && (
          <div>
            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-6">
                <h3>User Messages & Support Requests</h3>
                <div className="text-sm text-gray-600">
                  Manage user inquiries and support requests
                </div>
              </div>

              <div className="space-y-4">
                {/* Sample support messages - in real app this would come from API */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-yellow-800">Transaction Issue - User: john@example.com</h4>
                      <p className="text-yellow-700 text-sm">Subject: Unable to complete tree planting transaction</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        Pending Response
                      </span>
                      <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <p className="text-yellow-700 text-sm mb-3">
                    "Hello, I'm having trouble completing my tree planting transaction.
                    The system shows an error when I try to submit. Can you please help me resolve this issue?"
                  </p>
                  <div className="flex space-x-2">
                    <button className="action-button">
                      Reply
                    </button>
                    <button className="action-button secondary">
                      Mark as Resolved
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-blue-800">Stake Information - User: mary@example.com</h4>
                      <p className="text-blue-700 text-sm">Subject: Question about stake interest rates</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        In Progress
                      </span>
                      <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                    </div>
                  </div>
                  <p className="text-blue-700 text-sm mb-3">
                    "Can you explain how the interest rates work for different stake periods?
                    I'm considering investing in a 180-day stake but want to understand the returns better."
                  </p>
                  <div className="flex space-x-2">
                    <button className="action-button">
                      Reply
                    </button>
                    <button className="action-button secondary">
                      Mark as Resolved
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-green-800">Account Verification - User: peter@example.com</h4>
                      <p className="text-green-700 text-sm">Subject: Account approval status</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Resolved
                      </span>
                      <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                    </div>
                  </div>
                  <p className="text-green-700 text-sm mb-3">
                    "Thank you for approving my account! I can now access all the features.
                    Looking forward to starting my investment journey with KEDI."
                  </p>
                  <div className="flex space-x-2">
                    <button className="action-button secondary">
                      View Conversation
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button className="action-button">
                  Load More Messages
                </button>
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

        {/* User Details Section */}
        {currentSection === 'user-details' && (
          <div>
            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-6">
                <h3>User Details</h3>
                <button
                  onClick={() => showSection('users')}
                  className="action-button secondary"
                >
                  <FaArrowLeft className="mr-2" />
                  Back to Users
                </button>
              </div>

              {allUsers.length > 0 ? (
                <div className="space-y-6">
                  {/* User Profile Summary */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-green-600">
                          {allUsers[0]?.firstname?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-800">
                          {allUsers[0]?.firstname} {allUsers[0]?.lastname}
                        </h4>
                        <p className="text-gray-600">{allUsers[0]?.email}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          {getStatusBadge(allUsers[0]?.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            allUsers[0]?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {allUsers[0]?.role || 'user'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* User Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(allUsers[0]?.estimated_balance || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Balance (RWF)</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {allTransactions.filter(t => t.user_id === allUsers[0]?.id).length}
                        </div>
                        <div className="text-sm text-gray-600">Transactions</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {stakes.filter(s => s.user_id === allUsers[0]?.id).length}
                        </div>
                        <div className="text-sm text-gray-600">Active Stakes</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {withdrawals.filter(w => w.user_id === allUsers[0]?.id).length}
                        </div>
                        <div className="text-sm text-gray-600">Withdrawals</div>
                      </div>
                    </div>
                  </div>

                  {/* User Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="dashboard-card">
                      <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Full Name:</span>
                          <span>{allUsers[0]?.firstname} {allUsers[0]?.lastname}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Email:</span>
                          <span>{allUsers[0]?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Phone:</span>
                          <span>{allUsers[0]?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">ID Number:</span>
                          <span className="font-mono text-sm">{allUsers[0]?.idNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">User ID:</span>
                          <span className="font-mono text-sm">{allUsers[0]?.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Referral ID:</span>
                          <span>{allUsers[0]?.referralId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Registration Date:</span>
                          <span>{allUsers[0]?.created_at ? new Date(allUsers[0].created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className="dashboard-card">
                      <h4 className="text-lg font-semibold mb-4">Account Status</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Status:</span>
                          <span>{getStatusBadge(allUsers[0]?.status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Role:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            allUsers[0]?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {allUsers[0]?.role || 'user'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Current Balance:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(allUsers[0]?.estimated_balance || 0)} RWF
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Profile Picture:</span>
                          <span>{allUsers[0]?.profile_picture ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="dashboard-card">
                    <h4 className="text-lg font-semibold mb-4">Recent Transactions</h4>
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
                          {allTransactions
                            .filter(t => t.user_id === allUsers[0]?.id)
                            .slice(0, 5)
                            .map((txn) => (
                              <tr key={txn.id}>
                                <td>{new Date(txn.created_at).toLocaleDateString()}</td>
                                <td>{txn.type}</td>
                                <td className="font-medium">{formatCurrency(txn.amount)} RWF</td>
                                <td>{getStatusBadge(txn.status)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {allTransactions.filter(t => t.user_id === allUsers[0]?.id).length === 0 && (
                        <p className="text-center text-gray-500 py-8">No transactions found for this user</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaUser className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No user data available</p>
                  <button
                    onClick={() => showSection('users')}
                    className="action-button mt-4"
                  >
                    Back to Users List
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Section */}
        {currentSection === 'settings' && (
          <div>
            <div className="dashboard-grid">
              {/* Admin Credentials */}
              <div className="dashboard-card">
                <h3>Admin Credentials</h3>
                <p className="text-gray-600 mb-4">
                  Manage your admin account credentials and security settings.
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">🔑 Change Admin Password</h4>
                    <p className="text-blue-700 text-sm mb-3">
                      Update your admin password regularly for security.
                    </p>
                    <button className="action-button">
                      Change Password
                    </button>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">👤 Update Admin Email</h4>
                    <p className="text-green-700 text-sm mb-3">
                      Change the admin email address for notifications.
                    </p>
                    <button className="action-button">
                      Update Email
                    </button>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">🔐 Two-Factor Authentication</h4>
                    <p className="text-purple-700 text-sm mb-3">
                      Enable 2FA for enhanced admin account security.
                    </p>
                    <button className="action-button">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>

              {/* System Settings */}
              <div className="dashboard-card">
                <h3>System Settings</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚙️ System Configuration</h4>
                    <p className="text-yellow-700 text-sm mb-3">
                      Configure system-wide settings and preferences.
                    </p>
                    <button className="action-button">
                      System Config
                    </button>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-semibold text-indigo-800 mb-2">📊 Database Management</h4>
                    <p className="text-indigo-700 text-sm mb-3">
                      Manage database connections and backups.
                    </p>
                    <button className="action-button">
                      Database Settings
                    </button>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">🚨 Security Settings</h4>
                    <p className="text-red-700 text-sm mb-3">
                      Configure security policies and access controls.
                    </p>
                    <button className="action-button">
                      Security Config
                    </button>
                  </div>

                  <div className="p-4 bg-teal-50 rounded-lg">
                    <h4 className="font-semibold text-teal-800 mb-2">📧 Email Configuration</h4>
                    <p className="text-teal-700 text-sm mb-3">
                      Set up email templates and SMTP settings.
                    </p>
                    <button className="action-button">
                      Email Settings
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
    </div>
  );
};

export default KediAdminDashboard;