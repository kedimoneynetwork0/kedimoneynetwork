import React, { useEffect, useState } from 'react';
import { getPendingUsers, getPendingTransactions, getAllUsers, getAllTransactions, approveUser, approveTransaction, createNews, updateNews, deleteNews, getNews, getFullUrl, getPendingWithdrawals, approveWithdrawal, getCompanyAssets, getUserDetails } from '../api';
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

  return (
    <div>
      <Header />
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

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Pending Users</h3>
              {pendingUsers.length === 0 ? (
                <p className="text-center">No pending users</p>
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
                      {pendingUsers.map((user) => (
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
              {pendingTxns.length === 0 ? (
                <p className="text-center">No pending transactions</p>
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
                      {pendingTxns.map((txn) => (
                        <tr key={txn.id}>
                          <td>{txn.email}</td>
                          <td>{txn.type}</td>
                          <td>{txn.amount} RWF</td>
                          <td>{txn.txn_id}</td>
                          <td>{new Date(txn.created_at).toLocaleString()}</td>
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
              <h3>All Users</h3>
              {allUsers.length === 0 ? (
                <p className="text-center">No users found</p>
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
                      {allUsers.map((user) => (
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
              <h3>All Transactions</h3>
              {allTransactions.length === 0 ? (
                <p className="text-center">No transactions found</p>
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
                      {allTransactions.map((txn) => (
                        <tr key={txn.id}>
                          <td>{txn.email}</td>
                          <td>{txn.type}</td>
                          <td>{txn.amount} RWF</td>
                          <td>{txn.txn_id}</td>
                          <td>{new Date(txn.created_at).toLocaleString()}</td>
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
              {news.length === 0 ? (
                <p className="text-center">No news posted yet</p>
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
                      {news.map((item) => (
                        <tr key={item.id}>
                          <td>{item.title}</td>
                          <td>{new Date(item.created_at).toLocaleDateString()}</td>
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
            {pendingWithdrawals.length === 0 ? (
              <p className="text-center">No pending withdrawals</p>
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
                    {pendingWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id}>
                        <td>{withdrawal.email}</td>
                        <td>{withdrawal.stake_amount} RWF</td>
                        <td>{withdrawal.stake_period} days</td>
                        <td>{withdrawal.amount} RWF</td>
                        <td>{new Date(withdrawal.request_date).toLocaleString()}</td>
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
          <div className="dashboard-card">
            <h3>Company Assets</h3>
            {companyAssets ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Total Approved Transactions</td>
                      <td>{companyAssets.totalTransactions} RWF</td>
                    </tr>
                    <tr>
                      <td>Total Stakes</td>
                      <td>{companyAssets.totalStakes} RWF</td>
                    </tr>
                    <tr>
                      <td>Total Withdrawals</td>
                      <td>{companyAssets.totalWithdrawals} RWF</td>
                    </tr>
                    <tr>
                      <td>Total Bonuses</td>
                      <td>{companyAssets.totalBonuses} RWF</td>
                    </tr>
                    <tr>
                      <td>Total Users</td>
                      <td>{companyAssets.totalUsers}</td>
                    </tr>
                    <tr>
                      <td>Approved Users</td>
                      <td>{companyAssets.approvedUsers}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center">Loading company assets...</p>
            )}
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
                          <td>{new Date(txn.created_at).toLocaleString()}</td>
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
                          <td>{new Date(stake.start_date).toLocaleDateString()}</td>
                          <td>{new Date(stake.end_date).toLocaleDateString()}</td>
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
                          <td>{new Date(withdrawal.request_date).toLocaleString()}</td>
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
                          <td>{new Date(bonus.created_at).toLocaleString()}</td>
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
