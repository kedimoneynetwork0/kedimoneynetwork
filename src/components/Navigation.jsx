import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          KEDI
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/">Ahabanza</Link>
        <Link to="/about">Ibyerekeye</Link>
        <Link to="/signup" className="btn btn-primary" style={{ margin: '0 10px', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
          Sign Up
        </Link>
        <Link to="/login" className="btn btn-outline" style={{ margin: '0 10px', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
          Sign In
        </Link>
        <Link to="/admin-login">Admin</Link>
      </div>

      {/* Mobile menu button */}
      <button
        className="menu-toggle"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <Link to="/" onClick={closeMenu}>Ahabanza</Link>
        <Link to="/about" onClick={closeMenu}>Ibyerekeye</Link>
        <Link to="/signup" onClick={closeMenu}>Sign Up</Link>
        <Link to="/login" onClick={closeMenu}>Sign In</Link>
        <Link to="/admin-login" onClick={closeMenu}>Admin</Link>
      </div>
    </nav>
  );
}