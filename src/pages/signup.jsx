import React, { useState } from 'react';
import { signup } from '../api'; // Use the API module instead of direct axios
import './signup.css';
import Header from '../components/Header';

export default function Signup() {
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    referralId: '',
    idNumber: '',
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedReferralId, setGeneratedReferralId] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');

    if (!phoneRegex.test(form.phone)) {
      setMessage('Phone number must be exactly 10 digits');
      return;
    }
    if (!emailRegex.test(form.email)) {
      setMessage('Invalid email format');
      return;
    }
    if (!passwordRegex.test(form.password)) {
      setMessage('Password must be at least 8 chars with a number and special char');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const res = await signup(form); // Use the API module function
      setMessage(res.data.message);
      if (res.data.referralId) {
        setGeneratedReferralId(res.data.referralId);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <Header />
      <div className="container py-3xl">
        <div className="card max-w-4xl mx-auto">
          <div className="card-body">
            <h2 className="text-3xl font-bold mb-xl text-primary text-center">Sign Up</h2>
            <form onSubmit={handleSubmit} className="space-y-lg">
              {/* Personal Information */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    name="firstname"
                    placeholder="First Name"
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    name="lastname"
                    placeholder="Last Name"
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    name="phone"
                    placeholder="Phone Number (10 digits)"
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Province</label>
                  <input
                    name="province"
                    placeholder="Province"
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">District</label>
                  <input
                    name="district"
                    placeholder="District"
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Sector</label>
                  <input
                    name="sector"
                    placeholder="Sector"
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cell</label>
                  <input
                    name="cell"
                    placeholder="Cell"
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Village</label>
                <input
                  name="village"
                  placeholder="Village"
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              {/* Account Information */}
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  name="username"
                  placeholder="Username"
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      onChange={handleChange}
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
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Referral ID (Optional)</label>
                  <input
                    name="referralId"
                    placeholder="Referral ID number"
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ID/Passport Number</label>
                  <input
                    name="idNumber"
                    placeholder="ID/Passport Number"
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
              >
                Sign Up
              </button>

              {message && (
                <div className={`alert ${message.toLowerCase().includes('success') ? 'alert-success' : 'alert-error'}`}>
                  <span>{message}</span>
                </div>
              )}

              {generatedReferralId && (
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-xl font-semibold text-primary mb-md">Your Referral ID</h3>
                    <p className="text-secondary mb-md">
                      Save this ID for future use. You can share it with others to earn referral bonuses.
                    </p>
                    <div className="bg-primary bg-opacity-10 p-lg rounded-lg border-2 border-primary border-opacity-20">
                      <code className="text-xl font-mono font-bold text-primary block text-center">
                        {generatedReferralId}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
