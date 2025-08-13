import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/home.css';

export default function HeroSection() {
  return (
    <div className="hero-section">
      <h2>Bika neza, zigama neza, utere imbere</h2>
      <p>Uburyo bushya bwo kwizigamira no gufashanya</p>
      <button><Link to="/signup">Tangira</Link></button>
    </div>
  );
}