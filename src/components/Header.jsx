import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../pages/home.css';

export default function Header() {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Check if user is on dashboard page
  const isDashboard = location.pathname === '/user-dashboard' || location.pathname === '/admin-dashboard';
  const isLoggedIn = token && role;

  // Show hero section only on home page when not logged in
  const showHeroSection = location.pathname === '/' || location.pathname === '/home';

  return (
    <>
      {/* Back Arrow Button for Dashboard */}
      {isLoggedIn && isDashboard && (
        <div className="back-arrow-container">
          <Link to="/home" className="back-arrow-button">
            ←
          </Link>
        </div>
      )}

      {/* Header */}
      <header style={{
        position: 'relative',
        backgroundColor: 'rgba(40, 167, 69, 0.9)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("/ChatGPT%20Image%20Sep%204,%202025,%2004_16_03%20PM.png")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '300px',
          opacity: '0.3',
          pointerEvents: 'none',
          zIndex: 0
        }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1>KEDI BUSINESS & AGRI FUNDS</h1>
          <nav>
            <Link to="/home">Ahabanza</Link>
            <Link to="/about">Ibyerekeye</Link>
            {!isLoggedIn && (
              <>
                <Link to="/signup">Sign up</Link>
                <Link to="/login">Sign in</Link>
                <Link to="/admin-login">Admin</Link>
              </>
            )}
            {isLoggedIn && (
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '10px 15px',
                  borderRadius: '5px',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section - Only show on home page when not logged in */}
      {showHeroSection && !isLoggedIn && (
        <div className="hero-section">
          <h2>Bika neza, zigama neza, utere imbere</h2>
          <p>Uburyo bushya bwo kwizigamira no gufashanya</p>
          <button><Link to="/signup">Tangira</Link></button>
        </div>
      )}
    </>
  );
}