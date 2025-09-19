import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import ImageSlideshow from '../components/ImageSlideshow';
import { MdSupport } from 'react-icons/md';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import './home.css';

export default function Home() {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('token') && localStorage.getItem('role');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* Dynamic Image Slideshow - Always visible for better engagement */}
        <section className="relative mb-8">
          <ImageSlideshow />
        </section>

        {/* Hero content overlay on slideshow - only for non-logged in users */}
        {!isLoggedIn && (
          <div className="relative -mt-16 z-10 px-4">
            <div className="bg-white bg-opacity-95 backdrop-blur-sm py-8 px-6 mx-auto max-w-4xl rounded-lg shadow-xl">
              <div className="text-center">
                <h2 className="text-2xl md:text-4xl font-bold text-green-800 mb-4">
                  Bika neza, zigama neza, utere imbere
                </h2>
                <p className="text-lg text-green-700 mb-6 max-w-2xl mx-auto">
                  Uburyo bushya bwo kwizigamira no gufashanya
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/signup"
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
                  >
                    Tangira - Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className="inline-block bg-white text-green-600 border-2 border-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition duration-300"
                  >
                    Injira - Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Section replacing News */}
        <section className="mb-8 px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-4xl font-bold text-green-800 mb-4 text-center">Latest News</h2>
            <div className="aspect-video">
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
        </section>
      </main>
      <footer className="bg-green-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">KEDI Business & Agri Funds</h3>
              <p className="text-green-200 text-sm">Building financial futures together</p>
            </div>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/kevin.tuyishime.3"
                className="text-green-200 hover:text-white transition duration-200 p-2 rounded-full hover:bg-green-700"
                aria-label="Facebook"
              >
                <FaFacebookF className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/kedivibe1/"
                className="text-green-200 hover:text-white transition duration-200 p-2 rounded-full hover:bg-green-700"
                aria-label="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/TuyishimeK74025"
                className="text-green-200 hover:text-white transition duration-200 p-2 rounded-full hover:bg-green-700"
                aria-label="Twitter"
              >
                <FaTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@KEDI397"
                className="text-green-200 hover:text-white transition duration-200 p-2 rounded-full hover:bg-green-700"
                aria-label="YouTube"
              >
                <FaYoutube className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="border-t border-green-700 mt-6 pt-6 text-center">
            <p className="text-green-200 text-sm">&copy; 2025 KEDI Money Network. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 transition duration-200">
          <a
            href="mailto:kedimoneynetwork@gmail.com"
            className="flex items-center justify-center"
            aria-label="Contact Support"
          >
            <MdSupport className="w-6 h-6" />
          </a>
        </div>
        <div className="mt-2 bg-white rounded-lg shadow-lg p-3 text-sm">
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
