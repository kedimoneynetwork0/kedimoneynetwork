import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import NewsSection from '../components/NewsSection';
import { MdSupport } from 'react-icons/md';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import './home.css';

export default function Home() {
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  return (
    <div>
      <Header />
      <main>
        <div className="main-content">
          <NewsSection />
        </div>
      </main>
      <footer className="footer">
        <div className="social-icons">
          <a href="https://www.facebook.com/kevin.tuyishime.3" className="social-link">
            <FaFacebookF />
          </a>
          <a href="https://www.instagram.com/kedivibe1/" className="social-link">
            <FaInstagram />
          </a>
          <a href="https://x.com/TuyishimeK74025" className="social-link">
            <FaTwitter />
          </a>
          <a href="https://www.youtube.com/@KEDI397" className="social-link">
            <FaYoutube />
          </a>
        </div>
      </footer>
      <div className="support-container">
        <a href="mailto:kedimoneynetwork@gmail.com" className="support-icon">
          <MdSupport />
        </a>
        <div className="contact-info">
          <a href="https://wa.me/25075772698" className="contact-link">WhatsApp: +25075772698</a>
          <a href="mailto:kedimoneynetwork@gmail.com" className="contact-link">Email: kedimoneynetwork@gmail.com</a>
        </div>
      </div>
    </div>
  );
}
