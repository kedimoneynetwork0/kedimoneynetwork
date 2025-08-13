import axios from 'axios';

// Get the API base URL from environment variables or use a default
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// News APIs
export const getNews = () => api.get('/api/news');

// Admin APIs
export const getPendingUsers = () => api.get('/api/admin/pending-users');
export const getPendingTransactions = () => api.get('/api/admin/pending-transactions');
export const createNews = (newsData) => api.post('/api/admin/news', newsData);
export const updateNews = (id, newsData) => api.put(`/api/admin/news/${id}`, newsData);
export const deleteNews = (id) => api.delete(`/api/admin/news/${id}`);
export const getAllUsers = () => api.get('/api/admin/users');
export const getUserTransactions = (id) => api.get(`/api/admin/users/${id}/transactions`);
export const getAllTransactions = () => api.get('/api/admin/transactions');
export const approveUser = (id, approveData) => api.put(`/api/admin/users/${id}/approve`, approveData);
export const approveTransaction = (id, approveData) => api.put(`/api/admin/transactions/${id}/approve`, approveData);