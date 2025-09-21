/**
 * PAGINATION COMPONENT
 * 
 * Reusable pagination component that supports both traditional pagination
 * and "Load More" patterns. Designed for performance with large datasets.
 * Variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// Pagination configuration interface
export interface PaginationConfig {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPageSelector?: boolean;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  itemsPerPageOptions?: number[];
  className?: string;
}

// Hook for managing pagination state
export function usePagination(totalItems: number, initialItemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);

  const changeItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    // Adjust current page to maintain roughly the same position
    const currentStartIndex = (currentPage - 1) * itemsPerPage;
    const newPage = Math.floor(currentStartIndex / newItemsPerPage) + 1;
    setCurrentPage(newPage);
  };

  // Get paginated slice of data
  const getPaginatedData = <T,>(data: T[]): T[] => {
    return data.slice(startIndex, endIndex);
  };

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changeItemsPerPage,
    getPaginatedData,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

// Traditional pagination component
export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPageSelector = true,
  showPageNumbers = true,
  maxPageNumbers = 5,
  itemsPerPageOptions = [10, 20, 50, 100],
  className = '',
}: PaginationConfig) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Calculate visible page numbers
  const visiblePages = useMemo(() => {
    if (totalPages <= maxPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxPageNumbers / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxPageNumbers - 1);

    if (end - start + 1 < maxPageNumbers) {
      start = Math.max(1, end - maxPageNumbers + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxPageNumbers]);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between space-x-4 ${className}`}>
      {/* Items per page selector */}
      {showItemsPerPageSelector && onItemsPerPageChange && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Show:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      )}

      {/* Page info */}
      <div className="text-sm text-gray-600">
        Showing {startIndex + 1} to {endIndex} of {totalItems} items
      </div>

      {/* Page navigation */}
      <div className="flex items-center space-x-2">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        {showPageNumbers && (
          <div className="flex items-center space-x-1">
            {visiblePages.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
        )}

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Load More pagination component (like audit page)
export interface LoadMorePaginationProps {
  totalItems: number;
  displayedItems: number;
  onLoadMore: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  className?: string;
}

export function LoadMorePagination({
  totalItems,
  displayedItems,
  onLoadMore,
  isLoading = false,
  hasMore = true,
  className = '',
}: LoadMorePaginationProps) {
  if (displayedItems >= totalItems || !hasMore) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-sm text-gray-600">
          Showing all {totalItems} items
        </p>
      </div>
    );
  }

  return (
    <div className={`text-center py-4 space-y-2 ${className}`}>
      <p className="text-sm text-gray-600">
        Showing {displayedItems} of {totalItems} items
      </p>
      <Button
        onClick={onLoadMore}
        disabled={isLoading}
        variant="outline"
        className="min-w-32"
      >
        {isLoading ? 'Loading...' : 'Load More'}
      </Button>
    </div>
  );
}
