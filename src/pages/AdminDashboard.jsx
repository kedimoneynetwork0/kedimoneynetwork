import React, { useEffect, useState } from 'react';
import { getPendingUsers, getPendingTransactions, getAllUsers, getAllTransactions, approveUser, approveTransaction, createNews, getNews, getFullUrl, getPendingWithdrawals, approveWithdrawal, getCompanyAssets } from '../api';
import Header from '../components/Header';

export default function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingTxns, setPendingTxns] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [news, setNews] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [companyAssets, setCompanyAssets] = useState(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'history', 'news', 'withdrawals', or 'assets'
  
  // News form state
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsMedia, setNewsMedia] = useState(null);

  const fetchAllAdminData = async () => {
    try {
      const [
        pendingUsersRes,
        pendingTxnsRes,
        allUsersRes,
        allTxnsRes,
        newsRes,
        pendingWithdrawalsRes,
        companyAssetsRes,
      ] = await Promise.all([
        getPendingUsers(),
        getPendingTransactions(),
        getAllUsers(),
        getAllTransactions(),
        getNews(),
        getPendingWithdrawals(),
        getCompanyAssets(),
      ]);

      setPendingUsers(Array.isArray(pendingUsersRes.data) ? pendingUsersRes.data : []);
      setPendingTxns(Array.isArray(pendingTxnsRes.data) ? pendingTxnsRes.data : []);
      setAllUsers(Array.isArray(allUsersRes.data) ? allUsersRes.data : []);
      setAllTransactions(Array.isArray(allTxnsRes.data) ? allTxnsRes.data : []);
      setNews(Array.isArray(newsRes.data) ? newsRes.data : []);
      setPendingWithdrawals(Array.isArray(pendingWithdrawalsRes.data?.withdrawals) ? pendingWithdrawalsRes.data.withdrawals : []);
      setCompanyAssets(companyAssetsRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      setMessage('Could not load all admin data. Please try refreshing.');
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const handleApproveUser = async (id, approve) => {
    try {
      await approveUser(id, approve);
      setMessage(`User ${approve ? 'approved' : 'rejected'}`);
      await fetchAllAdminData(); // Refresh all data for consistency
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating user status');
    }
  };

  const handleApproveTxn = async (id, approve) => {
    try {
      await approveTransaction(id, approve);
      setMessage(`Transaction ${approve ? 'approved' : 'rejected'}`);
      await fetchAllAdminData(); // Refresh all data for consistency
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating transaction status');
    }
  };

  const handleApproveWithdrawal = async (id, approve) => {
    try {
      await approveWithdrawal(id, approve);
      setMessage(`Withdrawal ${approve ? 'approved' : 'rejected'}`);
      await fetchAllAdminData(); // Refresh all data for consistency
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating withdrawal status');
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
      
      await createNews(formData);
      setMessage('News created successfully');
      setNewsTitle('');
      setNewsContent('');
      setNewsMedia(null);
      await fetchAllAdminData(); // Refresh all data for consistency
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating news');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/admin-login';
  };

  return (
    <div>
      <Header />
      <div className="container">
        <h2>Admin Dashboard</h2>

        {message && (
          <div className={`message ${message.includes('Error') || message.includes('error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
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
        </div>

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
                          <td>{user.firstname} {user.lastname}</td>
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
              <h3>Create News</h3>
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
                </div>
                <button type="submit" className="action-button">
                  Post News
                </button>
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

        <div className="text-center">
          <button
            onClick={handleLogout}
            className="danger"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
