'use client';

import { Search, X, Minus, Loader2 } from 'lucide-react';

interface DualSearchInputProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  negativeSearchPlaceholder?: string;
  negativeSearchValue: string;
  onNegativeSearchChange: (value: string) => void;
  className?: string;
  isFiltering?: boolean;
}

export function DualSearchInput({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  negativeSearchPlaceholder = "Exclude...",
  negativeSearchValue,
  onNegativeSearchChange,
  className = "",
  isFiltering = false
}: DualSearchInputProps) {

  const handleSearchClear = () => {
    onSearchChange('');
  };

  const handleNegativeSearchClear = () => {
    onNegativeSearchChange('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Positive Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isFiltering && searchValue ? (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm
                     hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:border-transparent transition-colors duration-200"
        />
        {searchValue && (
          <button
            onClick={handleSearchClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 
                       hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Negative Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isFiltering && negativeSearchValue ? (
            <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
          ) : (
            <Minus className="h-4 w-4 text-red-400" />
          )}
        </div>
        <input
          type="text"
          placeholder={negativeSearchPlaceholder}
          value={negativeSearchValue}
          onChange={(e) => onNegativeSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-red-200 rounded-lg text-sm
                     hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 
                     focus:border-transparent transition-colors duration-200 bg-red-50"
        />
        {negativeSearchValue && (
          <button
            onClick={handleNegativeSearchClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-400 
                       hover:text-red-600 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Helper Text */}
      {(searchValue || negativeSearchValue) && (
        <div className="text-xs text-gray-500 space-y-1">
          {searchValue && (
            <div className="flex items-center gap-1">
              <Search className="h-3 w-3 text-green-500" />
              <span>Including: "{searchValue}"</span>
            </div>
          )}
          {negativeSearchValue && (
            <div className="flex items-center gap-1">
              <Minus className="h-3 w-3 text-red-500" />
              <span>Excluding: "{negativeSearchValue}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
