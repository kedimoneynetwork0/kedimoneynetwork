import axios from 'axios';

// Create an axios instance with no base URL
// In our new deployment, API is on the same domain as the frontend
const api = axios.create();

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to get full URL for media files
export const getFullUrl = (path) => {
  if (!path) return '';
  // If path is already a full URL, return it as is
  if (path.startsWith('http')) {
    return path;
  }
  // In our new deployment, API is on the same domain as the frontend
  // Just return the path as is for relative URLs
  const fullPath = path.startsWith('/') ? path : '/' + path;
  // Decode URI components to handle encoded characters like %20
  return decodeURIComponent(fullPath);
};

// Auth APIs
export const signup = (userData) => api.post('/api/auth/signup', userData);
export const login = (credentials) => api.post('/api/auth/login', credentials);
export const adminLogin = (credentials) => api.post('/api/auth/admin-login', credentials);

// User APIs
export const getUserBonus = () => api.get('/api/user/bonus');
export const getUserDashboard = () => api.get('/api/user/dashboard');
export const getUserProfile = () => api.get('/api/user/profile');
export const createTransaction = (transactionData) => api.post('/api/transactions', transactionData);
export const changePassword = (passwordData) => api.post('/api/user/change-password', passwordData);
export const requestPasswordReset = (emailData) => api.post('/api/user/request-password-reset', emailData);
export const uploadProfilePicture = (formData) => api.post('/api/user/upload-profile-picture', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
// User Stake and Withdrawal APIs
export const createStake = (stakeData) => api.post('/api/user/stakes', stakeData);
export const getUserStakes = () => api.get('/api/user/stakes');
export const requestWithdrawal = (withdrawalData) => api.post('/api/user/withdrawals', withdrawalData);
export const getUserWithdrawals = () => api.get('/api/user/withdrawals');

// Admin Withdrawal APIs
export const getPendingWithdrawals = () => api.get('/api/admin/withdrawals/pending');
export const approveWithdrawal = (id, approveData) => api.put(`/api/admin/withdrawals/${id}/approve`, approveData);
export const getCompanyAssets = () => api.get('/api/admin/company-assets');

// News APIs
export const getNews = () => api.get('/api/news');

// Message APIs
export const getUserMessages = () => api.get('/api/user/messages');
export const markMessageAsRead = (id) => api.put(`/api/user/messages/${id}/read`);
export const sendMessageToUser = (messageData) => api.post('/api/admin/messages', messageData);
export const getUserMessagesAdmin = (id) => api.get(`/api/admin/users/${id}/messages`);

// Admin APIs
export const getPendingUsers = () => api.get('/api/admin/pending-users');
export const getPendingTransactions = () => api.get('/api/admin/pending-transactions');
export const createNews = (newsData) => api.post('/api/admin/news', newsData);
export const updateNews = (id, newsData) => api.put(`/api/admin/news/${id}`, newsData);
export const deleteNews = (id) => api.delete(`/api/admin/news/${id}`);
export const getAllUsers = () => api.get('/api/admin/users');
export const getUserTransactions = (id) => api.get(`/api/admin/users/${id}/transactions`);
export const getAllTransactions = () => api.get('/api/admin/transactions');
export const approveUser = (id, approveData) => api.put(`/api/admin/users/${id}/approve`, { approve: approveData });
export const approveTransaction = (id, approveData) => api.put(`/api/admin/transactions/${id}/approve`, { approve: approveData });
export const getUserDetails = (id) => api.get(`/api/admin/users/${id}/details`);