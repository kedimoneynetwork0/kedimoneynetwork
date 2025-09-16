import React, { useEffect, useState } from 'react';
import { getUserProfile, changePassword, requestPasswordReset, uploadProfilePicture, getFullUrl } from '../api';
import Header from '../components/Header';
import BackArrow from '../components/BackArrow';

export default function UserProfile() {
  const [profile, setProfile] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    username: '',
    referralId: '',
    idNumber: '',
    profilePicture: '',
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await getUserProfile();
        // axios returns a response object, the data is in the .data property
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

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadProfilePicture = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      const response = await uploadProfilePicture(formData);
      setMessage(response.data.message);
      // Update profile with new picture
      setProfile(prev => ({ ...prev, profilePicture: response.data.profilePicture }));
      setSelectedFile(null);
      // Reset file input
      document.getElementById('profilePicture').value = '';
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to upload profile picture');
    }
  };

  return (
    <div>
      <Header />
      <BackArrow />
      <div className="container">
        <h2>Your Profile</h2>
        
        <div className="dashboard-card">
          <h3>Profile Information</h3>

          {/* Profile Picture Section */}
          <div className="profile-picture-section" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              {profile.profilePicture ? (
                <img
                  src={getFullUrl(profile.profilePicture)}
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
                    {profile.firstname?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleUploadProfilePicture} style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label htmlFor="profilePicture">Upload Profile Picture</label>
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ marginBottom: '10px' }}
                />
              </div>
              <button
                type="submit"
                className="action-button"
                disabled={!selectedFile}
              >
                Upload Picture
              </button>
            </form>
          </div>

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
