import React from 'react';

export function UnfoldLogo({ className = '', size = 40 }) {
  return (
    <img 
      src="/logo.png" 
      alt="Unfoldd Logo" 
      width={size} 
      height={size} 
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function UnfoldWordmark({ className = '', size = 32 }) {
  return (
    <div
      className={`font-bold tracking-tight text-text-primary ${className}`}
      style={{ fontSize: size }}
    >
      unfol<span className="text-unfoldd-dd">dd</span>
    </div>
  );
}
