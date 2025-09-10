'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchInput({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  className = "" 
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full pl-10 pr-10 py-2 border rounded-lg text-sm
          transition-colors duration-200
          ${isFocused 
            ? 'border-blue-500 ring-1 ring-blue-500' 
            : 'border-gray-300 hover:border-gray-400'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        `}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
