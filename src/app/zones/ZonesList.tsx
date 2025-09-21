'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAllFilters, useFilterActions } from '@/stores';
import { DualSearchInput } from '@/components/ui/dual-search-input';
import { getSizeInfo, hasMultipleSizeTypes } from '@/lib/utils/zone-parser';
import { ThemeBadges } from '@/components/themes/ThemeBadge';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { useZoneThemes } from '@/hooks/useZoneThemes';
import { ZoneLean } from '@/lib/types/lean-entities';
import { EntityIdBadge } from '@/components/ui/entity-id-badge';
import { getEntityId } from '@/lib/utils/entity-helpers';

// Map zone to universal card props
function mapZoneToUniversalProps(
  zone: ZoneLean,
  params: {
    networkName?: string;
    isSelected: boolean;
    onToggleSelection?: (zoneId: string) => void;
    themes?: Array<{ _id: string; name: string; zone_count?: number }>;
  }
) {
  const sizeInfo = zone.size_type ? getSizeInfo(zone.size_type) : null;
  const isLocalZone = zone.source === 'local' || zone.created_locally;
  const isConflictZone = hasMultipleSizeTypes(zone.name);

  const parentsBreadcrumb = [
    params.networkName && { name: params.networkName, entityType: 'network' as const },
    { name: 'Zone', entityType: 'zone' as const },
  ].filter(Boolean) as any[];

  const displayData = [
    zone.alias ? { label: 'Alias', value: zone.alias, type: 'string' as const } : null,
    zone.category ? { label: 'Category', value: zone.category, type: 'string' as const } : null,
    zone.block ? { label: 'Block', value: zone.block, type: 'string' as const } : null,
  ].filter(Boolean) as any[];

  if (sizeInfo && !isConflictZone) {
    displayData.push({ label: 'Dimensions', value: `${sizeInfo.dimensions}px`, type: 'string' as const });
  }

  if (zone.self_serve) displayData.push({ label: 'Self Serve', value: 'Yes', type: 'badge' as const });
  if (zone.is_home) displayData.push({ label: 'Home Page', value: 'Yes', type: 'badge' as const });

  return {
    title: zone.name,
    broadstreet_id: zone.broadstreet_id,
    mongo_id: zone.mongo_id || (zone as any)._id,
    entityType: 'zone' as const,
    showCheckbox: true,
    isSelected: params.isSelected,
    onSelect: (checked: boolean) => params.onToggleSelection?.(String(zone.broadstreet_id ?? (zone as any)._id)),
    onCardClick: () => params.onToggleSelection?.(String(zone.broadstreet_id ?? (zone as any)._id)),
    statusBadge: isConflictZone ? { label: 'Conflict Size', variant: 'destructive' as const } : undefined,
    topTags: zone.size_type && !isConflictZone ? [{ label: `${zone.size_type}${zone.size_number ? ` ${zone.size_number}` : ''}`, variant: 'secondary' as const }] : [],
    parentsBreadcrumb,
    displayData,
    bottomTags: params.themes && params.themes.length > 0 ? params.themes.slice(0, 2).map(t => ({ label: t.name, variant: 'outline' as const })) : [],
  };
}

interface ZonesListProps {
  zones: ZoneLean[];
  networkMap: Map<number, string>;
  selectedSizes?: ('SQ' | 'PT' | 'LS' | 'CS')[];
  onSizeFilterChange?: (sizes: ('SQ' | 'PT' | 'LS' | 'CS')[]) => void;
  selectedZones?: string[];
  showOnlySelected?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  negativeSearchTerm?: string;
  onNegativeSearchChange?: (term: string) => void;
  filteredZones?: ZoneLean[];
}

export default function ZonesList({
  zones,
  networkMap,
  selectedSizes = [],
  selectedZones = [],
  showOnlySelected = false,
  searchTerm = '',
  onSearchChange,
  negativeSearchTerm = '',
  onNegativeSearchChange,
  filteredZones
}: ZonesListProps) {
  const { selectedNetwork, selectedAdvertiser } = useAllFilters();
  const { toggleZoneSelection } = useFilterActions();

  // Use filtered zones if provided, otherwise fall back to local filtering
  const displayZones = filteredZones || zones;

  // Get zone IDs for theme fetching (only synced zones)
  const syncedZoneIds = useMemo(() => {
    return displayZones
      .filter(zone => zone.broadstreet_id && (zone.source === 'api' || !zone.created_locally))
      .map(zone => zone.broadstreet_id!)
      .filter(broadstreetId => broadstreetId != null);
  }, [displayZones]);

  // Fetch themes for zones
  const { themesByZone } = useZoneThemes(syncedZoneIds);

  // Check if network is selected
  if (!selectedNetwork) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="card-title text-yellow-800 mb-2">Network Required</h3>
          <p className="card-text text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view zones.
          </p>
          <p className="card-text text-yellow-600">
            Zones are specific to each network, so you need to choose which network&apos;s zones you want to see.
          </p>
        </div>
      </div>
    );
  }

  if (!zones || zones.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="card-text text-gray-500">No zones found for the selected network. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="zones-list">
      <div className="max-w-md">
        <DualSearchInput
          searchPlaceholder="Search zones..."
          searchValue={searchTerm}
          onSearchChange={onSearchChange || (() => {})}
          negativeSearchPlaceholder="Exclude zones containing..."
          negativeSearchValue={negativeSearchTerm}
          onNegativeSearchChange={onNegativeSearchChange || (() => {})}
        />
      </div>
      
      {displayZones.length === 0 ? (
        <div className="text-center py-12">
          <p className="card-text text-gray-500">No zones match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayZones.map((zone) => {
            const entityId = getEntityId(zone);
            const selectionKey = String(entityId || zone._id);
            return (
              <UniversalEntityCard
                key={selectionKey}
                {...mapZoneToUniversalProps(zone, {
                  networkName: networkMap.get(zone.network_id),
                  isSelected: selectedZones.includes(selectionKey),
                  onToggleSelection: toggleZoneSelection,
                  themes: zone.broadstreet_id ? themesByZone.get(zone.broadstreet_id) || [] : [],
                })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
