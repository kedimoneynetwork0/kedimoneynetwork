import React, { useState } from 'react';
import axios from 'axios';
import './signup.css';
import HeroSection from '../components/HeroSection';
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
      const res = await axios.post('http://localhost:4000/api/auth/signup', form);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div>
      <Header />
      <HeroSection />
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
          <div className="mb-4">
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              onChange={handleChange} 
              required 
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input 
              name="referralId" 
              placeholder="Referral ID (optional)" 
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
