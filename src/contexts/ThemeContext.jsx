import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Set initial theme
    const saved = localStorage.getItem('kedi-theme');
    if (saved) {
      setIsDarkMode(saved === 'dark');
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    // Update CSS custom properties when theme changes
    const root = document.documentElement;

    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('kedi-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('kedi-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};