/**
 * Filter Reset Helper Functions
 * 
 * These functions handle clearing filter selections when entities are deleted.
 * According to the requirements, filter selections should be reset whenever we delete
 * entities to prevent stale references to deleted entities.
 */

import { useFilterStore } from '@/stores/filter-store';

/**
 * Reset filters after entity deletion
 * This function clears all filters except network to prevent stale entity references
 * 
 * @param entityType - The type of entity that was deleted (for logging)
 * @param entityId - The ID of the entity that was deleted (for logging)
 */
export function resetFiltersAfterDeletion(entityType?: string, entityId?: string): void {
  try {
    // Get the clearAllFilters function from the store
    const { clearAllFilters } = useFilterStore.getState();
    
    // Clear all filters except network
    clearAllFilters();
    
    if (entityType && entityId) {
      console.log(`[FilterReset] Filters reset after deleting ${entityType} with ID: ${entityId}`);
    } else {
      console.log('[FilterReset] Filters reset after deletion operation');
    }
  } catch (error) {
    console.error('[FilterReset] Error resetting filters after deletion:', error);
  }
}

/**
 * Reset filters after bulk deletion
 * This function clears all filters except network after bulk delete operations
 * 
 * @param entityTypes - Array of entity types that were deleted (for logging)
 * @param totalDeleted - Total number of entities deleted (for logging)
 */
export function resetFiltersAfterBulkDeletion(entityTypes?: string[], totalDeleted?: number): void {
  try {
    // Get the clearAllFilters function from the store
    const { clearAllFilters } = useFilterStore.getState();
    
    // Clear all filters except network
    clearAllFilters();
    
    if (entityTypes && totalDeleted) {
      console.log(`[FilterReset] Filters reset after bulk deletion of ${totalDeleted} entities (${entityTypes.join(', ')})`);
    } else {
      console.log('[FilterReset] Filters reset after bulk deletion operation');
    }
  } catch (error) {
    console.error('[FilterReset] Error resetting filters after bulk deletion:', error);
  }
}

/**
 * Client-side hook for resetting filters after deletion
 * Use this in React components that perform delete operations
 * 
 * @returns Object with reset functions
 */
export function useFilterResetAfterDeletion() {
  return {
    resetFiltersAfterDeletion,
    resetFiltersAfterBulkDeletion,
  };
}
