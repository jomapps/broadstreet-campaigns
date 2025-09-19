/**
 * THEME DETAIL CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the theme detail content. Follows the server-client pattern
 * established in Phase 2 and Phase 3.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
import { useEntityStore } from '@/stores';
import ThemeDetailContent from './ThemeDetailContent';

/**
 * Props interface for ThemeDetailClient
 * Variable names follow docs/variable-origins.md registry
 */
interface ThemeDetailClientProps {
  initialTheme: any;
  initialZones: any[];
}

/**
 * ThemeDetailClient - Initializes Zustand stores and renders theme detail content
 * Variable names follow docs/variable-origins.md registry
 */
export default function ThemeDetailClient({ 
  initialTheme,
  initialZones 
}: ThemeDetailClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { setCurrentTheme, setZones } = useEntityStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Set current theme and zones using exact variable names from registry
    setCurrentTheme(initialTheme);
    setZones(initialZones);
  }, [
    initialTheme,
    initialZones,
    setCurrentTheme,
    setZones
  ]);
  
  // Render the theme detail content component
  // The content will read from Zustand stores instead of props
  return <ThemeDetailContent />;
}
