/**
 * THEMES CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the themes content. Follows the server-client pattern
 * established in Phase 2 and Phase 3 (Dashboard, Networks, Advertisers, Zones, Campaigns, Advertisements, Placements).
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
import { useEntityStore, useFilterStore, ThemeEntity } from '@/stores';
import ThemesContent from './ThemesContent';

/**
 * Props interface for ThemesClient
 * Variable names follow docs/variable-origins.md registry
 */
interface ThemesClientProps {
  initialThemes: ThemeEntity[];
  searchParams: Record<string, string | string[] | undefined>;
}

/**
 * ThemesClient - Initializes Zustand stores and renders themes content
 * Variable names follow docs/variable-origins.md registry
 */
export default function ThemesClient({ 
  initialThemes,
  searchParams 
}: ThemesClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { setThemes } = useEntityStore();
  const { setFiltersFromParams } = useFilterStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Set entities using exact variable names from registry
    setThemes(initialThemes);
    
    // Set filters from URL parameters if provided
    if (searchParams && Object.keys(searchParams).length > 0) {
      setFiltersFromParams(searchParams);
    }
  }, [
    initialThemes,
    searchParams,
    setThemes,
    setFiltersFromParams
  ]);
  
  // Render the themes content component
  // The content will read from Zustand stores instead of props
  return <ThemesContent />;
}
