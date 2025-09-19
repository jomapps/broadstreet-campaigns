'use client';

import { useState, useEffect } from 'react';

/**
 * Enhanced Loading Component with Progressive States
 * Provides better UX with progressive loading states and timeout handling
 */
export default function EnhancedLoading({ 
  message = 'Loading...', 
  showProgress = false,
  timeout = 10000,
  onTimeout,
  className = ''
}) {
  const [loadingState, setLoadingState] = useState('initial');
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 100;
        
        // Update loading state based on time elapsed
        if (newTime > 3000 && loadingState === 'initial') {
          setLoadingState('extended');
        } else if (newTime > 7000 && loadingState === 'extended') {
          setLoadingState('long');
        }
        
        // Update progress bar if enabled
        if (showProgress) {
          setProgress(Math.min((newTime / timeout) * 100, 95));
        }
        
        // Handle timeout
        if (newTime >= timeout) {
          setLoadingState('timeout');
          onTimeout?.();
          clearInterval(interval);
        }
        
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [loadingState, showProgress, timeout, onTimeout]);

  const getLoadingMessage = () => {
    switch (loadingState) {
      case 'initial':
        return message;
      case 'extended':
        return 'Still loading, please wait...';
      case 'long':
        return 'This is taking longer than usual...';
      case 'timeout':
        return 'Loading timed out. Please try refreshing the page.';
      default:
        return message;
    }
  };

  const getLoadingAnimation = () => {
    switch (loadingState) {
      case 'initial':
        return 'animate-spin';
      case 'extended':
        return 'animate-pulse';
      case 'long':
        return 'animate-bounce';
      case 'timeout':
        return '';
      default:
        return 'animate-spin';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Loading Icon */}
      <div className={`w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full ${getLoadingAnimation()}`} />
      
      {/* Loading Message */}
      <p className="mt-4 text-sm text-gray-600 text-center">
        {getLoadingMessage()}
      </p>
      
      {/* Progress Bar */}
      {showProgress && loadingState !== 'timeout' && (
        <div className="w-64 bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {/* Time Elapsed */}
      {loadingState === 'long' && (
        <p className="mt-2 text-xs text-gray-400">
          {Math.round(timeElapsed / 1000)}s elapsed
        </p>
      )}
      
      {/* Timeout Actions */}
      {loadingState === 'timeout' && (
        <div className="mt-4 space-x-2">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Refresh Page
          </button>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton Loading Component for Cards
 * Provides consistent skeleton loading for entity cards
 */
export function CardSkeleton({ count = 3, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border rounded-lg p-4 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Table Skeleton Loading Component
 * Provides skeleton loading for table layouts
 */
export function TableSkeleton({ rows = 5, columns = 4, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b animate-pulse">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-4 border-b animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Grid Skeleton Loading Component
 * Provides skeleton loading for grid layouts
 */
export function GridSkeleton({ items = 6, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="border rounded-lg p-4 animate-pulse">
          <div className="w-full h-32 bg-gray-200 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
