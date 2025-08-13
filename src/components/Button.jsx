import React from 'react';

export default function Button({ onClick, children, className = '', type = 'button' }) {
  return (
    <button
      onClick={onClick}
      type={type}
      className={`button ${className}`}
    >
      {children}
    </button>
  );
}
