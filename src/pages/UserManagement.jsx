import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, getUserDetails, downloadUsersCSV } from '../api';
import Header from '../components/Header';
import './admin-dashboard.css';

export default function UserManagement() {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      setAllUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserDetails = async (user) => {
    try {
      const response = await getUserDetails(user.id);
      setSelectedUser(user);
      setUserDetails(response.data);
    } catch (error) {
      setMessage('Error loading user details: ' + error.message);
    }
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setUserDetails(null);
  };

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

  const filteredUsers = allUsers.filter(user =>
    (user.firstname + ' ' + user.lastname).toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        {showHeader && <Header />}
        <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showHeader && <Header />}
      <div className="main-content">
        <div className="container">
          {message && (
            <div className={`message ${message.includes('Error') || message.includes('error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Header Controls */}
          <div className="dashboard-controls" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search users by name, email, phone, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ width: '300px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <button
                onClick={() => setShowHeader(!showHeader)}
                className="action-button"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                {showHeader ? 'Hide Header' : 'Show Header'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDownloadUsers}
                className="action-button"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                📥 Download CSV
              </button>
              <Link
                to="/admin-dashboard"
                className="action-button secondary"
                style={{ padding: '8px 16px', fontSize: '14px', textDecoration: 'none' }}
              >
                Back to Admin Dashboard
              </Link>
            </div>
          </div>

          {/* User Details View */}
          {selectedUser && userDetails && (
            <div>
              <div className="dashboard-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>User Details: {userDetails.user.firstname} {userDetails.user.lastname}</h2>
                  <button onClick={handleBackToUsers} className="action-button secondary">
                    Back to All Users
                  </button>
                </div>

                {/* User Profile Picture */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  {userDetails.user.profilePicture ? (
                    <img
                      src={userDetails.user.profilePicture}
                      alt="Profile"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #007bff'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        backgroundColor: '#e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        border: '3px solid #007bff'
                      }}
                    >
                      <span style={{ fontSize: '48px', color: '#6c757d' }}>
                        {userDetails.user.firstname?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Registration Details */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ color: '#007bff', marginBottom: '15px' }}>📋 Registration Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
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
                      <span className="detail-label">ID/Passport Number</span>
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
                    <div className="transaction-detail">
                      <span className="detail-label">Registration Date</span>
                      <span className="detail-value">
                        {new Date(userDetails.user.created_at).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}
                      </span>
                    </div>
                    <div className="transaction-detail">
                      <span className="detail-label">Estimated Balance</span>
                      <span className="detail-value">{userDetails.user.estimated_balance || 0} RWF</span>
                    </div>
                    {userDetails.balanceCalculation && (
                      <div className="transaction-detail">
                        <span className="detail-label">Balance Breakdown</span>
                        <div className="detail-value" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <small>💰 Tree Plans: {userDetails.balanceCalculation.breakdown.treePlan} RWF</small>
                          <small>📈 Stake Revenue: {userDetails.balanceCalculation.breakdown.stakeRevenue} RWF</small>
                          <small>💸 Savings: {userDetails.balanceCalculation.breakdown.savings} RWF</small>
                          <small>🎁 Bonuses: {userDetails.balanceCalculation.breakdown.bonuses} RWF</small>
                          <small>➖ Loan Repayments: -{userDetails.balanceCalculation.breakdown.loanRepayments} RWF</small>
                          <small><strong>Total Credits: {userDetails.balanceCalculation.breakdown.totalCredits} RWF</strong></small>
                          <small><strong>Total Debits: {userDetails.balanceCalculation.breakdown.totalDebits} RWF</strong></small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Transaction History */}
              <div className="dashboard-card">
                <h3>💳 Transaction History ({userDetails.transactions.length})</h3>
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

              {/* User Stakes History */}
              <div className="dashboard-card">
                <h3>📈 Stakes History ({userDetails.stakes.length})</h3>
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

              {/* User Withdrawals History */}
              <div className="dashboard-card">
                <h3>💰 Withdrawals History ({userDetails.withdrawals.length})</h3>
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

              {/* User Bonuses History */}
              <div className="dashboard-card">
                <h3>🎁 Bonuses History ({userDetails.bonuses.length})</h3>
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

              {/* User Tree Plans History */}
              <div className="dashboard-card">
                <h3>🌳 Tree Plans ({userDetails.treePlans?.length || 0})</h3>
                {(!userDetails.treePlans || userDetails.treePlans.length === 0) ? (
                  <p className="text-center">No tree plans found</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Amount</th>
                          <th>Trees Planted</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetails.treePlans.map((plan) => (
                          <tr key={plan.id}>
                            <td>{plan.amount} RWF</td>
                            <td>{plan.trees_planted}</td>
                            <td>{plan.location || 'N/A'}</td>
                            <td>
                              <span className={`status-badge status-${plan.status}`}>
                                {plan.status}
                              </span>
                            </td>
                            <td>{new Date(plan.created_at).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* User Savings History */}
              <div className="dashboard-card">
                <h3>💰 Savings ({userDetails.savings?.length || 0})</h3>
                {(!userDetails.savings || userDetails.savings.length === 0) ? (
                  <p className="text-center">No savings found</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Amount</th>
                          <th>Interest Rate</th>
                          <th>Maturity Date</th>
                          <th>Status</th>
                          <th>Date Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetails.savings.map((saving) => (
                          <tr key={saving.id}>
                            <td>{saving.amount} RWF</td>
                            <td>{(saving.interest_rate * 100)}%</td>
                            <td>{new Date(saving.maturity_date).toLocaleDateString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                            <td>
                              <span className={`status-badge status-${saving.status}`}>
                                {saving.status}
                              </span>
                            </td>
                            <td>{new Date(saving.created_at).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* User Loan Repayments History */}
              <div className="dashboard-card">
                <h3>💳 Loan Repayments ({userDetails.loanRepayments?.length || 0})</h3>
                {(!userDetails.loanRepayments || userDetails.loanRepayments.length === 0) ? (
                  <p className="text-center">No loan repayments found</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Amount</th>
                          <th>Payment Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetails.loanRepayments.map((repayment) => (
                          <tr key={repayment.id}>
                            <td>{repayment.amount} RWF</td>
                            <td>{new Date(repayment.payment_date).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                            <td>
                              <span className={`status-badge status-${repayment.status}`}>
                                {repayment.status}
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

          {/* All Users List View */}
          {!selectedUser && (
            <div className="dashboard-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>All Users ({filteredUsers.length})</h2>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Total Registered: {allUsers.length}
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <p className="text-center">{searchTerm ? 'No matching users found' : 'No users found'}</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>ID Number</th>
                        <th>Status</th>
                        <th>Registration Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
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
                          <td>{user.phone}</td>
                          <td>{user.idNumber}</td>
                          <td>
                            <span className={`status-badge status-${user.status.toLowerCase()}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString('en-RW', { timeZone: 'Africa/Kigali' })}</td>
                          <td>
                            <button
                              onClick={() => handleViewUserDetails(user)}
                              className="action-button"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              View Details
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
        </div>
      </div>
    </div>
  );
}