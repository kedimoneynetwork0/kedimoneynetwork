import React, { useState } from 'react';
import { adminLogin } from '../api'; // Use the API module instead of direct axios
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function AdminLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters, include a number and a special character');
      return;
    }

    try {
      const res = await adminLogin({ phone, password }); // Use the API module function
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'admin');
      navigate('/kedi-admin-dashboard'); // Redirect to enhanced admin dashboard with revenue analytics
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div>
      <Header />
      <div className="flex items-center justify-center bg-white py-8">
        <form onSubmit={handleSubmit} className="max-w-md w-full p-6 bg-green-50 rounded shadow">
          <h2 className="text-2xl font-bold mb-6 text-green-700">Admin Login</h2>
          <input
            type="tel"
            placeholder="Phone Number (10 digits)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="mb-4 p-2 border border-gray-300 rounded w-full"
          />
          <div className="mb-4 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
