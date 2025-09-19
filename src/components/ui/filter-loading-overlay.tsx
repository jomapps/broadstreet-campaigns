/**
 * FILTER LOADING OVERLAY - SUSPENSE ANIMATION COMPONENT
 * 
 * Loading overlay component that displays during filtering operations
 * to provide visual feedback when processing large datasets.
 * Includes animated spinner and filter status information.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { Loader2, Filter } from 'lucide-react';

/**
 * Props interface for FilterLoadingOverlay
 * Variable names follow docs/variable-origins.md registry
 */
interface FilterLoadingOverlayProps {
  isVisible: boolean;
  filterCount?: number;
  totalCount?: number;
  className?: string;
}

/**
 * FilterLoadingOverlay - Animated loading overlay for filtering operations
 * Variable names follow docs/variable-origins.md registry
 */
export function FilterLoadingOverlay({
  isVisible,
  filterCount,
  totalCount,
  className = ""
}: FilterLoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={`
      absolute inset-0 bg-white/80 backdrop-blur-sm 
      flex items-center justify-center z-10 
      rounded-lg border border-gray-200
      ${className}
    `}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-sm mx-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            <Filter className="h-3 w-3 text-blue-400 absolute -bottom-1 -right-1" />
          </div>
          
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              Filtering zones...
            </div>
            
            {typeof filterCount === 'number' && typeof totalCount === 'number' && (
              <div className="text-xs text-gray-500 mt-1">
                {filterCount} of {totalCount} zones match
              </div>
            )}
          </div>
        </div>
        
        {/* Animated progress bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
          <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simplified loading spinner for inline use
 * Variable names follow docs/variable-origins.md registry
 */
export function FilterLoadingSpinner({ 
  isVisible, 
  className = "" 
}: { 
  isVisible: boolean; 
  className?: string; 
}) {
  if (!isVisible) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      <span className="text-sm text-gray-600">Filtering...</span>
    </div>
  );
}
