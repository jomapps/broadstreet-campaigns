'use client';

import { useState, useMemo } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { isEntitySynced } from '@/lib/utils/entity-helpers';

// Client-side version of isLocalEntity using centralized utility
function isLocalEntity(entity: any): boolean {
  return !isEntitySynced(entity);
}

// Type for enriched placement data
type PlacementLean = {
  _id: string;
  __v: number;
  advertisement_id: number | string;
  zone_id: number | string;
  campaign_id: number | string;
  zone_mongo_id?: string;  // For local zones
  campaign_mongo_id?: string;  // For local campaigns
  restrictions?: string[];
  createdAt: string;
  updatedAt: string;
  source?: 'local_collection' | 'local_embedded' | 'synced_embedded';  // Source identification
  advertisement?: {
    broadstreet_id: number;  // Always present - synced entity
    mongo_id: string;        // Also has mongo_id from local DB storage
    name: string;
    type: string;
    preview_url: string;     // Always present - 100% have image
  } | null;
  campaign?: {
    broadstreet_id?: number;
    mongo_id?: string;
    name: string;
    start_date: string;
    end_date?: string;
    active: boolean;
  } | null;
  zone?: {
    broadstreet_id?: number;
    mongo_id?: string;
    name: string;
    alias?: string | null;
    size_type?: 'SQ' | 'PT' | 'LS' | null;
    size_number?: number | null;
  } | null;
  advertiser?: {
    broadstreet_id?: number;
    mongo_id?: string;
    name: string;
  } | null;
  network?: {
    broadstreet_id: number;  // Always present - synced entity
    mongo_id: string;        // Also has mongo_id from local DB storage
    name: string;
  } | null;
};

// Map placement to universal card props
function mapPlacementToUniversalProps(
  placement: PlacementLean,
  params: {
    onDelete: (p: PlacementLean) => void;
    deletingIds: Set<string>;
  }
) {
  const startDate = placement.campaign?.start_date ? new Date(placement.campaign.start_date) : undefined;
  const endDate = placement.campaign?.end_date ? new Date(placement.campaign.end_date) : undefined;
  const now = new Date();
  const isActive = !!(placement.campaign?.active && startDate && startDate <= now && (!endDate || endDate >= now));

  const isLocalCampaign = placement.campaign ? isLocalEntity(placement.campaign) : false;
  const isLocalZone = placement.zone ? isLocalEntity(placement.zone) : false;
  const hasLocalZoneId = !!placement.zone_mongo_id;
  const hasLocalCampaignId = !!placement.campaign_mongo_id;
  const isLocalPlacement = placement.source === 'local_collection' || placement.source === 'local_embedded';
  const isLocal = isLocalCampaign || isLocalZone || hasLocalZoneId || hasLocalCampaignId || isLocalPlacement;

  const placementId = `${placement.advertisement_id}-${placement.zone_id || placement.zone_mongo_id || ''}`;
  const isDeleting = params.deletingIds.has(placementId);

  const parentsBreadcrumb = [
    placement.campaign && {
      name: placement.campaign.name,
      broadstreet_id: placement.campaign.broadstreet_id,
      mongo_id: placement.campaign.mongo_id,
    },
    placement.advertisement && {
      name: placement.advertisement.name,
      broadstreet_id: placement.advertisement.broadstreet_id,
      mongo_id: placement.advertisement.mongo_id,
      entityType: 'advertisement' as const,
    },
    placement.zone && {
      name: placement.zone.name,
      broadstreet_id: placement.zone.broadstreet_id,
      mongo_id: placement.zone.mongo_id,
      entityType: 'zone' as const,
    },
  ].filter(Boolean) as any[];

  const displayData = [
    { label: 'Campaign', value: placement.campaign?.name ?? (placement.campaign_id ?? ''), type: 'string' as const },
    { label: 'Advertisement', value: placement.advertisement?.name ?? String(placement.advertisement_id), type: 'string' as const },
    { label: 'Zone', value: placement.zone?.name ?? (hasLocalZoneId ? `…${String(placement.zone_mongo_id).slice(-8)}` : String(placement.zone_id)), type: 'string' as const },
  ] as any[];

  if (startDate) displayData.push({ label: 'Start', value: startDate, type: 'date' as const });
  if (endDate) displayData.push({ label: 'End', value: endDate, type: 'date' as const });

  return {
    title: placement.advertisement?.name || `Advertisement ${placement.advertisement_id}`,
    broadstreet_id: placement.advertisement?.broadstreet_id,
    mongo_id: placement.advertisement?.mongo_id,
    entityType: 'placement' as const,
    imageUrl: placement.advertisement?.preview_url,
    statusBadge: isActive ? { label: 'Active', variant: 'success' as const } : { label: 'Inactive', variant: 'secondary' as const },
    topTags: placement.advertisement?.type ? [{ label: placement.advertisement.type, variant: 'secondary' as const }] : [],
    parentsBreadcrumb,
    displayData,
    isLocal,
    onDelete: isLocal ? () => params.onDelete(placement) : undefined,
  };
}

