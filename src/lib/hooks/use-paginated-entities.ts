/**
 * PAGINATED ENTITIES HOOK
 * 
 * Custom hook for managing pagination of entity sections in LocalOnlyDashboard.
 * Provides client-side pagination while maintaining full dataset operations
 * (filtering, searching, selection) across all entities.
 * Variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState, useMemo } from 'react';

// Configuration for paginated entity sections
export interface PaginatedEntityConfig {
  itemsPerPage?: number;
  enablePagination?: boolean;
}

// Return type for the hook
export interface PaginatedEntityResult<T> {
  // Pagination state
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
  
  // Displayed data (paginated)
  displayedItems: T[];
  startIndex: number;
  endIndex: number;
  
  // Pagination controls
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  changeItemsPerPage: (newItemsPerPage: number) => void;
  
  // State helpers
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  
  // Pagination info
  paginationInfo: {
    showing: string;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Hook for managing paginated entity display
 * @param entities - Full array of entities (all operations work on this)
 * @param config - Pagination configuration
 */
export function usePaginatedEntities<T>(
  entities: T[],
  config: PaginatedEntityConfig = {}
): PaginatedEntityResult<T> {
  const {
    itemsPerPage: initialItemsPerPage = 20,
    enablePagination = true,
  } = config;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Calculate pagination values
  const totalItems = entities.length;
  const totalPages = enablePagination ? Math.ceil(totalItems / itemsPerPage) : 1;
  const startIndex = enablePagination ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = enablePagination ? Math.min(startIndex + itemsPerPage, totalItems) : totalItems;

  // Get displayed items (paginated slice)
  const displayedItems = useMemo(() => {
    if (!enablePagination) {
      return entities;
    }
    return entities.slice(startIndex, endIndex);
  }, [entities, startIndex, endIndex, enablePagination]);

  // Navigation functions
  const goToPage = (page: number) => {
    if (!enablePagination) return;
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);

  const changeItemsPerPage = (newItemsPerPage: number) => {
    if (!enablePagination) return;
    setItemsPerPage(newItemsPerPage);
    // Adjust current page to maintain roughly the same position
    const currentStartIndex = (currentPage - 1) * itemsPerPage;
    const newPage = Math.floor(currentStartIndex / newItemsPerPage) + 1;
    setCurrentPage(Math.max(1, Math.min(newPage, Math.ceil(totalItems / newItemsPerPage))));
  };

  // State helpers
  const hasNextPage = enablePagination && currentPage < totalPages;
  const hasPreviousPage = enablePagination && currentPage > 1;
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Pagination info for display
  const paginationInfo = useMemo(() => {
    if (!enablePagination || totalItems === 0) {
      return {
        showing: `${totalItems} items`,
        total: totalItems,
        hasMore: false,
      };
    }

    const showing = totalItems <= itemsPerPage 
      ? `${totalItems} items`
      : `${startIndex + 1}-${endIndex} of ${totalItems} items`;

    return {
      showing,
      total: totalItems,
      hasMore: endIndex < totalItems,
    };
  }, [enablePagination, totalItems, itemsPerPage, startIndex, endIndex]);

  return {
    // Pagination state
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    
    // Displayed data
    displayedItems,
    startIndex,
    endIndex,
    
    // Pagination controls
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changeItemsPerPage,
    
    // State helpers
    hasNextPage,
    hasPreviousPage,
    isFirstPage,
    isLastPage,
    
    // Pagination info
    paginationInfo,
  };
}

/**
 * Hook for managing multiple paginated entity sections
 * Useful for LocalOnlyDashboard with multiple entity types
 */
export function useMultiplePaginatedEntities<T extends Record<string, any[]>>(
  entitiesByType: T,
  config: Record<keyof T, PaginatedEntityConfig> = {} as Record<keyof T, PaginatedEntityConfig>
): Record<keyof T, PaginatedEntityResult<T[keyof T][0]>> {
  const results = {} as Record<keyof T, PaginatedEntityResult<T[keyof T][0]>>;

  for (const [entityType, entities] of Object.entries(entitiesByType)) {
    const entityConfig = config[entityType as keyof T] || {};
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[entityType as keyof T] = usePaginatedEntities(entities, entityConfig);
  }

  return results;
}

/**
 * Default pagination configurations for different entity types
 * Based on typical usage patterns and performance considerations
 */
export const DEFAULT_PAGINATION_CONFIGS = {
  zones: { itemsPerPage: 20, enablePagination: true },
  advertisers: { itemsPerPage: 20, enablePagination: true },
  campaigns: { itemsPerPage: 20, enablePagination: true },
  networks: { itemsPerPage: 10, enablePagination: true }, // Usually fewer networks
  advertisements: { itemsPerPage: 20, enablePagination: true },
  placements: { itemsPerPage: 20, enablePagination: true },
} as const;

/**
 * Utility function to get pagination config for entity type
 */
export function getPaginationConfig(
  entityType: string,
  customConfig?: PaginatedEntityConfig
): PaginatedEntityConfig {
  const defaultConfig = DEFAULT_PAGINATION_CONFIGS[entityType as keyof typeof DEFAULT_PAGINATION_CONFIGS] || {
    itemsPerPage: 20,
    enablePagination: true,
  };

  return {
    ...defaultConfig,
    ...customConfig,
  };
}
