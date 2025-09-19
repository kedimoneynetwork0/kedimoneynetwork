import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingUsers, getPendingTransactions, getAllUsers, getAllTransactions, approveUser, approveTransaction, createNews, updateNews, deleteNews, getNews, getFullUrl, getPendingWithdrawals, approveWithdrawal, getCompanyAssets, getUserDetails, downloadUsersCSV, downloadTransactionsCSV } from '../api';
import Header from '../components/Header';
import './admin-dashboard.css';

export default function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingTxns, setPendingTxns] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [news, setNews] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [companyAssets, setCompanyAssets] = useState(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'history', 'news', 'withdrawals', 'assets', or 'user-details'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  
  // News form state
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsMedia, setNewsMedia] = useState(null);
  const [editingNews, setEditingNews] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
    fetchPendingTxns();
    fetchAllUsers();
    fetchAllTransactions();
    fetchNews();
    fetchPendingWithdrawals();
    fetchCompanyAssets();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await getPendingUsers();
      setPendingUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPendingTxns = async () => {
    try {
      const response = await getPendingTransactions();
      setPendingTxns(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await getAllUsers();
      setAllUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const response = await getAllTransactions();
      setAllTransactions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchNews = async () => {
    try {
      const response = await getNews();
      setNews(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPendingWithdrawals = async () => {
    try {
      const response = await getPendingWithdrawals();
      setPendingWithdrawals(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCompanyAssets = async () => {
    try {
      const response = await getCompanyAssets();
      setCompanyAssets(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleApproveUser = async (id, approve) => {
    try {
      await approveUser(id, approve);
      setMessage(`User ${approve ? 'approved' : 'rejected'}`);
      fetchPendingUsers();
      fetchAllUsers(); // Refresh all users list
    } catch (error) {
      setMessage('Error updating user status');
    }
  };

  const handleApproveTxn = async (id, approve) => {
    try {
      await approveTransaction(id, approve);
      setMessage(`Transaction ${approve ? 'approved' : 'rejected'}`);
      fetchPendingTxns();
      fetchAllTransactions(); // Refresh all transactions list
    } catch (error) {
      setMessage('Error updating transaction status');
    }
  };

  const handleApproveWithdrawal = async (id, approve) => {
    try {
      await approveWithdrawal(id, approve);
      setMessage(`Withdrawal ${approve ? 'approved' : 'rejected'}`);
      fetchPendingWithdrawals(); // Refresh pending withdrawals list
    } catch (error) {
      setMessage('Error updating withdrawal status');
    }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newsTitle);
      formData.append('content', newsContent);
      if (newsMedia) {
        formData.append('media', newsMedia);
      }

      if (editingNews) {
        await updateNews(editingNews.id, formData);
        setMessage('News updated successfully');
      } else {
        await createNews(formData);
        setMessage('News created successfully');
      }

      setNewsTitle('');
      setNewsContent('');
      setNewsMedia(null);
      setEditingNews(null);
      fetchNews(); // Refresh news list
    } catch (error) {
      setMessage('Error saving news: ' + error.message);
    }
  };

  const handleEditNews = (newsItem) => {
    setNewsTitle(newsItem.title);
    setNewsContent(newsItem.content);
    setNewsMedia(null); // Reset media when editing
    setEditingNews(newsItem);
  };

  const handleDeleteNews = async (newsId) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await deleteNews(newsId);
        setMessage('News deleted successfully');
        fetchNews(); // Refresh news list
      } catch (error) {
        setMessage('Error deleting news: ' + error.message);
      }
    }
  };

  const handleCancelEdit = () => {
    setNewsTitle('');
    setNewsContent('');
    setNewsMedia(null);
    setEditingNews(null);
  };

  const handleViewUserDetails = async (user) => {
    try {
      const response = await getUserDetails(user.id);
      setSelectedUser(user);
      setUserDetails(response.data);
      setActiveTab('user-details');
    } catch (error) {
      setMessage('Error loading user details: ' + error.message);
    }
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setUserDetails(null);
    setActiveTab('history');
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/admin-login';
  };

  // Filtered data based on search term
  const filteredPendingUsers = pendingUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter(user =>
    (user.firstname + ' ' + user.lastname).toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingTxns = pendingTxns.filter(txn =>
    txn.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.txn_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllTransactions = allTransactions.filter(txn =>
    txn.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.txn_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingWithdrawals = pendingWithdrawals.filter(withdrawal =>
    withdrawal.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Download functions
  const handleDownloadUsers = async () => {
    try {
      const response = await downloadUsersCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kedi_users_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Users list downloaded successfully');
    } catch (error) {
      setMessage('Error downloading users list');
      console.error('Download error:', error);
    }
  };

  const handleDownloadTransactions = async () => {
    try {
      const response = await downloadTransactionsCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kedi_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Transaction history downloaded successfully');
    } catch (error) {
      setMessage('Error downloading transaction history');
      console.error('Download error:', error);
    }
  };

  return (
    <div>
      {showHeader && <Header />}
      <div className="sidebar">
        <h2>Admin Dashboard</h2>
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Approvals
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Transaction History
          </button>
          <button
            className={`tab-button ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            News Management
          </button>
          <button
            className={`tab-button ${activeTab === 'withdrawals' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdrawals')}
          >
            Withdrawal Management
          </button>
          <button
            className={`tab-button ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            Company Assets
          </button>
          <a
            href="/user-management"
            className="tab-button"
            style={{ textDecoration: 'none', display: 'block', marginTop: '10px', backgroundColor: '#28a745', color: 'white', textAlign: 'center' }}
          >
            👥 User Management
          </a>
          {selectedUser && (
            <button
              className={`tab-button ${activeTab === 'user-details' ? 'active' : ''}`}
              onClick={() => setActiveTab('user-details')}
            >
              User Details
            </button>
          )}
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="main-content">
        <div className="container">
           {message && (
             <div className={`message ${message.includes('Error') || message.includes('error') ? 'error' : 'success'}`}>
               {message}
             </div>
           )}

           {/* Search and Header Toggle Controls */}
           <div className="dashboard-controls" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
             <div style={{ flex: 1 }}>
               <input
                 type="text"
                 placeholder="Search..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="form-control"
                 style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
               />
             </div>
             <button
               onClick={() => setShowHeader(!showHeader)}
               className="action-button"
               style={{ padding: '8px 16px', fontSize: '14px' }}
             >
               {showHeader ? 'Hide Header' : 'Show Header'}
             </button>
           </div>

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Pending Users</h3>
              {filteredPendingUsers.length === 0 ? (
                <p className="text-center">{searchTerm ? 'No matching pending users' : 'No pending users'}</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.email}</td>
                          <td>
                            <button
                              onClick={() => handleApproveUser(user.id, true)}
                              className="action-button"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveUser(user.id, false)}
                              className="action-button danger"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="dashboard-card">
              <h3>Pending Transactions</h3>
              {filteredPendingTxns.length === 0 ? (
                <p className="text-center">{searchTerm ? 'No matching pending transactions' : 'No pending transactions'}</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Transaction ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingTxns.map((txn) => (
                        <tr key={txn.id}>
                          <td>{txn.email}</td>
                          <td>{txn.type}</td>
                          <td>{txn.amount} RWF</td>
                          <td>{txn.txn_id}</td>
                          <td>{new Date(txn.created_at).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                          <td>
                            <span className={`status-badge status-${txn.status.toLowerCase()}`}>
                              {txn.status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleApproveTxn(txn.id, true)}
                              className="action-button"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveTxn(txn.id, false)}
                              className="action-button danger"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-4">
                <h3>All Users</h3>
                <button
                  onClick={handleDownloadUsers}
                  className="action-button"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  📥 Download CSV
                </button>
              </div>
              {filteredAllUsers.length === 0 ? (
                <p className="text-center">{searchTerm ? 'No matching users found' : 'No users found'}</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <button
                              onClick={() => handleViewUserDetails(user)}
                              className="action-button"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              {user.firstname} {user.lastname}
                            </button>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.username}</td>
                          <td>
                            <span className={`status-badge status-${user.status.toLowerCase()}`}>
                              {user.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-4">
                <h3>All Transactions</h3>
                <button
                  onClick={handleDownloadTransactions}
                  className="action-button"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  📥 Download CSV
                </button>
              </div>
              {filteredAllTransactions.length === 0 ? (
                <p className="text-center">{searchTerm ? 'No matching transactions found' : 'No transactions found'}</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Transaction ID</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllTransactions.map((txn) => (
                        <tr key={txn.id}>
                          <td>{txn.email}</td>
                          <td>{txn.type}</td>
                          <td>{txn.amount} RWF</td>
                          <td>{txn.txn_id}</td>
                          <td>{new Date(txn.created_at).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                          <td>
                            <span className={`status-badge status-${txn.status.toLowerCase()}`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* News Management Tab */}
        {activeTab === 'news' && (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>{editingNews ? 'Edit News' : 'Create News'}</h3>
              <form onSubmit={handleCreateNews}>
                <div className="form-group">
                  <label htmlFor="newsTitle">Title</label>
                  <input
                    type="text"
                    id="newsTitle"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newsContent">Content</label>
                  <textarea
                    id="newsContent"
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    required
                    className="form-control"
                    rows="5"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newsMedia">Media (Image, Video, or PDF)</label>
                  <input
                    type="file"
                    id="newsMedia"
                    onChange={(e) => setNewsMedia(e.target.files[0])}
                    className="form-control"
                    accept="image/*,video/*,application/pdf"
                  />
                  {editingNews && (
                    <small className="text-muted">
                      Leave empty to keep existing media, or select new file to replace
                    </small>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="action-button">
                    {editingNews ? 'Update News' : 'Post News'}
                  </button>
                  {editingNews && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="action-button secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="dashboard-card">
              <h3>Existing News</h3>
              {filteredNews.length === 0 ? (
                <p className="text-center">{searchTerm ? 'No matching news found' : 'No news posted yet'}</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Media</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNews.map((item) => (
                        <tr key={item.id}>
                          <td>{item.title}</td>
                          <td>{new Date(item.created_at).toLocaleDateString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                          <td>
                            {item.media_url && item.media_type === 'image' && (
                              <img src={getFullUrl(item.media_url)} alt="News" className="news-media-thumb" />
                            )}
                            {item.media_url && item.media_type === 'video' && (
                              <span>Video</span>
                            )}
                            {item.media_url && item.media_type === 'application' && (
                              <span>PDF</span>
                            )}
                            {!item.media_url && (
                              <span>No media</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleEditNews(item)}
                              className="action-button"
                              style={{ marginRight: '5px', padding: '4px 8px', fontSize: '12px' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNews(item.id)}
                              className="action-button danger"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Withdrawal Management Tab */}
        {activeTab === 'withdrawals' && (
          <div className="dashboard-card">
            <h3>Pending Withdrawals</h3>
            {filteredPendingWithdrawals.length === 0 ? (
              <p className="text-center">{searchTerm ? 'No matching pending withdrawals' : 'No pending withdrawals'}</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Stake Amount</th>
                      <th>Stake Period</th>
                      <th>Withdrawal Amount</th>
                      <th>Request Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPendingWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id}>
                        <td>{withdrawal.email}</td>
                        <td>{withdrawal.stake_amount} RWF</td>
                        <td>{withdrawal.stake_period} days</td>
                        <td>{withdrawal.amount} RWF</td>
                        <td>{new Date(withdrawal.request_date).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                        <td>
                          <button
                            onClick={() => handleApproveWithdrawal(withdrawal.id, true)}
                            className="action-button"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveWithdrawal(withdrawal.id, false)}
                            className="action-button danger"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Company Assets Tab */}
        {activeTab === 'assets' && (
          <div className="dashboard-grid">
            {/* Financial Overview */}
            <div className="dashboard-card">
              <h3>💰 Financial Overview</h3>
              {companyAssets ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Assets */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Total Assets</p>
                        <p className="text-2xl font-bold text-green-800">{(companyAssets.assets?.totalAssets || 0).toLocaleString()} RWF</p>
                        <p className="text-xs text-green-600 mt-1">User balances + Active stakes + Transactions</p>
                      </div>
                      <div className="text-green-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-600 font-medium">Total Liabilities</p>
                        <p className="text-2xl font-bold text-red-800">{(companyAssets.liabilities?.totalLiabilities || 0).toLocaleString()} RWF</p>
                        <p className="text-xs text-red-600 mt-1">Withdrawals + Bonuses paid</p>
                      </div>
                      <div className="text-red-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Net Assets */}
                  <div className={`p-4 rounded-lg border ${companyAssets.netAssets >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${companyAssets.netAssets >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Assets</p>
                        <p className={`text-2xl font-bold ${companyAssets.netAssets >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                          {companyAssets.netAssets?.toLocaleString() || 0} RWF
                        </p>
                        <p className={`text-xs mt-1 ${companyAssets.netAssets >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          Assets - Liabilities
                        </p>
                      </div>
                      <div className={companyAssets.netAssets >= 0 ? 'text-blue-500' : 'text-orange-500'}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* User Balances */}
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-indigo-600 font-medium">User Balances</p>
                        <p className="text-2xl font-bold text-indigo-800">{(companyAssets.assets?.totalUserBalances || 0).toLocaleString()} RWF</p>
                        <p className="text-xs text-indigo-600 mt-1">Approved users' estimated balances</p>
                      </div>
                      <div className="text-indigo-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Active Stakes */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Active Stakes</p>
                        <p className="text-2xl font-bold text-purple-800">{(companyAssets.assets?.totalActiveStakes || 0).toLocaleString()} RWF</p>
                        <p className="text-xs text-purple-600 mt-1">Money invested in active stakes</p>
                      </div>
                      <div className="text-purple-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Pending Withdrawals */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">Pending Withdrawals</p>
                        <p className="text-2xl font-bold text-yellow-800">{(companyAssets.liabilities?.totalPendingWithdrawals || 0).toLocaleString()} RWF</p>
                        <p className="text-xs text-yellow-600 mt-1">Outstanding withdrawal requests</p>
                      </div>
                      <div className="text-yellow-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading financial data...</p>
                </div>
              )}
            </div>

            {/* User Statistics */}
            <div className="dashboard-card">
              <h3>👥 User Statistics</h3>
              {companyAssets ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-indigo-600 font-medium">Total Users</p>
                        <p className="text-2xl font-bold text-indigo-800">{companyAssets.users?.totalUsers || 0}</p>
                        <p className="text-xs text-indigo-600 mt-1">All registered users</p>
                      </div>
                      <div className="text-indigo-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-teal-600 font-medium">Approved Users</p>
                        <p className="text-2xl font-bold text-teal-800">{companyAssets.users?.approvedUsers || 0}</p>
                        <p className="text-xs text-teal-600 mt-1">
                          {companyAssets.users?.totalUsers > 0
                            ? `${Math.round((companyAssets.users.approvedUsers / companyAssets.users.totalUsers) * 100)}% approval rate`
                            : '0% approval rate'
                          }
                        </p>
                      </div>
                      <div className="text-teal-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Active Users</p>
                        <p className="text-2xl font-bold text-green-800">{companyAssets.users?.activeUsers || 0}</p>
                        <p className="text-xs text-green-600 mt-1">Users with positive balance</p>
                      </div>
                      <div className="text-green-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading user statistics...</p>
                </div>
              )}
            </div>

            {/* Transaction Summary */}
            <div className="dashboard-card">
              <h3>📊 Assets & Liabilities Breakdown</h3>
              {companyAssets ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount (RWF)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Assets */}
                      <tr className="bg-green-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-900">
                          User Balances
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900 font-semibold">
                          {(companyAssets.assets?.totalUserBalances || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Asset
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Available
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-900">
                          Active Stakes
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900 font-semibold">
                          {(companyAssets.assets?.totalActiveStakes || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Asset
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Invested
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-900">
                          Approved Transactions
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900 font-semibold">
                          {(companyAssets.assets?.totalApprovedTransactions || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Asset
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Processed
                          </span>
                        </td>
                      </tr>

                      {/* Liabilities */}
                      <tr className="bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-900">
                          Approved Withdrawals
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-900 font-semibold">
                          {(companyAssets.liabilities?.totalApprovedWithdrawals || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Liability
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                            Paid
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-900">
                          Pending Withdrawals
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-900 font-semibold">
                          {(companyAssets.liabilities?.totalPendingWithdrawals || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Liability
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-900">
                          Bonuses Paid
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-900 font-semibold">
                          {(companyAssets.liabilities?.totalBonuses || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Liability
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Paid
                          </span>
                        </td>
                      </tr>

                      {/* Summary */}
                      <tr className="bg-gray-100 font-semibold">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          NET POSITION
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${companyAssets.netAssets >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                          {companyAssets.netAssets?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${companyAssets.netAssets >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {companyAssets.netAssets >= 0 ? 'Surplus' : 'Deficit'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Current
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading transaction summary...</p>
                </div>
              )}
            </div>

            {/* Net Asset Position */}
            <div className="dashboard-card">
              <h3>🏦 Net Asset Position</h3>
              {companyAssets ? (
                <div className={`p-6 rounded-lg border ${companyAssets.netAssets >= 0 ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'}`}>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${companyAssets.netAssets >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {companyAssets.netAssets?.toLocaleString() || 0} RWF
                    </div>
                    <p className={`font-medium ${companyAssets.netAssets >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {companyAssets.netAssets >= 0 ? 'Positive Net Assets' : 'Negative Net Assets'}
                    </p>

                    {/* Asset to Liability Ratio */}
                    <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Asset-to-Liability Ratio:</span> {companyAssets.summary?.assetToLiabilityRatio || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {companyAssets.summary?.assetToLiabilityRatio !== 'N/A' && parseFloat(companyAssets.summary.assetToLiabilityRatio) >= 1
                          ? 'Healthy financial position (Assets ≥ Liabilities)'
                          : 'Monitor financial position closely'
                        }
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="text-green-700">
                        <span className="font-semibold">Total Assets:</span><br />
                        {(companyAssets.assets?.totalAssets || 0).toLocaleString()} RWF
                      </div>
                      <div className="text-red-600">
                        <span className="font-semibold">Total Liabilities:</span><br />
                        {(companyAssets.liabilities?.totalLiabilities || 0).toLocaleString()} RWF
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-white bg-opacity-50 p-2 rounded">
                        <span className="font-semibold text-indigo-700">User Balances:</span><br />
                        {(companyAssets.assets?.totalUserBalances || 0).toLocaleString()} RWF
                      </div>
                      <div className="bg-white bg-opacity-50 p-2 rounded">
                        <span className="font-semibold text-purple-700">Active Stakes:</span><br />
                        {(companyAssets.assets?.totalActiveStakes || 0).toLocaleString()} RWF
                      </div>
                      <div className="bg-white bg-opacity-50 p-2 rounded">
                        <span className="font-semibold text-yellow-700">Pending Withdrawals:</span><br />
                        {(companyAssets.liabilities?.totalPendingWithdrawals || 0).toLocaleString()} RWF
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Calculating net position...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Details Tab */}
        {activeTab === 'user-details' && userDetails && (
          <div>
            <div className="dashboard-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>User Details: {userDetails.user.firstname} {userDetails.user.lastname}</h3>
                <button onClick={handleBackToUsers} className="action-button secondary">
                  Back to Users
                </button>
              </div>

              {/* User Profile Picture */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {userDetails.user.profilePicture ? (
                  <img
                    src={getFullUrl(userDetails.user.profilePicture)}
                    alt="Profile"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #007bff'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      border: '2px solid #007bff'
                    }}
                  >
                    <span style={{ fontSize: '36px', color: '#6c757d' }}>
                      {userDetails.user.firstname?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* User Basic Information */}
              <div className="transaction-details">
                <div className="transaction-detail">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{userDetails.user.firstname} {userDetails.user.lastname}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{userDetails.user.email}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Username</span>
                  <span className="detail-value">{userDetails.user.username}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{userDetails.user.phone}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">ID Number</span>
                  <span className="detail-value">{userDetails.user.idNumber}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Referral ID</span>
                  <span className="detail-value">{userDetails.user.referralId || 'N/A'}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Role</span>
                  <span className="detail-value">{userDetails.user.role}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    <span className={`status-badge status-${userDetails.user.status.toLowerCase()}`}>
                      {userDetails.user.status}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* User Transactions */}
            <div className="dashboard-card">
              <h3>User Transactions ({userDetails.transactions.length})</h3>
              {userDetails.transactions.length === 0 ? (
                <p className="text-center">No transactions found</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Transaction ID</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.transactions.map((txn) => (
                        <tr key={txn.id}>
                          <td>{txn.type}</td>
                          <td>{txn.amount} RWF</td>
                          <td>{txn.txn_id}</td>
                          <td>
                            <span className={`status-badge status-${txn.status.toLowerCase()}`}>
                              {txn.status}
                            </span>
                          </td>
                          <td>{new Date(txn.created_at).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* User Stakes */}
            <div className="dashboard-card">
              <h3>User Stakes ({userDetails.stakes.length})</h3>
              {userDetails.stakes.length === 0 ? (
                <p className="text-center">No stakes found</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Period</th>
                        <th>Interest Rate</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.stakes.map((stake) => (
                        <tr key={stake.id}>
                          <td>{stake.amount} RWF</td>
                          <td>{stake.stake_period} days</td>
                          <td>{(stake.interest_rate * 100)}%</td>
                          <td>{new Date(stake.start_date).toLocaleDateString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                          <td>{new Date(stake.end_date).toLocaleDateString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                          <td>
                            <span className={`status-badge status-${stake.status}`}>
                              {stake.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* User Withdrawals */}
            <div className="dashboard-card">
              <h3>User Withdrawals ({userDetails.withdrawals.length})</h3>
              {userDetails.withdrawals.length === 0 ? (
                <p className="text-center">No withdrawals found</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Request Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id}>
                          <td>{withdrawal.amount} RWF</td>
                          <td>{new Date(withdrawal.request_date).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                          <td>
                            <span className={`status-badge status-${withdrawal.status}`}>
                              {withdrawal.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* User Bonuses */}
            <div className="dashboard-card">
              <h3>User Bonuses ({userDetails.bonuses.length})</h3>
              {userDetails.bonuses.length === 0 ? (
                <p className="text-center">No bonuses found</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.bonuses.map((bonus) => (
                        <tr key={bonus.id}>
                          <td>{bonus.amount} RWF</td>
                          <td>{bonus.description}</td>
                          <td>{new Date(bonus.created_at).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
