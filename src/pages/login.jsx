import React, { useState } from 'react';
import { login } from '../api'; // Use the API module instead of direct axios
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const res = await login({ email, password }); // Use the API module function
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);

      // Redirect to enhanced dashboards with database calculations
      if (res.data.role === 'admin') {
        navigate('/kedi-admin-dashboard'); // Enhanced admin dashboard with revenue analytics
      } else {
        navigate('/kedi-user-dashboard'); // Enhanced user dashboard with real-time calculations
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="relative">
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
          <div className="mb-4 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 transition"
          >
            Login
          </button>
          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </form>
      </div>
      <img
        src="/uploads/1756994307932-KEDI Money Network Logo (3).png"
        alt="Watermark"
        className="absolute bottom-4 right-4 w-32 h-32 opacity-20 pointer-events-none"
      />
    </div>
  );
}
