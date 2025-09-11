'use client';

import { useState } from 'react';

type ZoneSize = 'SQ' | 'PT' | 'LS';

interface ZoneSizeFiltersProps {
  selectedSizes?: ZoneSize[];
  onSizeFilterChange?: (sizes: ZoneSize[]) => void;
}

const SIZE_DEFINITIONS = {
  SQ: { label: 'SQ', description: 'Square ads (300x250px)', color: 'bg-blue-100 text-blue-800' },
  PT: { label: 'PT', description: 'Portrait banners (300x600px)', color: 'bg-green-100 text-green-800' },
  LS: { label: 'LS', description: 'Horizontal banners (728x90px)', color: 'bg-purple-100 text-purple-800' },
};

export default function ZoneSizeFilters({ selectedSizes = [], onSizeFilterChange }: ZoneSizeFiltersProps) {
  const [localSelectedSizes, setLocalSelectedSizes] = useState<ZoneSize[]>(selectedSizes);

  const handleSizeToggle = (size: ZoneSize) => {
    const newSizes = localSelectedSizes.includes(size)
      ? localSelectedSizes.filter(s => s !== size)
      : [...localSelectedSizes, size];
    
    setLocalSelectedSizes(newSizes);
    onSizeFilterChange?.(newSizes);
  };

  const clearAllFilters = () => {
    setLocalSelectedSizes([]);
    onSizeFilterChange?.([]);
  };

  const hasActiveFilters = localSelectedSizes.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="card-title text-gray-900">Zone Size Guide</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 card-text">
        {Object.entries(SIZE_DEFINITIONS).map(([size, config]) => {
          const isSelected = localSelectedSizes.includes(size as ZoneSize);
          const isActive = hasActiveFilters && !isSelected;
          
          return (
            <div 
              key={size}
              className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'bg-blue-50 border-2 border-blue-200' 
                  : isActive
                    ? 'opacity-40'
                    : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSizeToggle(size as ZoneSize)}
            >
              <span className={`px-2 py-1 text-xs rounded-full font-medium transition-all duration-200 ${
                isSelected 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : config.color
              }`}>
                {config.label}
              </span>
              <span className={`transition-all duration-200 ${
                isSelected ? 'font-medium text-blue-900' : 'text-gray-700'
              }`}>
                {config.description}
              </span>
              {isSelected && (
                <span className="text-blue-500 text-sm">✓</span>
              )}
            </div>
          );
        })}
      </div>
      
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing zones with sizes: <span className="font-medium">{localSelectedSizes.join(', ')}</span>
          </p>
        </div>
      )}
    </div>
  );
}
