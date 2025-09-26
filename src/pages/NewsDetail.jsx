import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNews, getFullUrl } from '../api';
import Header from '../components/Header';
import Loading from '../components/Loading';

export default function NewsDetail() {
  const { id } = useParams();
  const [newsItem, setNewsItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        const response = await getNews();
        const newsData = Array.isArray(response.data) ? response.data : [];
        const foundNews = newsData.find(item => item.id === parseInt(id));

        if (foundNews) {
          setNewsItem(foundNews);
        } else {
          setError('News article not found');
        }
      } catch (err) {
        setError('Failed to load news article');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNewsDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <Loading message="Loading news article..." />
        </div>
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="text-2xl font-bold text-red-800 mb-2">Article Not Found</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <Link
                to="/"
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition duration-200"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <article className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Article Header */}
          <header className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            {newsItem.media_url && newsItem.media_type === 'image' && (
              <img
                src={getFullUrl(newsItem.media_url)}
                alt={newsItem.title}
                className="w-full h-64 md:h-80 object-cover"
              />
            )}

            <div className="p-8">
              <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
                {newsItem.title}
              </h1>

              <div className="flex items-center text-gray-500 text-sm mb-6">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {new Date(newsItem.created_at).toLocaleDateString('en-RW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Africa/Kigali'
                  })}
                </span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {newsItem.content}
              </p>
            </div>

            {/* Media Content */}
            {newsItem.media_url && newsItem.media_type === 'video' && (
              <div className="px-8 pb-8">
                <div className="bg-gray-100 rounded-lg p-4">
                  <video
                    src={getFullUrl(newsItem.media_url)}
                    controls
                    className="w-full rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}

            {newsItem.media_url && newsItem.media_type === 'application' && (
              <div className="px-8 pb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-blue-900">Document Attachment</p>
                        <p className="text-sm text-blue-700">Click to download the attached document</p>
                      </div>
                    </div>
                    <a
                      href={getFullUrl(newsItem.media_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/"
                className="btn btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Home
              </Link>
              <button
                onClick={() => window.print()}
                className="btn btn-outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Article
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}