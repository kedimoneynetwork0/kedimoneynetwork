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

        {/* News Ticker */}
        {latestNews.length > 0 && (
          <div className="mt-4 bg-black bg-opacity-30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span className="text-white text-sm font-medium">Latest News</span>
            </div>
            <div className="space-y-2">
              {latestNews.map((news) => (
                <div key={news.id} className="text-white text-xs">
                  <Link
                    to={`/news/${news.id}`}
                    className="hover:text-yellow-300 transition duration-200 line-clamp-1"
                    title={news.title}
                  >
                    {news.title}
                  </Link>
                  <span className="text-gray-300 ml-2">
                    {new Date(news.created_at).toLocaleDateString('en-RW', {
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'Africa/Kigali'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}