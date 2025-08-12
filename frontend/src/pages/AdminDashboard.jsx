import React, { useEffect, useState } from 'react';
import { getPendingUsers, getPendingTransactions, getAllUsers, getAllTransactions, approveUser, approveTransaction, createNews, getNews } from '../api';
import Header from '../components/Header';

export default function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingTxns, setPendingTxns] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [news, setNews] = useState([]);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'history', or 'news'
  
  // News form state
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsMedia, setNewsMedia] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
    fetchPendingTxns();
    fetchAllUsers();
    fetchAllTransactions();
    fetchNews();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const data = await getPendingUsers();
      setPendingUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPendingTxns = async () => {
    try {
      const data = await getPendingTransactions();
      setPendingTxns(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const data = await getAllUsers();
      setAllUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const data = await getAllTransactions();
      setAllTransactions(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchNews = async () => {
    try {
      const data = await getNews();
      setNews(data);
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
      fetchNews(); // Refresh news list
    } catch (error) {
      setMessage('Error creating news: ' + error.message);
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
        </div>

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Pending Users</h3>
              {pendingUsers.length === 0 ? (
                <p className="text-center">No pending users</p>
              ) : (
                <ul className="transaction-list">
                  {pendingUsers.map((user) => (
                    <li key={user.id} className="transaction-item">
                      <div className="transaction-details">
                        <div className="transaction-detail">
                          <span className="detail-label">Email</span>
                          <span className="detail-value">{user.email}</span>
                        </div>
                      </div>
                      <div className="action-buttons">
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
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="dashboard-card">
              <h3>Pending Transactions</h3>
              {pendingTxns.length === 0 ? (
                <p className="text-center">No pending transactions</p>
              ) : (
                <ul className="transaction-list">
                  {pendingTxns.map((txn) => (
                    <li key={txn.id} className="transaction-item">
                      <div className="transaction-meta">
                        <span className={`status-badge status-${txn.status.toLowerCase()}`}>
                          {txn.status}
                        </span>
                        <span>{new Date(txn.created_at).toLocaleString()}</span>
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-detail">
                          <span className="detail-label">User</span>
                          <span className="detail-value">{txn.email}</span>
                        </div>
                        <div className="transaction-detail">
                          <span className="detail-label">Type</span>
                          <span className="detail-value">{txn.type}</span>
                        </div>
                        <div className="transaction-detail">
                          <span className="detail-label">Amount</span>
                          <span className="detail-value">{txn.amount} RWF</span>
                        </div>
                        <div className="transaction-detail">
                          <span className="detail-label">Transaction ID</span>
                          <span className="detail-value">{txn.txn_id}</span>
                        </div>
                      </div>
                      <div className="action-buttons">
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
                      </div>
                    </li>
                  ))}
                </ul>
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
                <ul className="transaction-list">
                  {allUsers.map((user) => (
                    <li key={user.id} className="transaction-item">
                      <div className="transaction-details">
                        <div className="transaction-detail">
                          <span className="detail-label">Name</span>
                          <span className="detail-value">{user.firstname} {user.lastname}</span>
                        </div>
                        <div className="transaction-detail">
                          <span className="detail-label">Email</span>
                          <span className="detail-value">{user.email}</span>
                        </div>
                        <div className="transaction-detail">
                          <span className="detail-label">Username</span>
                          <span className="detail-value">{user.username}</span>
                        </div>
                        <div className="transaction-detail">
                          <span className="detail-label">Status</span>
                          <span className={`status-badge status-${user.status.toLowerCase()}`}>
                            {user.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="dashboard-card">
              <h3>All Transactions</h3>
              {allTransactions.length === 0 ? (
                <p className="text-center">No transactions found</p>
              ) : (
                <ul className="transaction-list">
                  {allTransactions.map((txn) => (
                    <li key={txn.id} className="transaction-item">
                      <div className="transaction-meta">
                        <span className={`status-badge status-${txn.status.toLowerCase()}`}>
                          {txn.status}
                        </span>
                        <span>{new Date(txn.created_at).toLocaleString()}</span>
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-detail">
                          <span className="detail-label">User</span>
                          <span className="detail-value">{txn.email}</span>
                        </div>
                        <div className="transaction-detail">
                          <span className="detail-label">Type</span>
                          <span className="detail-value">{txn.type}</span>
                        </div>
                        <div className="transaction-detail">
                          <span className="detail-label">Amount</span>
                          <span className="detail-value">{txn.amount} RWF</span>
                        </div>
                        <div className="transaction-detail">
                          <span className="detail-label">Transaction ID</span>
                          <span className="detail-value">{txn.txn_id}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
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
                <ul className="transaction-list">
                  {news.map((item) => (
                    <li key={item.id} className="transaction-item">
                      <h4>{item.title}</h4>
                      <p>{item.content}</p>
                      {item.media_url && item.media_type === 'image' && (
                        <img src={`http://localhost:4000${item.media_url}`} alt="News" className="news-media" />
                      )}
                      {item.media_url && item.media_type === 'video' && (
                        <video src={`http://localhost:4000${item.media_url}`} controls className="news-media" />
                      )}
                      {item.media_url && item.media_type === 'application' && (
                        <a href={`http://localhost:4000${item.media_url}`} target="_blank" rel="noopener noreferrer" className="news-media-link">
                          View PDF Document
                        </a>
                      )}
                      <p className="text-muted">{new Date(item.created_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
