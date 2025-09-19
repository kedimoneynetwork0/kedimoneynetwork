import React from 'react';
import { Link } from 'react-router-dom';
import kediBusinessImage from '../assets/kedi business.png';

export default function ModernHeroSection() {
  return (
    <section className="hero">
      {/* Logo/Image */}
      <img
        src={kediBusinessImage}
        alt="KEDI Business & Agri Funds"
        style={{ width: '200px', height: 'auto', marginBottom: '20px' }}
      />

      {/* Title */}
      <h1>KEDI Business & Agri Funds</h1>

      {/* Subtitle */}
      <p style={{ maxWidth: '600px', margin: '20px auto', lineHeight: '1.6' }}>
        Building financial futures together through innovative business and agricultural solutions.
      </p>
      <p style={{ fontStyle: 'italic', opacity: 0.9 }}>
        Kimina k'Ikoranabuhanga ry'Ubucuruzi n'Ubuhinzi
      </p>

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