import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

export default function HeroSection() {
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