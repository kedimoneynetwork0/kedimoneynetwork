import React, { useEffect, useState } from 'react';
import Button from '../components/Button';
import { getUserBonus, getUserDashboard, getUserProfile, createTransaction, createStake, getUserStakes, requestWithdrawal, getUserWithdrawals } from '../api';
import Header from '../components/Header';

export default function UserDashboard() {
  const [bonus, setBonus] = useState(0);
  const [loading, setLoading] = useState(true);
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

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel for a faster load time
      const [
        bonusRes,
        dashboardRes,
        profileRes,
        stakesRes,
        withdrawalsRes,
      ] = await Promise.all([
        getUserBonus(),
        getUserDashboard(),
        getUserProfile(),
        getUserStakes(),
        getUserWithdrawals(),
      ]);

      setBonus(bonusRes.data?.totalBonus || 0);
      setTransactions(Array.isArray(dashboardRes.data?.transactions) ? dashboardRes.data.transactions : []);
      setProfile(profileRes.data || {});
      setStakes(Array.isArray(stakesRes.data?.stakes) ? stakesRes.data.stakes : []);
      setWithdrawals(Array.isArray(withdrawalsRes.data?.withdrawals) ? withdrawalsRes.data.withdrawals : []);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setMessage('Could not load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
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
      await fetchAllData(); // Refresh all dashboard data
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error submitting transaction');
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
      await fetchAllData(); // Refresh all dashboard data
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating stake deposit');
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
      await fetchAllData(); // Refresh all dashboard data
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error requesting withdrawal');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // Calculate estimated balance (bonus + active stakes)
  const calculateEstimatedBalance = () => {
    let balance = bonus;
    
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

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container"><h2>Loading Dashboard...</h2></div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container">
        <h2>User Dashboard</h2>
        
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
