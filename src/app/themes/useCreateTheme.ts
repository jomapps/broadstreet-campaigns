/**
 * CUSTOM HOOK FOR THEME CREATION - SHARED LOGIC
 * 
 * Extracts theme creation logic to avoid duplication between ThemesContent and ThemesList.
 * Provides consistent error handling and post-creation behavior.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseCreateThemeOptions {
  postCreateBehavior?: 'refresh' | 'reload';
}

interface UseCreateThemeReturn {
  createTheme: (name: string, description?: string, zoneIds?: number[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for theme creation with shared logic
 * @param options - Configuration options for post-creation behavior
 * @returns Object with createTheme function and state
 */
export function useCreateTheme(options: UseCreateThemeOptions = {}): UseCreateThemeReturn {
  const { postCreateBehavior = 'refresh' } = options;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTheme = async (name: string, description?: string, zoneIds?: number[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description?.trim() || undefined,
          zone_ids: zoneIds || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create theme');
      }

      // Handle post-creation behavior
      if (postCreateBehavior === 'refresh') {
        router.refresh();
      } else if (postCreateBehavior === 'reload') {
        window.location.reload();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error creating theme:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createTheme,
    isLoading,
    error,
  };
}
