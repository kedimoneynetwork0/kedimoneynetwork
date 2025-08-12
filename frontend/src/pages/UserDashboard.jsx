import React, { useEffect, useState } from 'react';
import Button from '../components/Button';
import { getUserBonus, getUserDashboard, getUserProfile, createTransaction } from '../Api';
import Header from '../components/Header';

export default function UserDashboard() {
  const [bonus, setBonus] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState('tree_plan');
  const [amount, setAmount] = useState('');
  const [txnId, setTxnId] = useState('');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({});

  useEffect(() => {
    async function fetchBonus() {
      try {
        const data = await getUserBonus();
        setBonus(data.totalBonus || 0);
      } catch (error) {
        console.error(error);
      }
    }

    async function fetchTransactions() {
      try {
        const data = await getUserDashboard();
        setTransactions(data.transactions);
      } catch (error) {
        console.error(error);
      }
    }

    async function fetchProfile() {
      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchBonus();
    fetchTransactions();
    fetchProfile();
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
      const data = await getUserDashboard();
      setTransactions(data.transactions);
    } catch (error) {
      setMessage(error.message || 'Error submitting transaction');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div>
      <Header />
      <div className="container">
        <h2>User Dashboard</h2>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Referral Bonus</h3>
            <div className="bonus-display">
              <p className="bonus-amount">{bonus} RWF</p>
              <p className="bonus-text">Total referral bonus earned</p>
            </div>
          </div>
          
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
        </div>
        
        {message && (
          <div className={`message ${message.includes('Error') || message.includes('error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <div className="dashboard-card">
          <h3>Your Transactions</h3>
          {transactions.length === 0 ? (
            <p className="text-center">No transactions found</p>
          ) : (
            <ul className="transaction-list">
              {transactions.map((txn) => (
                <li key={txn.id} className="transaction-item">
                  <div className="transaction-meta">
                    <span className={`status-badge status-${txn.status.toLowerCase()}`}>
                      {txn.status}
                    </span>
                    <span>{new Date(txn.created_at).toLocaleString()}</span>
                  </div>
                  <div className="transaction-details">
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
