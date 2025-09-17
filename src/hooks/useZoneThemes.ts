'use client';

import { useState, useEffect, useCallback } from 'react';

interface Theme {
  _id: string;
  name: string;
  zone_count?: number;
}

interface UseZoneThemesReturn {
  themesByZone: Map<number, Theme[]>;
  isLoading: boolean;
  error: string | null;
  fetchThemesForZones: (zoneIds: number[]) => Promise<void>;
}

export function useZoneThemes(initialZoneIds: number[] = []): UseZoneThemesReturn {
  const [themesByZone, setThemesByZone] = useState<Map<number, Theme[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThemesForZones = useCallback(async (zoneIds: number[]) => {
    if (zoneIds.length === 0) {
      setThemesByZone(new Map());
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/themes/by-zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zone_ids: zoneIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch themes for zones');
      }

      const data = await response.json();
      const themesMap = new Map<number, Theme[]>();
      
      // Convert the response object back to a Map
      Object.entries(data.themes_by_zone).forEach(([zoneId, themes]) => {
        themesMap.set(Number(zoneId), themes as Theme[]);
      });
      
      setThemesByZone(themesMap);
    } catch (err) {
      console.error('Error fetching themes for zones:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch themes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialZoneIds.length > 0) {
      fetchThemesForZones(initialZoneIds);
    }
  }, [initialZoneIds, fetchThemesForZones]);

  return {
    themesByZone,
    isLoading,
    error,
    fetchThemesForZones,
  };
}
