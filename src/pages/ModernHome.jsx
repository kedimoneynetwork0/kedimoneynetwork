import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import ModernHeroSection from '../components/ModernHeroSection';
import { MdSupport } from 'react-icons/md';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import '../styles/homepage.css';

export default function ModernHome() {
  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <ModernHeroSection />

      {/* Video Section */}
      <section className="py-3xl">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-xl text-primary">Latest News & Updates</h2>
          <div className="max-w-4xl mx-auto">
            <div className="card p-lg">
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src="https://www.youtube.com/embed/2-0F7iOYtFA"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-3xl">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl mb-3xl">
            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold mb-lg">KEDI Business & Agri Funds</h3>
              <p className="text-green-100 text-sm leading-relaxed mb-md">
                Building financial futures together through innovative business and agricultural solutions.
              </p>
              <p className="text-green-100 text-sm">
                Kimina k'Ikoranabuhanga ry'Ubucuruzi n'Ubuhinzi
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-semibold mb-lg">Quick Links</h4>
              <nav className="flex flex-col gap-sm">
                <Link to="/" className="text-green-100 hover:text-white transition-colors text-sm">
                  Ahabanza
                </Link>
                <Link to="/about" className="text-green-100 hover:text-white transition-colors text-sm">
                  Ibyerekeye
                </Link>
                <Link to="/signup" className="text-green-100 hover:text-white transition-colors text-sm">
                  Kwiyandikisha
                </Link>
                <Link to="/login" className="text-green-100 hover:text-white transition-colors text-sm">
                  Kwinjira
                </Link>
                <Link to="/bonus" className="text-green-100 hover:text-white transition-colors text-sm">
                  Amafaranga y'Abashyitsi
                </Link>
              </nav>
            </div>

            {/* Social Media & Contact */}
            <div>
              <h4 className="text-xl font-semibold mb-lg">Connect With Us</h4>
              <div className="flex gap-md mb-lg">
                <a
                  href="https://www.facebook.com/kevin.tuyishime.3"
                  className="text-green-100 hover:text-white transition-colors p-sm rounded-full hover:bg-white hover:bg-opacity-10"
                  aria-label="Facebook"
                >
                  <FaFacebookF className="w-5 h-5" />
                </a>
                <a
                  href="https://www.instagram.com/kedivibe1/"
                  className="text-green-100 hover:text-white transition-colors p-sm rounded-full hover:bg-white hover:bg-opacity-10"
                  aria-label="Instagram"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com/TuyishimeK74025"
                  className="text-green-100 hover:text-white transition-colors p-sm rounded-full hover:bg-white hover:bg-opacity-10"
                  aria-label="Twitter"
                >
                  <FaTwitter className="w-5 h-5" />
                </a>
                <a
                  href="https://www.youtube.com/@KEDI397"
                  className="text-green-100 hover:text-white transition-colors p-sm rounded-full hover:bg-white hover:bg-opacity-10"
                  aria-label="YouTube"
                >
                  <FaYoutube className="w-5 h-5" />
                </a>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col gap-sm text-sm text-green-100">
                <div className="flex items-center gap-sm">
                  <span>📧</span>
                  <a href="mailto:kedimoneynetwork@gmail.com" className="hover:text-white transition-colors">
                    kedimoneynetwork@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-sm">
                  <span>📱</span>
                  <a href="https://wa.me/250795772698" className="hover:text-white transition-colors">
                    +250 795 772 698
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-green-600 pt-xl text-center">
            <p className="text-green-100 text-sm">
              &copy; 2025 KEDI Money Network. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Support Button */}
      <div className="fixed bottom-lg right-lg z-50">
        <div className="bg-primary text-white rounded-full p-md shadow-lg hover:bg-green-700 transition-all cursor-pointer">
          <a
            href="mailto:kedimoneynetwork@gmail.com"
            className="flex items-center justify-center"
            aria-label="Contact Support"
          >
            <MdSupport className="w-6 h-6" />
          </a>
        </div>
        <div className="mt-sm bg-white rounded-lg shadow-lg p-md text-sm opacity-0 hover:opacity-100 transition-all">
          <a
            href="https://wa.me/250795772698"
            className="block text-primary hover:text-green-700 mb-sm"
          >
            WhatsApp: +250795772698
          </a>
          <a
            href="mailto:kedimoneynetwork@gmail.com"
            className="block text-primary hover:text-green-700"
          >
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}