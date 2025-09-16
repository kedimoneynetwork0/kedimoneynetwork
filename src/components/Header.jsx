import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/home.css';

export default function Header() {
  return (
    <header className="relative bg-green-600 bg-opacity-90 shadow-lg">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none z-0"
           style={{ backgroundImage: 'url("/ChatGPT%20Image%20Sep%204,%202025,%2004_16_03%20PM.png")' }}></div>
      <div className="relative z-10 container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-white text-xl md:text-2xl font-bold mb-4 md:mb-0 text-center md:text-left">
            KEDI BUSINESS & AGRI FUNDS
          </h1>
          <nav className="flex flex-wrap justify-center md:justify-end space-x-4">
            <Link
              to="/home"
              className="text-white hover:text-green-200 transition duration-200 px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-10"
            >
              Ahabanza
            </Link>
            <Link
              to="/about"
              className="text-white hover:text-green-200 transition duration-200 px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-10"
            >
              Ibyerekeye
            </Link>
            <Link
              to="/signup"
              className="bg-white text-green-600 hover:bg-green-50 transition duration-200 px-4 py-2 rounded-md font-medium"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="text-white hover:text-green-200 transition duration-200 px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-10"
            >
              Sign in
            </Link>
            <Link
              to="/admin-login"
              className="text-white hover:text-green-200 transition duration-200 px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-10 text-sm"
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}