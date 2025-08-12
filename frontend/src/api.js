const API_BASE = 'http://localhost:4000/api';

// Helper function for authenticated requests
async function authenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // If we're sending FormData, don't set Content-Type header
  // Browser will set it with the correct boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  } else {
    headers['Content-Type'] = 'application/json';
  }
  
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }
  
  return res.json();
}

export async function signup(data) {
  return authenticatedRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(data) {
  return authenticatedRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminLogin(data) {
  return authenticatedRequest('/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// User functions
export async function getUserBonus() {
  return authenticatedRequest('/user/bonus');
}

export async function getUserDashboard() {
  return authenticatedRequest('/user/dashboard');
}

export async function getUserProfile() {
  return authenticatedRequest('/user/profile');
}

export async function createTransaction(data) {
  return authenticatedRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function changePassword(data) {
  return authenticatedRequest('/user/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function requestPasswordReset(data) {
  return authenticatedRequest('/user/request-password-reset', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// News functions
export async function getNews() {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}/news`, {
    headers,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }
  
  return res.json();
}

export async function createNews(data) {
  return authenticatedRequest('/admin/news', {
    method: 'POST',
    body: data, // FormData object
  });
}

export async function updateNews(id, data) {
  return authenticatedRequest(`/admin/news/${id}`, {
    method: 'PUT',
    body: data, // FormData object or JSON
  });
}

export async function deleteNews(id) {
  return authenticatedRequest(`/admin/news/${id}`, {
    method: 'DELETE',
  });
}

// Admin functions
export async function getPendingUsers() {
  return authenticatedRequest('/admin/pending-users');
}

export async function getPendingTransactions() {
  return authenticatedRequest('/admin/pending-transactions');
}

export async function getAllUsers() {
  return authenticatedRequest('/admin/users');
}

export async function getUserTransactions(userId) {
  return authenticatedRequest(`/admin/users/${userId}/transactions`);
}

export async function getAllTransactions() {
  return authenticatedRequest('/admin/transactions');
}

export async function approveUser(userId, approve) {
  return authenticatedRequest(`/admin/users/${userId}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ approve }),
  });
}

export async function approveTransaction(txnId, approve) {
  return authenticatedRequest(`/admin/transactions/${txnId}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ approve }),
  });
}
