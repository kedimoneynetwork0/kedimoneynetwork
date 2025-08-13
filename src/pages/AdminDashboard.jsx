import React, { useEffect, useState } from 'react';
import { getPendingUsers, getPendingTransactions, getAllUsers, getAllTransactions, approveUser, approveTransaction, createNews, getNews, getFullUrl } from '../api';
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
