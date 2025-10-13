import React, { useState } from 'react';
import { login } from '../api'; // Use the API module instead of direct axios
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const phoneRegex = /^\d{10}$/;
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!phoneRegex.test(phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    if (!passwordRegex.test(password)) {
      setError('Password does not meet complexity requirements');
      return;
    }

    try {
      const res = await login({ phone, password }); // Use the API module function
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
    <div className="relative min-h-screen bg-gray-50">
      <Header />
      <div className="pt-28 flex items-center justify-center">
        <div className="card max-w-md mx-auto">
          <div className="card-body">
            <h2 className="text-2xl font-bold mb-xl text-primary text-center">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-lg">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="Phone Number (10 digits)"
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="form-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-sm top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full"
              >
                Login
              </button>
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
