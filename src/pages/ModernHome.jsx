import React from 'react';
import Navigation from '../components/Navigation';
import ModernHeroSection from '../components/ModernHeroSection';
import { MdSupport } from 'react-icons/md';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import '../styles/homepage.css';

export default function ModernHome() {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <ModernHeroSection />

      {/* Video Section */}
      <section className="content-section">
        <h2>Latest News & Updates</h2>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            overflow: 'hidden',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}>
            <iframe
              src="https://www.youtube.com/embed/2-0F7iOYtFA"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '8px'
              }}
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
            {/* Company Info */}
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>KEDI Business & Agri Funds</h3>
              <p style={{ color: '#a7f3d0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '15px' }}>
                Building financial futures together through innovative business and agricultural solutions.
              </p>
              <p style={{ color: '#a7f3d0', fontSize: '0.9rem' }}>
                Kimina k'Ikoranabuhanga ry'Ubucuruzi n'Ubuhinzi
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="/" style={{ color: '#a7f3d0', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Ahabanza
                </a>
                <a href="/about" style={{ color: '#a7f3d0', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Ibyerekeye
                </a>
                <a href="/signup" style={{ color: '#a7f3d0', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Sign Up
                </a>
                <a href="/login" style={{ color: '#a7f3d0', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Sign In
                </a>
              </div>
            </div>

            {/* Social Media & Contact */}
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>Connect With Us</h4>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <a
                  href="https://www.facebook.com/kevin.tuyishime.3"
                  style={{ color: '#a7f3d0', textDecoration: 'none', padding: '8px', borderRadius: '50%', display: 'inline-block' }}
                  aria-label="Facebook"
                >
                  <FaFacebookF style={{ width: '20px', height: '20px' }} />
                </a>
                <a
                  href="https://www.instagram.com/kedivibe1/"
                  style={{ color: '#a7f3d0', textDecoration: 'none', padding: '8px', borderRadius: '50%', display: 'inline-block' }}
                  aria-label="Instagram"
                >
                  <FaInstagram style={{ width: '20px', height: '20px' }} />
                </a>
                <a
                  href="https://x.com/TuyishimeK74025"
                  style={{ color: '#a7f3d0', textDecoration: 'none', padding: '8px', borderRadius: '50%', display: 'inline-block' }}
                  aria-label="Twitter"
                >
                  <FaTwitter style={{ width: '20px', height: '20px' }} />
                </a>
                <a
                  href="https://www.youtube.com/@KEDI397"
                  style={{ color: '#a7f3d0', textDecoration: 'none', padding: '8px', borderRadius: '50%', display: 'inline-block' }}
                  aria-label="YouTube"
                >
                  <FaYoutube style={{ width: '20px', height: '20px' }} />
                </a>
              </div>

              {/* Contact Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: '#a7f3d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>📧</span>
                  <a href="mailto:kedimoneynetwork@gmail.com" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                    kedimoneynetwork@gmail.com
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>📱</span>
                  <a href="https://wa.me/25075772698" style={{ color: '#a7f3d0', textDecoration: 'none' }}>
                    +250 757 726 98
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{ borderTop: '1px solid #15803d', marginTop: '40px', paddingTop: '30px', textAlign: 'center' }}>
            <p style={{ color: '#a7f3d0', fontSize: '0.9rem' }}>
              &copy; 2025 KEDI Money Network. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Support Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 transition duration-200 cursor-pointer">
          <a
            href="mailto:kedimoneynetwork@gmail.com"
            className="flex items-center justify-center"
            aria-label="Contact Support"
          >
            <MdSupport className="w-6 h-6" />
          </a>
        </div>
        <div className="mt-2 bg-white rounded-lg shadow-lg p-3 text-sm opacity-0 hover:opacity-100 transition duration-200">
          <a
            href="https://wa.me/25075772698"
            className="block text-green-600 hover:text-green-700 mb-1"
          >
            WhatsApp: +25075772698
          </a>
          <a
            href="mailto:kedimoneynetwork@gmail.com"
            className="block text-green-600 hover:text-green-700"
          >
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}