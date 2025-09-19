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
    referralId: '',
    idNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');

    if (!emailRegex.test(form.email)) {
      setMessage('Invalid email format');
      return;
    }
    if (!passwordRegex.test(form.password)) {
      setMessage('Password must be at least 8 chars with a number and special char');
      return;
    }

    try {
      const res = await signup(form); // Use the API module function
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="relative">
      <Header />
      <div className="container">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
          <h2 className="text-2xl font-bold mb-6 text-green-700">Sign Up</h2>
          <div className="mb-4">
            <input 
              name="firstname" 
              placeholder="First Name" 
              onChange={handleChange} 
              required 
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input 
              name="lastname" 
              placeholder="Last Name" 
              onChange={handleChange} 
              required 
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input 
              name="phone" 
              placeholder="Phone" 
              onChange={handleChange} 
              required 
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input 
              name="email" 
              placeholder="Email" 
              onChange={handleChange} 
              required 
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input 
              name="username" 
              placeholder="Username" 
              onChange={handleChange} 
              required 
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              onChange={handleChange}
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
          <div className="mb-4">
            <input 
              name="referralId" 
              placeholder="Referral Id number"
              onChange={handleChange} 
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input 
              name="idNumber" 
              placeholder="ID/Passport Number" 
              onChange={handleChange} 
              required 
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 transition"
          >
            Sign Up
          </button>
          {message && (
            <p className={`mt-4 text-center ${message.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
