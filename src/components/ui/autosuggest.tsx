'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutosuggestOption {
  id: string;
  name: string;
  website?: string;
  type?: 'synced' | 'local';
  network_id?: number;
}

interface AutosuggestProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: AutosuggestOption | null) => void;
  placeholder?: string;
  searchFunction: (query: string) => Promise<AutosuggestOption[]>;
  className?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreateNew?: () => void;
  createNewLabel?: string;
}

export default function Autosuggest({
  value,
  onChange,
  onSelect,
  placeholder = 'Type to search...',
  searchFunction,
  className,
  disabled = false,
  allowCreate = false,
  onCreateNew,
  createNewLabel = 'Create new',
}: AutosuggestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AutosuggestOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedOption, setSelectedOption] = useState<AutosuggestOption | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search for options when value changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchFunction(value);
        setOptions(results);
        setIsOpen(results.length > 0 || allowCreate);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setOptions([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, searchFunction, allowCreate]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear selection if user is typing
    if (selectedOption && newValue !== selectedOption.name) {
      setSelectedOption(null);
      onSelect?.(null);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: AutosuggestOption) => {
    setSelectedOption(option);
    onChange(option.name);
    onSelect?.(option);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Handle create new
  const handleCreateNew = () => {
    setIsOpen(false);
    onCreateNew?.();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalOptions = options.length + (allowCreate ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < options.length) {
          handleOptionSelect(options[selectedIndex]);
        } else if (selectedIndex === options.length && allowCreate) {
          handleCreateNew();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (options.length > 0 || allowCreate) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={cn(className)}
          disabled={disabled}
        />
        
        {selectedOption && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Check className="h-4 w-4 text-green-600" />
          </div>
        )}
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {options.map((option, index) => (
            <div
              key={option.id}
              className={cn(
                'px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0',
                selectedIndex === index && 'bg-blue-50',
                option.type === 'local' && 'bg-yellow-50'
              )}
              onClick={() => handleOptionSelect(option)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{option.name}</div>
                  {option.website && (
                    <div className="text-sm text-gray-500">{option.website}</div>
                  )}
                </div>
                {option.type === 'local' && (
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                    Local
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {allowCreate && (
            <div
              className={cn(
                'px-3 py-2 cursor-pointer hover:bg-gray-50 border-t border-gray-200 flex items-center gap-2',
                selectedIndex === options.length && 'bg-blue-50'
              )}
              onClick={handleCreateNew}
            >
              <Plus className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600 font-medium">{createNewLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
