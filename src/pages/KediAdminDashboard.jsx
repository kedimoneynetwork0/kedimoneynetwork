import React, { useState, useEffect } from 'react';
import {
  FaBars, FaTimes, FaTachometerAlt, FaUsers, FaClock, FaExchangeAlt,
  FaChartLine, FaBullhorn, FaCog, FaSignOutAlt, FaUser, FaCheck,
  FaTimes as FaReject, FaEye, FaPlus, FaLeaf, FaChevronDown,
  FaUserCheck, FaUserClock, FaMoneyBillWave, FaCoins
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

      // Update stats
      const pendingUsersData = pendingUsersRes.data || [];
      const allUsersData = allUsersRes.data || [];
      const transactionsData = transactionsRes.data || [];
      const assetsData = assetsRes.data || {};
      const newsData = newsRes.data || [];

      setStats({
        totalUsers: allUsersData.length,
        pendingUsers: pendingUsersData.length,
        totalTransactions: transactionsData.length,
        totalRevenue: assetsData.assets?.totalAssets || 0
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
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 shadow-lg fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FaLeaf className="text-2xl" />
            <span className="text-xl font-bold">KEDI BUSINESS & AGRI FUNDS</span>
            <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">ADMIN</span>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-300"
              >
                <div className="w-8 h-8 bg-white bg-opacity-30 rounded-full flex items-center justify-center font-semibold">
                  A
                </div>
                <span className="font-medium">Admin</span>
                <FaChevronDown className={`transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                    Profile
                  </button>
                  <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                    Settings
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300"
          >
            {sidebarOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-xl transition-all duration-300 z-30
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        md:translate-x-0
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <h3 className={`text-green-600 font-semibold ${sidebarCollapsed ? 'hidden' : 'block'}`}>Admin Panel</h3>
            <button
              onClick={toggleSidebarCollapse}
              className="hidden md:block p-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              <FaBars className="text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => showSection(item.id)}
                  className={`
                    w-full flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'justify-start px-4'} py-3 rounded-lg transition-all duration-300
                    ${currentSection === item.id
                      ? 'bg-green-100 text-green-700 border-r-4 border-green-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-green-600'
                    }
                  `}
                >
                  <item.icon className={`${sidebarCollapsed ? 'text-lg' : 'text-lg mr-3'}`} />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`
        transition-all duration-300 pt-16
        ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}
        ${sidebarOpen ? 'ml-0' : 'ml-0'}
      `}>
        {/* Overview Section */}
        {currentSection === 'overview' && (
          <div className="p-4 md:p-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl shadow-lg mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Admin Dashboard - Manage KEDI Funds
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Monitor users, transactions, and system performance
                  </p>
                </div>
                <button
                  onClick={loadDashboardData}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <FaExchangeAlt />
                  )}
                  <span>Refresh Data</span>
                </button>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaUsers className="text-2xl text-blue-600" />
                      <span className="text-lg font-medium text-gray-700">Total Users</span>
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

              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaUserClock className="text-2xl text-yellow-600" />
                      <span className="text-lg font-medium text-gray-700">Pending Approvals</span>
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

              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaExchangeAlt className="text-2xl text-green-600" />
                      <span className="text-lg font-medium text-gray-700">Total Transactions</span>
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

              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaCoins className="text-2xl text-purple-600" />
                      <span className="text-lg font-medium text-gray-700">Total Revenue</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Users Preview */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Recent Pending Users</h2>
                  <button
                    onClick={() => showSection('pending')}
                    className="text-green-600 hover:text-green-700 font-medium transition-colors duration-300"
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
                          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-300"
                        >
                          <FaCheck className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleApproveUser(user.id, false)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors duration-300"
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
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
                  <button
                    onClick={() => showSection('transactions')}
                    className="text-green-600 hover:text-green-700 font-medium transition-colors duration-300"
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
          <div className="p-4 md:p-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending User Approvals</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-3 px-4 text-gray-800">{user.email}</td>
                        <td className="py-3 px-4">{getStatusBadge('pending')}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveUser(user.id, true)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center space-x-2"
                            >
                              <FaCheck className="text-sm" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleApproveUser(user.id, false)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center space-x-2"
                            >
                              <FaReject className="text-sm" />
                              <span>Reject</span>
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
          <div className="p-4 md:p-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">All Transactions</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTransactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-3 px-4 text-gray-800">{new Date(txn.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-gray-800">{txn.email}</td>
                        <td className="py-3 px-4 text-gray-800">{txn.type}</td>
                        <td className="py-3 px-4 text-gray-800 font-medium">{formatCurrency(txn.amount)} RWF</td>
                        <td className="py-3 px-4">{getStatusBadge(txn.status)}</td>
                        <td className="py-3 px-4">
                          {txn.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveTransaction(txn.id, true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors duration-300"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproveTransaction(txn.id, false)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-300"
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
                {allTransactions.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No transactions found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Announcements Section */}
        {currentSection === 'announcements' && (
          <div className="p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Announcement */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Announcement</h2>

                <form onSubmit={handleCreateNews} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                      placeholder="Announcement title"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                      placeholder="Announcement content"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      rows="6"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Media (Optional)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setNewsForm({...newsForm, media: e.target.files[0]})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      accept="image/*,video/*"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <FaPlus />
                    )}
                    <span>Post Announcement</span>
                  </button>
                </form>
              </div>

              {/* Existing Announcements */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Announcements</h2>

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
          <div className="p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="text-6xl text-gray-400 mb-6">
                  <FaCog />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Admin Settings</h2>
                <p className="text-gray-600 text-lg">
                  System configuration and preferences will be available here.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="fixed top-20 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center">
              <div className="py-1">
                <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default KediAdminDashboard;