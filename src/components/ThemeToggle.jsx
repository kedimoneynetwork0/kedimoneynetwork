import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${className} ${
        isDarkMode ? 'bg-slate-700' : 'bg-yellow-200'
      }`}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 transform ${
          isDarkMode
            ? 'translate-x-6 bg-slate-200'
            : 'translate-x-0.5 bg-yellow-500'
        } flex items-center justify-center`}
      >
        {isDarkMode ? (
          <FaMoon className="w-3 h-3 text-slate-700" />
        ) : (
          <FaSun className="w-3 h-3 text-white" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;