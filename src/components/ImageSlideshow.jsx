import React, { useState, useEffect } from 'react';

// Import all images from assets folder dynamically
const images = [
  require('../assets/jan-kopriva-LTMaAwxanGk-unsplash.jpg'),
  require('../assets/markus-spiske-sFydXGrt5OA-unsplash.jpg'),
  require('../assets/markus-spiske-ZSZ6wzNU12Q-unsplash.jpg'),
  require('../assets/pexels-essow-k-251295-936722.jpg'),
  require('../assets/pexels-pixabay-259027.jpg'),
  require('../assets/pexels-pixabay-265087.jpg')
];

export default function ImageSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Manual navigation
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg shadow-2xl">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="min-w-full h-full relative"
          >
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>

            {/* Slide content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                  KEDI Business & Agri Funds
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl drop-shadow-md max-w-2xl mx-auto">
                  Empowering communities through sustainable financial solutions
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-white scale-125'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play toggle */}
      <button
        onClick={toggleAutoPlay}
        className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-full text-sm transition-all duration-200"
        aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
      >
        {isAutoPlaying ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15m-3 7.5A9.5 9.5 0 1121.5 12 9.5 9.5 0 0112 2.5z" />
          </svg>
        )}
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black bg-opacity-20">
        <div
          className="h-full bg-white transition-all duration-200 ease-linear"
          style={{
            width: isAutoPlaying ? `${((currentIndex + 1) / images.length) * 100}%` : '0%'
          }}
        ></div>
      </div>
    </div>
  );
}