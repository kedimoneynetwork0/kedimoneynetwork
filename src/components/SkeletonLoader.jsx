import React from 'react';

const SkeletonLoader = ({
  className = '',
  variant = 'card',
  lines = 3,
  showAvatar = false
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 animate-pulse ${className}`}>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className={`bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 animate-pulse ${className}`}>
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4 animate-pulse"></div>
            </div>
            {Array.from({ length: lines }).map((_, index) => (
              <div key={index} className="p-4 border-b border-gray-100 dark:border-slate-700 last:border-b-0">
                <div className="flex items-center space-x-4">
                  {showAvatar && (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
              <div
                key={index}
                className={`h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse ${
                  index === lines - 1 ? 'w-3/4' : 'w-full'
                }`}
              ></div>
            ))}
          </div>
        );

      default:
        return (
          <div className={`bg-gray-200 dark:bg-slate-700 rounded animate-pulse ${className}`}></div>
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;