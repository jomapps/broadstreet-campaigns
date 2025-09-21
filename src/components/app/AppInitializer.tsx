'use client';

import { useEffect, useRef } from 'react';
import { useFilterActions } from '@/stores';

/**
 * AppInitializer - Handles global app initialization logic
 * 
 * This component runs once when the app starts and handles:
 * - Resetting filters (except network) to prevent stale entity references
 * - Other global initialization tasks
 * 
 * The filter reset is necessary because when the app starts, the sidebar filters
 * might still have references to entities (advertisers, campaigns, advertisements, zones)
 * that no longer exist in the database, causing problems.
 */
export default function AppInitializer() {
  const { clearAllFilters } = useFilterActions();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only run initialization once per app session
    if (hasInitialized.current) {
      return;
    }

    console.log('[AppInitializer] Running app initialization...');
    
    // Reset all filters except network to prevent stale entity references
    // This ensures that when the app starts, we don't have filters pointing
    // to entities that might have been deleted or changed
    clearAllFilters();
    
    console.log('[AppInitializer] Filters reset (network preserved)');
    
    // Mark as initialized
    hasInitialized.current = true;
    
    console.log('[AppInitializer] App initialization complete');
  }, [clearAllFilters]);

  // This component doesn't render anything - it's just for initialization
  return null;
}
