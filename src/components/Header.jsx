import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/home.css';

export default function Header() {
  return (
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
          <Link to="/signup">Sign up</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/admin-login">Admin</Link>
        </nav>
      </div>
    </header>
  );
}