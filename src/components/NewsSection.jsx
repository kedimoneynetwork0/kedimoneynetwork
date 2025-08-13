import React, { useEffect, useState } from 'react';
import { getNews, getFullUrl } from '../api';

export default function NewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await getNews();
      setNews(data);
    } catch (err) {
      setError('Failed to load news');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="news-section">Loading news...</div>;
  }

  if (error) {
    return <div className="news-section error">{error}</div>;
  }

  return (
    <div className="news-section">
      <h2>Latest News</h2>
      {news.length === 0 ? (
        <p>No news available at the moment.</p>
      ) : (
        <div className="news-list">
          {news.slice(0, 3).map((item) => (
            <div key={item.id} className="news-item">
              <h3>{item.title}</h3>
              <p className="news-content">{item.content}</p>
              {item.media_url && item.media_type === 'image' && (
                <img src={getFullUrl(item.media_url)} alt={item.title} className="news-media" />
              )}
              {item.media_url && item.media_type === 'video' && (
                <video src={getFullUrl(item.media_url)} controls className="news-media" />
              )}
              {item.media_url && item.media_type === 'application' && (
                <a href={getFullUrl(item.media_url)} target="_blank" rel="noopener noreferrer" className="news-media-link">
                  View PDF Document
                </a>
              )}
              <p className="news-date">{new Date(item.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}