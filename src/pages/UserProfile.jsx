import React, { useEffect, useState } from 'react';
import { getUserProfile, changePassword, requestPasswordReset } from '../api';
import Header from '../components/Header';

export default function UserProfile() {
  const [profile, setProfile] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    username: '',
    referralId: '',
    idNumber: '',
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        // axios returns a response object, the data is in the .data property
        const response = await getUserProfile();
        setProfile(response.data || {});
      } catch (err) {
        setMessage(err.response?.data?.message || 'Failed to load profile');
      }
    }
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setMessage('Please fill both old and new password');
      return;
    }
    try {
      const response = await changePassword({ oldPassword, newPassword });
      setMessage(response.data.message);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error changing password');
    }
  };

  const handleForgotPassword = async () => {
    try {
      const response = await requestPasswordReset({ email: profile.email });
      setMessage(response.data.message);
    } catch (err) {
      setMessage('Failed to send password reset request');
    }
  };

  return (
    <div>
      <Header />
      <div className="container">
        <h2>Your Profile</h2>
        
        <div className="dashboard-card">
          <h3>Profile Information</h3>
          <div className="transaction-details">
            <div className="transaction-detail">
              <span className="detail-label">First Name</span>
              <span className="detail-value">{profile.firstname}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Last Name</span>
              <span className="detail-value">{profile.lastname}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{profile.phone}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Email</span>
              <span className="detail-value">{profile.email}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Username</span>
              <span className="detail-value">{profile.username}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Referral ID</span>
              <span className="detail-value">{profile.referralId || 'N/A'}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">ID/Passport Number</span>
              <span className="detail-value">{profile.idNumber}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Change Password</h3>
          <form onSubmit={handlePasswordChange} className="form-group">
            <div className="form-group">
              <label htmlFor="oldPassword">Old Password</label>
              <input
                id="oldPassword"
                type="password"
                placeholder="Enter old password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <button
              type="submit"
              className="action-button"
            >
              Update Password
            </button>
          </form>
        </div>

        <div className="text-center">
          <button
            onClick={handleForgotPassword}
            className="secondary"
          >
            Forgot Password? Request Admin Reset
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') || message.includes('error') || message.includes('Failed') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
