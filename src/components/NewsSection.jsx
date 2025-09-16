import React, { useEffect, useState } from 'react';
import { getNews, getFullUrl } from '../api';
import Loading from './Loading';

export default function NewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNewsOnMount = async () => {
      try {
        const response = await getNews();
        // Ensure we're working with an array
        const newsData = Array.isArray(response.data) ? response.data : [];
        setNews(newsData);
      } catch (err) {
        setError('Failed to load news');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNewsOnMount();
  }, []);

  if (loading) {
    return (
      <div className="news-section">
        <Loading message="Loading latest news..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-section">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <svg className="mx-auto h-8 w-8 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-800 font-medium">Failed to load news</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="news-section py-16 px-4 bg-white">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-green-800 mb-12">
          Latest News
        </h2>
        {news.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-gray-500 text-lg">No news available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.slice(0, 3).map((item) => (
              <article key={item.id} className="news-item bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                {item.media_url && item.media_type === 'image' && (
                  <img
                    src={getFullUrl(item.media_url)}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-green-800 mb-3 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>
                  {item.media_url && item.media_type === 'video' && (
                    <video
                      src={getFullUrl(item.media_url)}
                      controls
                      className="w-full mb-4 rounded"
                    />
                  )}
                  {item.media_url && item.media_type === 'application' && (
                    <a
                      href={getFullUrl(item.media_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View PDF Document
                    </a>
                  )}
                  <div className="flex items-center text-sm text-gray-500 mt-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}