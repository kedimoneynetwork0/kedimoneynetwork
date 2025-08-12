import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import NewsSection from '../components/NewsSection';
import './home.css';

export default function Home() {
  return (
    <div>
      <Header />
      <main>
        <div className="main-content">
          <HeroSection />
          <NewsSection />
        </div>
      </main>
    </div>
  );
}
