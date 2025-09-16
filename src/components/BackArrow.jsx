import React from 'react';
import { Link } from 'react-router-dom';

export default function BackArrow() {
  return (
    <Link
      to="/"
      className="fixed top-4 left-4 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      aria-label="Back to homepage"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </Link>
  );
}