import React from 'react';

export default function Loading({ message = 'Loading...', size = 'medium', className = '' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-2`}></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}

// Table loading skeleton
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 mb-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Card loading skeleton
export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white p-6 rounded-lg shadow">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}