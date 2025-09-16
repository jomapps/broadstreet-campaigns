'use client';

import { useState, useEffect, useCallback } from 'react';

interface Theme {
  _id: string;
  mongo_id: string;
  name: string;
  description?: string;
  zone_ids: number[];
  zone_count: number;
  createdAt: string;
  updatedAt: string;
}

interface UseThemesReturn {
  themes: Theme[];
  isLoading: boolean;
  error: string | null;
  createTheme: (name: string, description?: string) => Promise<void>;
  updateTheme: (themeId: string, name: string, description?: string) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;
  cloneTheme: (themeId: string, newName: string) => Promise<void>;
  refreshThemes: () => Promise<void>;
}

export function useThemes(): UseThemesReturn {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThemes = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/themes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch themes');
      }
      
      const data = await response.json();
      setThemes(data.themes || []);
    } catch (err) {
      console.error('Error fetching themes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch themes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTheme = useCallback(async (name: string, description?: string) => {
    try {
      setError(null);
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create theme');
      }

      const data = await response.json();
      setThemes(prev => [data.theme, ...prev]);
    } catch (err) {
      console.error('Error creating theme:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create theme';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateTheme = useCallback(async (themeId: string, name: string, description?: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/themes/${themeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update theme');
      }

      const data = await response.json();
      setThemes(prev => prev.map(theme => 
        theme._id === themeId ? data.theme : theme
      ));
    } catch (err) {
      console.error('Error updating theme:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update theme';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteTheme = useCallback(async (themeId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/themes/${themeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete theme');
      }

      setThemes(prev => prev.filter(theme => theme._id !== themeId));
    } catch (err) {
      console.error('Error deleting theme:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete theme';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const cloneTheme = useCallback(async (themeId: string, newName: string) => {
    try {
      setError(null);
      // First get the original theme
      const originalTheme = themes.find(t => t._id === themeId);
      if (!originalTheme) {
        throw new Error('Theme not found');
      }

      // Create new theme with same zone_ids
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: newName, 
          description: originalTheme.description ? `Copy of ${originalTheme.description}` : undefined,
          zone_ids: originalTheme.zone_ids 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clone theme');
      }

      const data = await response.json();
      setThemes(prev => [data.theme, ...prev]);
    } catch (err) {
      console.error('Error cloning theme:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to clone theme';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [themes]);

  const refreshThemes = useCallback(async () => {
    setIsLoading(true);
    await fetchThemes();
  }, [fetchThemes]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  return {
    themes,
    isLoading,
    error,
    createTheme,
    updateTheme,
    deleteTheme,
    cloneTheme,
    refreshThemes,
  };
}
