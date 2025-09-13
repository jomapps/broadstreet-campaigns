'use client';

import { useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Square, Filter } from 'lucide-react';

type AdvertisementLean = {
  _id: string;
  __v: number;
  id: number;
  name: string;
  updated_at: string;
  type: string;
  advertiser: string;
  active: {
    url?: string | null;
  };
  active_placement: boolean;
  preview_url: string;
  createdAt: string;
  updatedAt: string;
};

interface AdvertisementSelectionControlsProps {
  advertisements: AdvertisementLean[];
  selectedAdvertisements: string[];
  showOnlySelectedAds: boolean;
}

export default function AdvertisementSelectionControls({ 
  advertisements, 
  selectedAdvertisements, 
  showOnlySelectedAds 
}: AdvertisementSelectionControlsProps) {
  const { 
    selectAdvertisements, 
    deselectAdvertisements, 
    setShowOnlySelectedAds 
  } = useFilters();
  const entities = useSelectedEntities();

  // The advertisements prop now contains the filtered advertisements from AdvertisementFiltersWrapper
  const visibleAdvertisements = advertisements;

  // Get currently selected advertisements that are visible
  const visibleSelectedAdvertisements = useMemo(() => {
    return visibleAdvertisements.filter(ad => selectedAdvertisements.includes(ad._id));
  }, [visibleAdvertisements, selectedAdvertisements]);

  // Get all visible advertisement IDs
  const visibleAdvertisementIds = visibleAdvertisements.map(ad => ad._id);

  // Check if all visible advertisements are selected
  const allVisibleSelected = visibleAdvertisementIds.length > 0 && visibleAdvertisementIds.every(id => selectedAdvertisements.includes(id));

  // Handle select all visible advertisements
  const handleSelectAll = () => {
    selectAdvertisements(visibleAdvertisementIds);
  };

  // Handle deselect all visible advertisements
  const handleDeselectAll = () => {
    deselectAdvertisements(visibleAdvertisementIds);
  };

  // Handle toggle only selected filter
  const handleToggleOnlySelected = () => {
    setShowOnlySelectedAds(!showOnlySelectedAds);
  };

  // Only show selection controls when both network and advertiser are selected
  // We can't cross-select ads from different advertisers
  if (!entities.network || !entities.advertiser) {
    return null;
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advertisement Selection
            </CardTitle>
            <CardDescription>
              Select advertisements for placement operations
            </CardDescription>
          </div>
          {selectedAdvertisements.length > 0 && (
            <Badge variant="outline" className="text-sm">
              {selectedAdvertisements.length} selected
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
            disabled={visibleAdvertisements.length === 0}
            className="flex items-center gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            Select All Visible
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={visibleSelectedAdvertisements.length === 0}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Deselect All Visible
          </Button>
        </div>

        {/* Only Selected Toggle */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="only-selected-ads"
            checked={showOnlySelectedAds}
            onCheckedChange={handleToggleOnlySelected}
            disabled={selectedAdvertisements.length === 0}
          />
          <label
            htmlFor="only-selected-ads"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show only selected advertisements
            {selectedAdvertisements.length === 0 && (
              <span className="text-gray-400 ml-1">(select advertisements first)</span>
            )}
          </label>
        </div>

        {/* Selection Summary */}
        {selectedAdvertisements.length > 0 && (
          <div className="text-sm text-gray-600">
            <p>
              <strong>{selectedAdvertisements.length}</strong> advertisements selected total
              {visibleSelectedAdvertisements.length > 0 && (
                <span> ({visibleSelectedAdvertisements.length} visible)</span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
