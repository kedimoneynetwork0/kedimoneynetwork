import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNews, getFullUrl } from '../api';
import './HeroSection.css';

export default function HeroSection() {
  const [featuredNews, setFeaturedNews] = useState(null);

  useEffect(() => {
    const fetchFeaturedNews = async () => {
      try {
        const response = await getNews();
        const newsData = Array.isArray(response.data) ? response.data : [];
        if (newsData.length > 0) {
          setFeaturedNews(newsData[0]); // Get the most recent news as featured
        }
      } catch (error) {
        console.error('Failed to fetch featured news:', error);
      }
    };
    fetchFeaturedNews();
  }, []);

  useEffect(() => {
    // Hero slideshow functionality
    let currentSlide = 0;
    const slides = document.querySelectorAll('.hero-slide');
    const totalSlides = slides.length;

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
          slide.classList.add('active');
        }
      });
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % totalSlides;
      showSlide(currentSlide);
    }

    // Start slideshow
    const interval = setInterval(nextSlide, 5000);

    // Show first slide initially
    showSlide(0);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section">
      {/* Background Slideshow */}
      <div className="hero-slideshow">
        <div className="hero-slide active" style={{backgroundImage: 'url(/src/assets/jan-kopriva-LTMaAwxanGk-unsplash.jpg)'}}></div>
        <div className="hero-slide" style={{backgroundImage: 'url(/src/assets/markus-spiske-sFydXGrt5OA-unsplash.jpg)'}}></div>
        <div className="hero-slide" style={{backgroundImage: 'url(/src/assets/markus-spiske-ZSZ6wzNU12Q-unsplash.jpg)'}}></div>
        <div className="hero-slide" style={{backgroundImage: 'url(/src/assets/pexels-essow-k-251295-936722.jpg)'}}></div>
        <div className="hero-slide" style={{backgroundImage: 'url(/src/assets/pexels-pixabay-259027.jpg)'}}></div>
        <div className="hero-slide" style={{backgroundImage: 'url(/src/assets/pexels-pixabay-265087.jpg)'}}></div>
      </div>

      {/* Overlay Gradient */}
      <div className="hero-overlay"></div>

      {/* Hero Content */}
      <div className="hero-content">
        <div className="hero-logo">
          <img src="/uploads/1756994307932-KEDI Money Network Logo (3).png" alt="KEDI Logo" className="logo-image" />
        </div>

        <div className="hero-text">
          <h1 className="hero-headline">KEDI BUSINESS & AGRI FUNDS</h1>
          <p className="hero-subheadline">Building wealth together through savings, business, and agriculture.</p>
        </div>

        <div className="hero-actions">
          <Link to="/signup" className="hero-button">Join Now</Link>
        </div>

        {/* Featured News in Hero */}
        {featuredNews && (
          <div className="hero-news mt-8 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 max-w-md">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span className="text-white text-sm font-medium">Featured News</span>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2 line-clamp-2">
              {featuredNews.title}
            </h3>
            <p className="text-gray-200 text-sm mb-3 line-clamp-2">
              {featuredNews.content}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xs">
                {new Date(featuredNews.created_at).toLocaleDateString('en-RW', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'Africa/Kigali'
                })}
              </span>
              <Link
                to={`/news/${featuredNews.id}`}
                className="text-yellow-300 hover:text-yellow-100 text-sm font-medium transition duration-200"
              >
                Read More →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator">
        <div className="scroll-mouse">
          <div className="scroll-wheel"></div>
        </div>
        <p>Scroll Down</p>
      </div>
    </section>
  );
}