import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNews } from '../api';
import '../pages/home.css';

export default function Header() {
  const [latestNews, setLatestNews] = useState([]);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const response = await getNews();
        const newsData = Array.isArray(response.data) ? response.data : [];
        setLatestNews(newsData.slice(0, 3)); // Get latest 3 news items
      } catch (error) {
        console.error('Failed to fetch news:', error);
      }
    };
    fetchLatestNews();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-green-600 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center">
           <nav className="flex flex-wrap justify-center space-x-8 mb-4">
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
               to="#news"
               className="text-white hover:text-green-200 transition duration-200 px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-10"
               onClick={(e) => {
                 e.preventDefault();
                 const newsSection = document.getElementById('news');
                 if (newsSection) {
                   newsSection.scrollIntoView({ behavior: 'smooth' });
                 } else {
                   window.location.href = '/#news';
                 }
               }}
             >
               Amakuru
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
           <h1 className="hidden md:block text-white text-xl md:text-2xl font-bold text-center">
             KEDI BUSINESS & AGRI FUNDS
           </h1>
         </div>
      </div>
    </header>
  );
}