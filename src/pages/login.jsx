import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return;
    }
    if (!passwordRegex.test(password)) {
      setError('Password does not meet complexity requirements');
      return;
    }

    try {
      const res = await axios.post('http://localhost:4000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      navigate(res.data.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div>
      <Header />
      <div className="container">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
          <h2 className="text-2xl font-bold mb-6 text-green-700">Login</h2>
          <div className="mb-4">
            <input 
              type="email" 
              placeholder="Email" 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input 
              type="password" 
              placeholder="Password" 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 transition"
          >
            Login
          </button>
          <div className="forgot-password-link mt-4 text-center">
            <a href="/forgot-password" className="text-green-700 hover:text-green-800">Forgot Password?</a>
          </div>
          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
