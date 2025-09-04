import React, { useEffect, useState } from 'react';
import Button from '../components/Button';
import { getUserBonus, getUserDashboard, getUserProfile, createTransaction, createStake, getUserStakes, requestWithdrawal, getUserWithdrawals, getFullUrl, getUserMessages, markMessageAsRead } from '../api';
import Header from '../components/Header';
import { FaInbox } from 'react-icons/fa';

export default function UserDashboard() {
  const [bonus, setBonus] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stakes, setStakes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [type, setType] = useState('tree_plan');
  const [amount, setAmount] = useState('');
  const [txnId, setTxnId] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakePeriod, setStakePeriod] = useState(30);
  const [withdrawalStakeId, setWithdrawalStakeId] = useState('');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({});
  const [messages, setMessages] = useState([]);
  const [showInbox, setShowInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchBonus() {
      try {
        const response = await getUserBonus();
        setBonus(response.data?.totalBonus || 0);
      } catch (error) {
        console.error(error);
      }
    }

    async function fetchTransactions() {
      try {
        const response = await getUserDashboard();
        setTransactions(Array.isArray(response.data?.transactions) ? response.data.transactions : []);
      } catch (error) {
        console.error(error);
        setTransactions([]);
      }
    }

    async function fetchProfile() {
      try {
        const response = await getUserProfile();
        setProfile(response.data || {});
      } catch (err) {
        console.error(err);
        setProfile({});
      }
    }

    async function fetchStakes() {
      try {
        const response = await getUserStakes();
        setStakes(Array.isArray(response.data?.stakes) ? response.data.stakes : []);
      } catch (error) {
        console.error(error);
        setStakes([]);
      }
    }

    async function fetchWithdrawals() {
      try {
        const response = await getUserWithdrawals();
        setWithdrawals(Array.isArray(response.data?.withdrawals) ? response.data.withdrawals : []);
      } catch (error) {
        console.error(error);
        setWithdrawals([]);
      }
    }

    async function fetchMessages() {
      try {
        const response = await getUserMessages();
        const userMessages = Array.isArray(response.data?.messages) ? response.data.messages : [];
        setMessages(userMessages);
        setUnreadCount(userMessages.filter(msg => !msg.is_read).length);
      } catch (error) {
        console.error(error);
        setMessages([]);
        setUnreadCount(0);
      }
    }

    fetchBonus();
    fetchTransactions();
    fetchProfile();
    fetchStakes();
    fetchWithdrawals();
    fetchMessages();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !txnId) {
      setMessage('Please enter amount and transaction ID');
      return;
    }
    try {
      await createTransaction({ type, amount: parseFloat(amount), txn_id: txnId });
      setMessage('Transaction submitted for approval');
      setAmount('');
      setTxnId('');
      
      // Refresh transactions after submitting
      const response = await getUserDashboard();
      setTransactions(Array.isArray(response.data?.transactions) ? response.data.transactions : []);
    } catch (error) {
      setMessage(error.message || 'Error submitting transaction');
    }
  };

  const handleStakeSubmit = async (e) => {
    e.preventDefault();
    if (!stakeAmount) {
      setMessage('Please enter stake amount');
      return;
    }
    try {
      await createStake({ amount: parseFloat(stakeAmount), stakePeriod: parseInt(stakePeriod) });
      setMessage('Stake deposit created successfully');
      setStakeAmount('');
      
      // Refresh stakes after submitting
      const response = await getUserStakes();
      setStakes(Array.isArray(response.data?.stakes) ? response.data.stakes : []);
    } catch (error) {
      setMessage(error.message || 'Error creating stake deposit');
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawalStakeId) {
      setMessage('Please select a stake to withdraw');
      return;
    }
    try {
      await requestWithdrawal({ stakeId: parseInt(withdrawalStakeId) });
      setMessage('Withdrawal request submitted successfully');
      setWithdrawalStakeId('');
      
      // Refresh withdrawals after submitting
      const response = await getUserWithdrawals();
      setWithdrawals(Array.isArray(response.data?.withdrawals) ? response.data.withdrawals : []);
      
      // Refresh stakes as well
      const stakesResponse = await getUserStakes();
      setStakes(Array.isArray(stakesResponse.data?.stakes) ? stakesResponse.data.stakes : []);
    } catch (error) {
      setMessage(error.message || 'Error requesting withdrawal');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // Calculate estimated balance (from database + bonus + active stakes)
  const calculateEstimatedBalance = () => {
    let balance = profile.estimated_balance || 0;

    // Add referral bonus
    balance += bonus;

    // Add principal amount of active stakes
    stakes.forEach(stake => {
      if (stake.status === 'active') {
        balance += stake.amount;
      }
    });

    return balance;
  };

  // Filter stakes that can be withdrawn (matured and not yet withdrawn)
  const withdrawableStakes = stakes.filter(stake => {
    const currentDate = new Date();
    const endDate = new Date(stake.end_date);
    return currentDate >= endDate && stake.status === 'active';
  });

  return (
    <div>
      <Header />
      <div className="container">
        <div className="dashboard-welcome" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {profile.profilePicture ? (
              <img
                src={getFullUrl(profile.profilePicture)}
                alt="Profile"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginRight: '15px',
                  border: '2px solid #007bff'
                }}
              />
            ) : (
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#e9ecef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '15px',
                  border: '2px solid #007bff'
                }}
              >
                <span style={{ fontSize: '24px', color: '#6c757d' }}>
                  {profile.firstname?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <h2 style={{ margin: '0' }}>Welcome back, {profile.firstname}!</h2>
              <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>{profile.email}</p>
            </div>
          </div>
          <div className="inbox-container" style={{ position: 'relative' }}>
            <button
              onClick={() => setShowInbox(!showInbox)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: '#28a745',
                position: 'relative'
              }}
            >
              <FaInbox />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Estimated Balance</h3>
            <div className="bonus-display">
              <p className="bonus-amount">{calculateEstimatedBalance()} RWF</p>
              <p className="bonus-text">Total estimated balance</p>
            </div>
          </div>
          
          <div className="dashboard-card">
            <h3>Referral Bonus</h3>
            <div className="bonus-display">
              <p className="bonus-amount">{bonus} RWF</p>
              <p className="bonus-text">Total referral bonus earned</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Make Transaction</h3>
            <form onSubmit={handleSubmit} className="form-group">
              <div className="form-group">
                <label htmlFor="type">Transaction Type</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="tree_plan">Tree Plan</option>
                  <option value="loan">Loan</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="amount">Amount (RWF)</label>
                <input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="txnId">Transaction ID</label>
                <input
                  id="txnId"
                  type="text"
                  placeholder="Enter transaction ID"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit">Submit Transaction</Button>
            </form>
          </div>
          
          <div className="dashboard-card">
            <h3>Deposit Stake</h3>
            <form onSubmit={handleStakeSubmit} className="form-group">
              <div className="form-group">
                <label htmlFor="stakeAmount">Amount (RWF)</label>
                <input
                  id="stakeAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="stakePeriod">Stake Period</label>
                <select
                  id="stakePeriod"
                  value={stakePeriod}
                  onChange={(e) => setStakePeriod(e.target.value)}
                >
                  <option value="30">30 Days (5% interest)</option>
                  <option value="90">90 Days (15% interest)</option>
                  <option value="180">180 Days (30% interest)</option>
                </select>
              </div>
              
              <Button type="submit">Deposit Stake</Button>
            </form>
          </div>
        </div>
        
        {message && (
          <div className={`message ${message.includes('Error') || message.includes('error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Your Stakes</h3>
            {stakes.length === 0 ? (
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
                    {stakes.map((stake) => (
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
          
          <div className="dashboard-card">
            <h3>Request Withdrawal</h3>
            {withdrawableStakes.length === 0 ? (
              <p className="text-center">No stakes available for withdrawal</p>
            ) : (
              <form onSubmit={handleWithdrawalSubmit} className="form-group">
                <div className="form-group">
                  <label htmlFor="withdrawalStakeId">Select Stake</label>
                  <select
                    id="withdrawalStakeId"
                    value={withdrawalStakeId}
                    onChange={(e) => setWithdrawalStakeId(e.target.value)}
                    required
                  >
                    <option value="">Select a stake</option>
                    {withdrawableStakes.map((stake) => (
                      <option key={stake.id} value={stake.id}>
                        {stake.amount} RWF - {stake.stake_period} days (Ends {new Date(stake.end_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
                
                <Button type="submit">Request Withdrawal</Button>
              </form>
            )}
            
            <h3>Your Withdrawals</h3>
            {withdrawals.length === 0 ? (
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
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id}>
                        <td>{withdrawal.amount} RWF</td>
                        <td>{new Date(withdrawal.request_date).toLocaleDateString()}</td>
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
        </div>
        
        <div className="dashboard-card">
          <h3>Your Transactions</h3>
          {transactions.length === 0 ? (
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
                  {transactions.map((txn) => (
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
                            From: {msg.admin_firstname} {msg.admin_lastname} • {new Date(msg.created_at).toLocaleString()}
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
