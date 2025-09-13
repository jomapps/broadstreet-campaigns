'use client';

import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Square, Filter } from 'lucide-react';

type ZoneLean = {
  _id: string;
  __v: number;
  id?: number;
  name: string;
  network_id: number;
  alias?: string | null;
  self_serve: boolean;
  size_type?: 'SQ' | 'PT' | 'LS' | 'CS' | null;
  size_number?: number | null;
  category?: string | null;
  block?: string | null;
  is_home?: boolean;
  // LocalZone specific fields
  created_locally?: boolean;
  synced_with_api?: boolean;
  created_at?: string;
  synced_at?: string;
  original_broadstreet_id?: number;
  sync_errors?: string[];
  // Additional LocalZone fields
  advertisement_count?: number;
  allow_duplicate_ads?: boolean;
  concurrent_campaigns?: number;
  advertisement_label?: string;
  archived?: boolean;
  display_type?: 'standard' | 'rotation';
  rotation_interval?: number;
  animation_type?: string;
  width?: number;
  height?: number;
  rss_shuffle?: boolean;
  style?: string;
  source?: 'api' | 'local';
  createdAt: string;
  updatedAt: string;
};

interface ZoneSelectionControlsProps {
  zones: ZoneLean[];
  selectedZones: string[];
  showOnlySelected: boolean;
}

export default function ZoneSelectionControls({ zones, selectedZones, showOnlySelected }: ZoneSelectionControlsProps) {
  const { 
    selectZones, 
    deselectZones, 
    setShowOnlySelected 
  } = useFilters();
  const entities = useSelectedEntities();

  // The zones prop now contains the filtered zones from ZoneFiltersWrapper
  const visibleZones = zones;

  // Get currently selected zones that are visible
  const visibleSelectedZones = useMemo(() => {
    return visibleZones.filter(zone => selectedZones.includes(zone._id));
  }, [visibleZones, selectedZones]);

  // Get all visible zone IDs
  const visibleZoneIds = visibleZones.map(zone => zone._id);

  // Check if all visible zones are selected
  const allVisibleSelected = visibleZoneIds.length > 0 && visibleZoneIds.every(id => selectedZones.includes(id));

  // Handle select all visible zones
  const handleSelectAll = () => {
    selectZones(visibleZoneIds);
  };

  // Handle deselect all visible zones
  const handleDeselectAll = () => {
    deselectZones(visibleZoneIds);
  };

  // Handle toggle only selected filter
  const handleToggleOnlySelected = () => {
    setShowOnlySelected(!showOnlySelected);
  };

  if (!entities.network) {
    return null;
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Zone Selection
            </CardTitle>
            <CardDescription>
              Select zones for placement operations
            </CardDescription>
          </div>
          {selectedZones.length > 0 && (
            <Badge variant="outline" className="text-sm">
              {selectedZones.length} selected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={visibleZones.length === 0}
            className="flex items-center gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            Select All Visible
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={visibleSelectedZones.length === 0}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Deselect All Visible
          </Button>
        </div>

        {/* Only Selected Toggle */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="only-selected"
            checked={showOnlySelected}
            onCheckedChange={handleToggleOnlySelected}
            disabled={selectedZones.length === 0}
          />
          <label
            htmlFor="only-selected"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show only selected zones
            {selectedZones.length === 0 && (
              <span className="text-gray-400 ml-1">(select zones first)</span>
            )}
          </label>
        </div>

        {/* Selection Summary */}
        {selectedZones.length > 0 && (
          <div className="text-sm text-gray-600">
            <p>
              <strong>{selectedZones.length}</strong> zones selected total
              {visibleSelectedZones.length > 0 && (
                <span> ({visibleSelectedZones.length} visible)</span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
