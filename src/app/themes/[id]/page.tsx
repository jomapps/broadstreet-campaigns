'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { SearchInput } from '@/components/ui/search-input';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

interface Theme {
  _id: string;
  name: string;
  description?: string;
  zone_ids: number[];
  zone_count: number;
  createdAt: string;
  updatedAt: string;
}

interface Zone {
  _id: string;
  broadstreet_id: number;
  name: string;
  network_id: number;
  alias?: string;
  self_serve: boolean;
  size_type?: string;
  category?: string;
  block?: string;
  is_home?: boolean;
}

interface ThemeDetailPageProps {
  params: Promise<{ id: string }>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-200 animate-pulse h-8 w-64 rounded"></div>
      <div className="bg-gray-200 animate-pulse h-4 w-96 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse h-32 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

function ZoneCard({ zone, onRemove }: { zone: Zone; onRemove?: (zoneId: number) => void }) {
  return (
    <UniversalEntityCard
      title={zone.name}
      broadstreet_id={zone.broadstreet_id}
      entityType="zone"
      topTags={zone.size_type ? [{ label: zone.size_type, variant: 'secondary' } ] : []}
      displayData={[
        zone.alias ? { label: 'Alias', value: zone.alias, type: 'string' as const } : undefined,
        zone.category ? { label: 'Category', value: zone.category, type: 'string' as const } : undefined,
      ].filter(Boolean) as any}
      actionButtons={onRemove ? [
        { label: 'Remove', variant: 'destructive', onClick: () => onRemove(zone.broadstreet_id) }
      ] : []}
    />
  );
}

export default function ThemeDetailPage({ params }: ThemeDetailPageProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [themeId, setThemeId] = useState<string>('');

  useEffect(() => {
    params.then(({ id: themeIdParam }) => {
      setThemeId(themeIdParam);
    });
  }, [params]);

  useEffect(() => {
    if (!themeId) return;

    const fetchThemeData = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/themes/${themeId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Theme not found');
          }
          throw new Error('Failed to fetch theme');
        }
        
        const data = await response.json();
        setTheme(data.theme);
        setZones(data.zones || []);
      } catch (err) {
        console.error('Error fetching theme:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch theme');
      } finally {
        setIsLoading(false);
      }
    };

    fetchThemeData();
  }, [themeId]);

  const filteredZones = useMemo(() => {
    if (!searchTerm.trim()) return zones;
    
    const search = searchTerm.toLowerCase();
    return zones.filter(zone => 
      zone.name.toLowerCase().includes(search) ||
      zone.alias?.toLowerCase().includes(search) ||
      zone.category?.toLowerCase().includes(search) ||
      zone.block?.toLowerCase().includes(search)
    );
  }, [zones, searchTerm]);

  const handleRemoveZone = async (zoneId: number) => {
    if (!theme) return;
    
    try {
      const response = await fetch(`/api/themes/${theme._id}/zones`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zone_ids: [zoneId] }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove zone from theme');
      }

      // Update local state
      setZones(prev => prev.filter(zone => zone.broadstreet_id !== zoneId));
      setTheme(prev => prev ? {
        ...prev,
        zone_ids: prev.zone_ids.filter(zoneIdInArray => zoneIdInArray !== zoneId),
        zone_count: prev.zone_count - 1
      } : null);
    } catch (err) {
      console.error('Error removing zone:', err);
      alert('Failed to remove zone from theme. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
          <div className="mt-4 space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
            <Link href="/themes" className="text-blue-600 hover:text-blue-800">
              Back to themes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-500">Theme not found</p>
          <Link href="/themes" className="mt-4 text-blue-600 hover:text-blue-800">
            Back to themes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="text-xl font-bold text-gray-900">{theme.name}</h1>
            {theme.description && (
              <p className="text-gray-600 mt-1">{theme.description}</p>
            )}
          </div>
        </div>
        
        <Badge variant="secondary">
          {theme.zone_count} {theme.zone_count === 1 ? 'zone' : 'zones'}
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
        
        {zones.length > 0 && (
          <div className="text-sm text-gray-500">
            {filteredZones.length} of {zones.length} zones
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
          {filteredZones.map((zone) => (
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
