'use client';

import { useState } from 'react';
import ZoneSizeFilters from './ZoneSizeFilters';
import ZonesList from './ZonesList';

type ZoneLean = {
  _id: string;
  __v: number;
  id?: number;
  name: string;
  network_id: number;
  alias?: string | null;
  self_serve: boolean;
  size_type?: 'SQ' | 'PT' | 'LS' | null;
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

interface ZoneFiltersWrapperProps {
  zones: ZoneLean[];
  networkMap: Map<number, string>;
}

export default function ZoneFiltersWrapper({ zones, networkMap }: ZoneFiltersWrapperProps) {
  const [selectedSizes, setSelectedSizes] = useState<('SQ' | 'PT' | 'LS')[]>([]);

  return (
    <div className="space-y-6">
      <ZoneSizeFilters 
        selectedSizes={selectedSizes}
        onSizeFilterChange={setSelectedSizes}
      />
      
      <ZonesList 
        zones={zones} 
        networkMap={networkMap}
        selectedSizes={selectedSizes}
        onSizeFilterChange={setSelectedSizes}
      />
    </div>
  );
}