interface PlacementsListProps {
  placements: PlacementLean[];
  entities?: {
    network: { ids: { broadstreet_id?: number; mongo_id?: string }; id: number | string; name: string } | null;
    advertiser: { ids: { broadstreet_id?: number; mongo_id?: string }; id: number | string; name: string } | null;
    campaign: { ids: { broadstreet_id?: number; mongo_id?: string }; id: number | string; name: string } | null;
    zones: Array<{ ids: { broadstreet_id?: number; mongo_id?: string }; id: number | string; name: string }>;
    advertisements: Array<{ ids: { broadstreet_id?: number; mongo_id?: string }; id: number | string; name: string }>;
  };
}

export default function PlacementsList({ placements: initialPlacements, entities }: PlacementsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [placements, setPlacements] = useState(initialPlacements);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Delete placement function
  const handleDeletePlacement = async (placement: PlacementLean) => {
    const placementId = `${placement.advertisement_id}-${placement.zone_id || (placement as any).zone_mongo_id || ''}`;

    if (deletingIds.has(placementId)) return; // Prevent double-clicks

    setDeletingIds(prev => new Set(prev).add(placementId));

    try {
      const response = await fetch('/api/placements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_mongo_id: (placement as any).campaign_mongo_id,
          advertisement_id: placement.advertisement_id,
          zone_id: placement.zone_id,
          zone_mongo_id: (placement as any).zone_mongo_id
        })
      });

      if (response.ok) {
        // Remove from local state
        setPlacements(prev => prev.filter(p => {
          const pId = `${p.advertisement_id}-${p.zone_id || (p as any).zone_mongo_id || ''}`;
          return pId !== placementId;
        }));
      } else {
        console.error('Failed to delete placement');
        alert('Failed to delete placement. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting placement:', error);
      alert('Error deleting placement. Please try again.');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(placementId);
        return newSet;
      });
    }
  };

  const filteredPlacements = useMemo(() => {
    if (!searchTerm.trim()) {
      return placements;
    }
    
    return placements.filter(placement =>
      placement.advertisement?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.campaign?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.zone?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.advertiser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.network?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (placement.advertisement_id && placement.advertisement_id.toString().includes(searchTerm)) ||
      (placement.zone_id && placement.zone_id.toString().includes(searchTerm)) ||
      (placement.campaign_id && placement.campaign_id.toString().includes(searchTerm)) ||
      ((placement as any).zone_mongo_id && (placement as any).zone_mongo_id.toString().includes(searchTerm)) ||
      ((placement as any).campaign_mongo_id && (placement as any).campaign_mongo_id.toString().includes(searchTerm)) ||
      (placement.restrictions && placement.restrictions.some(r =>
        r.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }, [placements, searchTerm]);

  if (placements.length === 0) {
    const filterDetails = [];

    if (entities?.network) {
      filterDetails.push(`Network: ${entities.network.name} (ID: ${entities.network.ids.broadstreet_id || entities.network.ids.mongo_id})`);
    }

    if (entities?.advertiser) {
      filterDetails.push(`Advertiser: ${entities.advertiser.name} (ID: ${entities.advertiser.ids.broadstreet_id || entities.advertiser.ids.mongo_id})`);
    }

    if (entities?.campaign) {
      filterDetails.push(`Campaign: ${entities.campaign.name} (ID: ${entities.campaign.ids.broadstreet_id || entities.campaign.ids.mongo_id})`);
    }

    if (entities?.zones && entities.zones.length > 0) {
      filterDetails.push(`Zones: ${entities.zones.length} selected`);
    }

    if (entities?.advertisements && entities.advertisements.length > 0) {
      filterDetails.push(`Advertisements: ${entities.advertisements.length} selected`);
    }

    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="card-title text-blue-800 mb-3">No Placements Found</h3>
          <p className="card-text text-blue-700 mb-4">
            No placements match the current filter criteria.
          </p>
          {filterDetails.length > 0 && (
            <div className="text-left">
              <p className="card-text text-blue-600 font-medium mb-2">Current Filters:</p>
              <ul className="card-text text-blue-600 space-y-1">
                {filterDetails.map((detail, index) => (
                  <li key={index} className="text-sm">• {detail}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="card-text text-blue-500 text-sm mt-4">
            Try adjusting your filters or check if placements exist for these criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-md" data-testid="search-input">
        <SearchInput
          placeholder="Search placements..."
          value={searchTerm}
          onChange={setSearchTerm}
          className=""
        />
      </div>
      
      {filteredPlacements.length === 0 ? (
        <div className="text-center py-12">
          <p className="card-text text-gray-500">No placements match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="placements-list">
          {filteredPlacements.map((placement) => (
            <UniversalEntityCard
              key={`${placement.advertisement_id}-${placement.zone_id}-${placement.campaign_id}`}
              {...mapPlacementToUniversalProps(placement, { onDelete: handleDeletePlacement, deletingIds })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

