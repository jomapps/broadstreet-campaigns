/**
 * THEME DETAIL CONTENT - MAIN THEME DETAIL UI
 * 
 * Main theme detail content component that displays theme zones and handles interactions.
 * Reads data from Zustand stores and provides zone management functionality.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEntityStore } from '@/stores';
import { Badge } from '@/components/ui/badge';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { SearchInput } from '@/components/ui/search-input';
import Link from 'next/link';

/**
 * ZoneCard - Individual zone card component
 * Variable names follow docs/variable-origins.md registry
 */
function ZoneCard({ zone, onRemove }: { zone: any; onRemove?: (zoneId: number) => void }) {
  return (
    <UniversalEntityCard
      title={zone.name}
      broadstreet_id={zone.broadstreet_id}
      mongo_id={zone.mongo_id}
      entityType="zone"
      topTags={zone.size_type ? [{ label: zone.size_type, variant: 'secondary' }] : []}
      displayData={[
        zone.alias ? { label: 'Alias', value: zone.alias, type: 'string' as const } : undefined,
        zone.category ? { label: 'Category', value: zone.category, type: 'string' as const } : undefined,
      ].filter(Boolean) as any}
      actionButtons={onRemove ? [
        { label: 'Remove', variant: 'destructive', onClick: () => onRemove(zone.broadstreet_id || zone.mongo_id) }
      ] : []}
    />
  );
}

/**
 * ThemeDetailContent - Main theme detail display component
 * Variable names follow docs/variable-origins.md registry
 */
export default function ThemeDetailContent() {
  // Get data from Zustand stores using exact names from docs/variable-origins.md registry
  const { currentTheme, zones, isLoading } = useEntityStore();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Filter zones based on search term
  const filteredZones = useMemo(() => {
    if (!(currentTheme as any)?.zones) return [];

    if (!searchTerm.trim()) return (currentTheme as any).zones;
    
    const search = searchTerm.toLowerCase();
    return (currentTheme as any).zones.filter((zone: any) =>
      zone.name.toLowerCase().includes(search) ||
      zone.alias?.toLowerCase().includes(search) ||
      zone.category?.toLowerCase().includes(search) ||
      zone.block?.toLowerCase().includes(search)
    );
  }, [(currentTheme as any)?.zones, searchTerm]);

  // Handle zone removal from theme
  const handleRemoveZone = async (zoneId: number) => {
    if (!currentTheme) return;
    
    const confirmed = confirm('Are you sure you want to remove this zone from the theme?');
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/themes/${currentTheme._id}/zones`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zone_ids: [zoneId] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove zone from theme');
      }

      // Refresh the page to show updated theme
      router.refresh();
    } catch (error) {
      console.error('Error removing zone:', error);
      alert('Failed to remove zone from theme. Please try again.');
    }
  };

  if (isLoading.themes || !currentTheme) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const themeZones = (currentTheme as any).zones || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{currentTheme.name}</h1>
          {currentTheme.description && (
            <p className="text-gray-600 mt-1">{currentTheme.description}</p>
          )}
        </div>
        
        <Badge variant="secondary">
          {currentTheme.zone_count || themeZones.length} {(currentTheme.zone_count || themeZones.length) === 1 ? 'zone' : 'zones'}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="max-w-md flex-1">
          <SearchInput
            placeholder="Search zones in this theme..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        
        {themeZones.length > 0 && (
          <div className="text-sm text-gray-500">
            {filteredZones.length} of {themeZones.length} zones
          </div>
        )}
      </div>

      {filteredZones.length === 0 ? (
        <div className="text-center py-12">
          {searchTerm.trim() ? (
            <>
              <p className="text-gray-500 mb-4">No zones match your search.</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">
                No zones in this theme yet. Add zones from the zones page.
              </p>
              <Link 
                href="/zones"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Go to Zones
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredZones.map((zone: any) => (
            <ZoneCard
              key={zone._id}
              zone={zone}
              onRemove={handleRemoveZone}
            />
          ))}
        </div>
      )}
    </div>
  );
}
