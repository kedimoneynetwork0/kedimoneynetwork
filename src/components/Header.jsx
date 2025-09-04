import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/home.css';

export default function Header() {
  return (
    <header style={{
      position: 'relative',
      backgroundImage: 'url("../../ChatGPT Image Sep 4, 2025, 04_16_03 PM.png")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: '200px',
      backgroundOpacity: '0.1'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url("../../ChatGPT Image Sep 4, 2025, 04_16_03 PM.png")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '200px',
        opacity: '0.1',
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