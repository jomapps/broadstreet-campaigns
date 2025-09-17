'use client';

import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Square, Filter } from 'lucide-react';
import AddToThemeModal from '@/components/themes/AddToThemeModal';
import { ZoneLean } from '@/lib/types/lean-entities';
import { getEntityId, isEntitySynced } from '@/lib/utils/entity-helpers';

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

  // Helper: derive selection key using standardized utility
  const zoneSelectionKey = (zone: ZoneLean) => {
    const entityId = getEntityId(zone);
    return typeof entityId === 'number' ? String(entityId) : entityId || zone._id;
  };

  // Get currently selected zones that are visible
  const visibleSelectedZones = useMemo(() => {
    return visibleZones.filter(zone => selectedZones.includes(zoneSelectionKey(zone)));
  }, [visibleZones, selectedZones]);

  // Get all visible zone IDs (prefer numeric Broadstreet ids as strings)
  const visibleZoneIds = visibleZones.map(zone => zoneSelectionKey(zone));

  // Check if all visible zones are selected
  const allVisibleSelected = visibleZoneIds.length > 0 && visibleZoneIds.every(zoneId => selectedZones.includes(zoneId));

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

  // Get synced zone IDs for theme operations using standardized utility
  const syncedSelectedZoneIds = useMemo(() => {
    return visibleSelectedZones
      .filter(zone => isEntitySynced(zone) && zone.synced_with_api)
      .map(zone => zone.broadstreet_id!)
      .filter(broadstreetId => broadstreetId != null);
  }, [visibleSelectedZones]);

  // Handle adding zones to themes
  const handleAddToThemes = async (themeIds: string[], zoneIds: number[]) => {
    try {
      const promises = themeIds.map(themeId =>
        fetch(`/api/themes/${themeId}/zones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ zone_ids: zoneIds }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Check for errors
      const errors = results.filter((result, index) => !responses[index].ok);
      if (errors.length > 0) {
        throw new Error(`Failed to add zones to ${errors.length} theme(s)`);
      }

      // Show success message
      const totalAdded = results.reduce((sum, result) => sum + (result.added_zones?.length || 0), 0);
      alert(`Successfully added ${totalAdded} zone assignments to ${themeIds.length} theme(s)`);

      // Optionally refresh the page to show updated theme badges
      window.location.reload();
    } catch (error) {
      console.error('Error adding zones to themes:', error);
      alert('Failed to add zones to themes. Please try again.');
      throw error;
    }
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
        <div className="flex items-center gap-3 flex-wrap">
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

          <AddToThemeModal
            selectedZoneIds={syncedSelectedZoneIds}
            onAddToThemes={handleAddToThemes}
            disabled={syncedSelectedZoneIds.length === 0}
          />
        </div>

        {/* Theme operation info */}
        {selectedZones.length > 0 && syncedSelectedZoneIds.length !== selectedZones.length && (
          <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            <strong>Note:</strong> Only {syncedSelectedZoneIds.length} of {selectedZones.length} selected zones can be added to themes (synced zones only).
          </div>
        )}

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
