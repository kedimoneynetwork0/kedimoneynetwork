import React from 'react';
import { Link } from 'react-router-dom';

export default function ModernHeroSection() {
  return (
    <section className="hero">
      {/* Logo/Image */}
      <img
        src="/uploads/1756994307932-KEDI%20Money%20Network%20Logo%20(3).png"
        alt="KEDI Money Network Logo"
        style={{ width: '180px', height: 'auto' }}
      />

      {/* Title */}
      <h1>KEDI BUSINESS & AGRI FUNDS</h1>

      {/* Subtitle */}
      <p>Kimina k'Ikoranabuhanga ry'Ubucuruzi n'Ubuhinzi</p>

      {/* Buttons */}
      <div className="buttons">
        <Link to="/signup" className="btn btn-primary">
          Sign Up
        </Link>
        <Link to="/login" className="btn btn-outline">
          Sign In
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'white', opacity: 0.6 }}
        >
          <path d="M7 13l3 3 3-3"></path>
          <path d="M12 2v10"></path>
          <path d="M12 22v-2"></path>
        </svg>
      </div>
    </section>
  );
}