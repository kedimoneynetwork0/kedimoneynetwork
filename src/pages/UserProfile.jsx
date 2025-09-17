import React, { useEffect, useState } from 'react';
import { getUserProfile, changePassword, requestPasswordReset, uploadProfilePicture, getFullUrl } from '../api';
import Header from '../components/Header';
import BackArrow from '../components/BackArrow';
import { FaUser, FaPhone, FaEnvelope, FaIdCard, FaKey, FaCamera, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    username: ''
  });

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

  const handleEditProfile = () => {
    setEditForm({
      firstname: profile.firstname || '',
      lastname: profile.lastname || '',
      phone: profile.phone || '',
      username: profile.username || ''
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      firstname: '',
      lastname: '',
      phone: '',
      username: ''
    });
  };

  const handleSaveProfile = async () => {
    // Note: This would require a backend endpoint to update profile information
    // For now, we'll just show a message
    setMessage('Profile update functionality would require backend implementation');
    setIsEditing(false);
  };

  return (
    <div>
      <Header />
      <BackArrow />
      <div className="container">
        <h2>Your Profile</h2>
        
        <div className="dashboard-card" style={{ position: 'relative' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <h3 style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <FaUser style={{ color: '#007bff' }} />
               Profile Information
             </h3>
             {!isEditing ? (
               <button
                 onClick={handleEditProfile}
                 style={{
                   background: '#28a745',
                   color: 'white',
                   border: 'none',
                   borderRadius: '6px',
                   padding: '8px 16px',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '5px',
                   fontSize: '14px'
                 }}
               >
                 <FaEdit /> Edit Profile
               </button>
             ) : (
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button
                   onClick={handleSaveProfile}
                   style={{
                     background: '#007bff',
                     color: 'white',
                     border: 'none',
                     borderRadius: '6px',
                     padding: '8px 16px',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '5px',
                     fontSize: '14px'
                   }}
                 >
                   <FaSave /> Save
                 </button>
                 <button
                   onClick={handleCancelEdit}
                   style={{
                     background: '#6c757d',
                     color: 'white',
                     border: 'none',
                     borderRadius: '6px',
                     padding: '8px 16px',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '5px',
                     fontSize: '14px'
                   }}
                 >
                   <FaTimes /> Cancel
                 </button>
               </div>
             )}
           </div>

           {/* Profile Picture Section */}
           <div className="profile-picture-section" style={{
             textAlign: 'center',
             marginBottom: '30px',
             position: 'relative'
           }}>
             <div style={{
               position: 'relative',
               display: 'inline-block',
               marginBottom: '20px'
             }}>
               {profile.profilePicture ? (
                 <img
                   src={getFullUrl(profile.profilePicture)}
                   alt="Profile"
                   style={{
                     width: '120px',
                     height: '120px',
                     borderRadius: '50%',
                     objectFit: 'cover',
                     border: '4px solid #007bff',
                     boxShadow: '0 4px 15px rgba(0,123,255,0.2)'
                   }}
                 />
               ) : (
                 <div
                   style={{
                     width: '120px',
                     height: '120px',
                     borderRadius: '50%',
                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     margin: '0 auto',
                     border: '4px solid #007bff',
                     boxShadow: '0 4px 15px rgba(0,123,255,0.2)'
                   }}
                 >
                   <span style={{ fontSize: '48px', color: 'white', fontWeight: 'bold' }}>
                     {profile.firstname?.charAt(0)?.toUpperCase() || '?'}
                   </span>
                 </div>
               )}

               {/* Upload overlay */}
               <div style={{
                 position: 'absolute',
                 bottom: '5px',
                 right: '5px',
                 background: '#28a745',
                 borderRadius: '50%',
                 width: '35px',
                 height: '35px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 cursor: 'pointer',
                 border: '2px solid white',
                 boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
               }}
               onClick={() => document.getElementById('profilePicture').click()}
               >
                 <FaCamera style={{ color: 'white', fontSize: '16px' }} />
               </div>
             </div>

             <form onSubmit={handleUploadProfilePicture} style={{ display: 'none' }}>
               <input
                 id="profilePicture"
                 type="file"
                 accept="image/*"
                 onChange={handleFileChange}
               />
             </form>

             {selectedFile && (
               <div style={{
                 background: '#e8f5e8',
                 border: '1px solid #c3e6c3',
                 borderRadius: '8px',
                 padding: '10px',
                 marginTop: '10px',
                 display: 'inline-block'
               }}>
                 <p style={{ margin: '0', color: '#28a745', fontSize: '14px' }}>
                   📸 {selectedFile.name}
                 </p>
                 <button
                   type="submit"
                   style={{
                     background: '#28a745',
                     color: 'white',
                     border: 'none',
                     borderRadius: '4px',
                     padding: '5px 10px',
                     fontSize: '12px',
                     cursor: 'pointer',
                     marginTop: '5px'
                   }}
                 >
                   Upload Picture
                 </button>
               </div>
             )}
           </div>

           {/* Profile Information Grid */}
           <div style={{
             display: 'grid',
             gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
             gap: '20px'
           }}>
             {/* Personal Information */}
             <div style={{
               background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
               borderRadius: '12px',
               padding: '20px',
               border: '1px solid #dee2e6'
             }}>
               <h4 style={{
                 margin: '0 0 15px 0',
                 color: '#495057',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px'
               }}>
                 <FaUser style={{ color: '#007bff' }} />
                 Personal Information
               </h4>

               <div style={{ display: 'grid', gap: '15px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <FaUser style={{ color: '#6c757d', width: '16px' }} />
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>First Name</label>
                     {isEditing ? (
                       <input
                         type="text"
                         value={editForm.firstname}
                         onChange={(e) => setEditForm({...editForm, firstname: e.target.value})}
                         style={{
                           width: '100%',
                           padding: '8px',
                           border: '1px solid #ddd',
                           borderRadius: '4px',
                           fontSize: '14px'
                         }}
                       />
                     ) : (
                       <p style={{ margin: '2px 0', fontWeight: '600', color: '#333' }}>{profile.firstname}</p>
                     )}
                   </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <FaUser style={{ color: '#6c757d', width: '16px' }} />
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>Last Name</label>
                     {isEditing ? (
                       <input
                         type="text"
                         value={editForm.lastname}
                         onChange={(e) => setEditForm({...editForm, lastname: e.target.value})}
                         style={{
                           width: '100%',
                           padding: '8px',
                           border: '1px solid #ddd',
                           borderRadius: '4px',
                           fontSize: '14px'
                         }}
                       />
                     ) : (
                       <p style={{ margin: '2px 0', fontWeight: '600', color: '#333' }}>{profile.lastname}</p>
                     )}
                   </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <FaPhone style={{ color: '#6c757d', width: '16px' }} />
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>Phone</label>
                     {isEditing ? (
                       <input
                         type="tel"
                         value={editForm.phone}
                         onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                         style={{
                           width: '100%',
                           padding: '8px',
                           border: '1px solid #ddd',
                           borderRadius: '4px',
                           fontSize: '14px'
                         }}
                       />
                     ) : (
                       <p style={{ margin: '2px 0', fontWeight: '600', color: '#333' }}>{profile.phone}</p>
                     )}
                   </div>
                 </div>
               </div>
             </div>

             {/* Account Information */}
             <div style={{
               background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
               borderRadius: '12px',
               padding: '20px',
               border: '1px solid #dee2e6'
             }}>
               <h4 style={{
                 margin: '0 0 15px 0',
                 color: '#495057',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px'
               }}>
                 <FaKey style={{ color: '#007bff' }} />
                 Account Information
               </h4>

               <div style={{ display: 'grid', gap: '15px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <FaEnvelope style={{ color: '#6c757d', width: '16px' }} />
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>Email</label>
                     <p style={{ margin: '2px 0', fontWeight: '600', color: '#333' }}>{profile.email}</p>
                   </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <FaUser style={{ color: '#6c757d', width: '16px' }} />
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>Username</label>
                     {isEditing ? (
                       <input
                         type="text"
                         value={editForm.username}
                         onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                         style={{
                           width: '100%',
                           padding: '8px',
                           border: '1px solid #ddd',
                           borderRadius: '4px',
                           fontSize: '14px'
                         }}
                       />
                     ) : (
                       <p style={{ margin: '2px 0', fontWeight: '600', color: '#333' }}>{profile.username}</p>
                     )}
                   </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <FaIdCard style={{ color: '#6c757d', width: '16px' }} />
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>ID/Passport Number</label>
                     <p style={{ margin: '2px 0', fontWeight: '600', color: '#333' }}>{profile.idNumber}</p>
                   </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <FaUser style={{ color: '#6c757d', width: '16px' }} />
                   <div style={{ flex: 1 }}>
                     <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>Referral ID</label>
                     <p style={{ margin: '2px 0', fontWeight: '600', color: '#333' }}>{profile.referralId || 'N/A'}</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>

        <div className="dashboard-card">
           <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
             <FaKey style={{ color: '#007bff' }} />
             Security Settings
           </h3>

           <div style={{
             background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
             borderRadius: '12px',
             padding: '20px',
             border: '1px solid #ffeaa7',
             marginBottom: '20px'
           }}>
             <h4 style={{ margin: '0 0 15px 0', color: '#856404', display: 'flex', alignItems: 'center', gap: '8px' }}>
               🔐 Change Password
             </h4>
             <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: '15px' }}>
               <div>
                 <label htmlFor="oldPassword" style={{
                   display: 'block',
                   marginBottom: '5px',
                   fontWeight: '600',
                   color: '#495057',
                   fontSize: '14px'
                 }}>
                   Current Password
                 </label>
                 <input
                   id="oldPassword"
                   type="password"
                   placeholder="Enter your current password"
                   value={oldPassword}
                   onChange={(e) => setOldPassword(e.target.value)}
                   style={{
                     width: '100%',
                     padding: '12px',
                     border: '2px solid #ddd',
                     borderRadius: '8px',
                     fontSize: '16px',
                     transition: 'border-color 0.3s ease',
                     boxSizing: 'border-box'
                   }}
                   onFocus={(e) => e.target.style.borderColor = '#007bff'}
                   onBlur={(e) => e.target.style.borderColor = '#ddd'}
                   required
                 />
               </div>

               <div>
                 <label htmlFor="newPassword" style={{
                   display: 'block',
                   marginBottom: '5px',
                   fontWeight: '600',
                   color: '#495057',
                   fontSize: '14px'
                 }}>
                   New Password
                 </label>
                 <input
                   id="newPassword"
                   type="password"
                   placeholder="Enter your new password"
                   value={newPassword}
                   onChange={(e) => setNewPassword(e.target.value)}
                   style={{
                     width: '100%',
                     padding: '12px',
                     border: '2px solid #ddd',
                     borderRadius: '8px',
                     fontSize: '16px',
                     transition: 'border-color 0.3s ease',
                     boxSizing: 'border-box'
                   }}
                   onFocus={(e) => e.target.style.borderColor = '#007bff'}
                   onBlur={(e) => e.target.style.borderColor = '#ddd'}
                   required
                 />
                 <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                   Password must be at least 8 characters with numbers and special characters
                 </small>
               </div>

               <button
                 type="submit"
                 style={{
                   background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                   color: 'white',
                   border: 'none',
                   borderRadius: '8px',
                   padding: '12px 24px',
                   fontSize: '16px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                   boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                 }}
                 onMouseOver={(e) => {
                   e.target.style.transform = 'translateY(-2px)';
                   e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                 }}
                 onMouseOut={(e) => {
                   e.target.style.transform = 'translateY(0)';
                   e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                 }}
               >
                 🔒 Update Password
               </button>
             </form>
           </div>

           {/* Password Reset Option */}
           <div style={{
             background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)',
             borderRadius: '12px',
             padding: '20px',
             border: '1px solid #bee5eb'
           }}>
             <h4 style={{ margin: '0 0 15px 0', color: '#0c5460', display: 'flex', alignItems: 'center', gap: '8px' }}>
               🔑 Forgot Password?
             </h4>
             <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px' }}>
               If you've forgotten your password, you can request a password reset from an administrator.
             </p>
             <button
               onClick={handleForgotPassword}
               style={{
                 background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                 color: 'white',
                 border: 'none',
                 borderRadius: '8px',
                 padding: '10px 20px',
                 fontSize: '14px',
                 fontWeight: '600',
                 cursor: 'pointer',
                 transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                 boxShadow: '0 4px 15px rgba(23, 162, 184, 0.3)'
               }}
               onMouseOver={(e) => {
                 e.target.style.transform = 'translateY(-2px)';
                 e.target.style.boxShadow = '0 6px 20px rgba(23, 162, 184, 0.4)';
               }}
               onMouseOut={(e) => {
                 e.target.style.transform = 'translateY(0)';
                 e.target.style.boxShadow = '0 4px 15px rgba(23, 162, 184, 0.3)';
               }}
             >
               📧 Request Admin Reset
             </button>
           </div>
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
