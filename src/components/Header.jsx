import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/home.css';

export default function Header() {
  return (
    <header>
      <h1>KEDI MONEY NETWORK</h1>
      <nav>
        <Link to="/home">Ahabanza</Link>
        <Link to="/about">Ibyerekeye</Link>
        <Link to="/signup">Sign up</Link>
        <Link to="/login">Sign in</Link>
        <Link to="/admin-login">Admin</Link>
      </nav>
    </header>
  );
}