'use client';

import { useState, useMemo } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { EntityIdBadge } from '@/components/ui/entity-id-badge';
import { cardStateClasses } from '@/lib/ui/cardStateClasses';

// Client-side version of isLocalEntity to avoid server-side imports
function isLocalEntity(entity: any): boolean {
  if (!entity || typeof entity !== 'object') return false;
  if (entity.created_locally === true) return true;
  const hasMongoId = typeof entity.mongo_id === 'string' || typeof entity._id === 'string';
  const hasBroadstreetId = typeof entity.broadstreet_id === 'number' || typeof entity.original_broadstreet_id === 'number';
  return hasMongoId && !hasBroadstreetId;
}

// Type for enriched placement data
type PlacementLean = {
  _id: string;
  __v: number;
  advertisement_id: number | string;
  zone_id: number | string;
  campaign_id: number | string;
  restrictions?: string[];
  createdAt: string;
  updatedAt: string;
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

interface PlacementCardProps {
  placement: PlacementLean;
  onDelete: (placement: PlacementLean) => void;
  deletingIds: Set<string>;
}

function PlacementCard({ placement, onDelete, deletingIds }: PlacementCardProps) {
  const startDate = placement.campaign?.start_date ? new Date(placement.campaign.start_date) : null;
  const endDate = placement.campaign?.end_date ? new Date(placement.campaign.end_date) : null;
  const now = new Date();

  const isActive = placement.campaign?.active &&
    startDate && startDate <= now &&
    (!endDate || endDate >= now);

  // Determine if any of the related entities are local
  // NOTE: Advertisements and Networks are NEVER local-only - they're always synced entities
  // NOTE: Advertisers are NEVER local if advertisement exists (rule: can't create ads without advertiser)
  const isLocalCampaign = placement.campaign ? isLocalEntity(placement.campaign) : false;
  const isLocalZone = placement.zone ? isLocalEntity(placement.zone) : false;
  const isLocalAdvertiser = false; // Advertisers are NEVER local if advertisement exists

  // Check if zone is local by checking for zone_mongo_id (when zone data is null but zone_mongo_id exists)
  const hasLocalZoneId = !!(placement as any).zone_mongo_id;

  // Consider the placement "local" if any of its key entities are local
  // (excluding advertisements and networks which are never local-only)
  const isLocal = isLocalCampaign || isLocalZone || hasLocalZoneId;

  const placementId = `${placement.advertisement_id}-${placement.zone_id || (placement as any).zone_mongo_id || ''}`;
  const isDeleting = deletingIds.has(placementId);

  return (
    <div
      className={`rounded-lg shadow-sm border-2 overflow-hidden hover:shadow-md transition-all duration-200 relative ${cardStateClasses({ isLocal, isSelected: false })}`}
      data-testid={`placement-card`}
      data-placement-id={`${placement.advertisement_id}-${placement.zone_id}-${placement.campaign_id}`}
    >
      {/* Delete button for local-only placements */}
      {isLocal && (
        <button
          onClick={() => onDelete(placement)}
          disabled={isDeleting}
          className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-200 shadow-sm"
          title="Delete local placement"
        >
          {isDeleting ? '⋯' : '×'}
        </button>
      )}
      {/* Thumbnail and title */}
      <div className="relative h-36 bg-gray-50 border-b border-gray-100">
        {placement.advertisement?.preview_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={placement.advertisement.preview_url}
            alt={`Preview of ${placement.advertisement.name}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide the image if it fails to load and show a fallback
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector('.fallback-content')) {
                const fallback = document.createElement('div');
                fallback.className = 'fallback-content w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200';
                fallback.innerHTML = `
                  <div class="text-center">
                    <div class="text-4xl text-gray-400 mb-2">📄</div>
                    <div class="text-sm text-gray-500">Preview Unavailable</div>
                    <div class="text-xs text-gray-400 mt-1">${placement.advertisement?.type || 'Advertisement'}</div>
                  </div>
                `;
                parent.appendChild(fallback);
              }
            }}
          />
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isLocal && (
            <Badge className="text-xs bg-orange-500 text-white px-2 py-0.5">
              🏠 Local
            </Badge>
          )}
          {isActive ? (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800 px-2 py-0.5">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              Inactive
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="card-title text-gray-900 truncate" data-testid="placement-advertisement-name">
                {placement.advertisement?.name || `Advertisement ${placement.advertisement_id}`}
              </h3>
              {/* Advertisements are never local-only - always synced entities */}
            </div>
            {placement.advertisement && (
              <EntityIdBadge
                broadstreet_id={placement.advertisement.broadstreet_id}
                mongo_id={placement.advertisement.mongo_id}
              />
            )}
          </div>
          <p className="card-meta text-gray-500 mt-0.5">
            <span className="inline-flex items-center gap-1">
              {placement.advertiser?.name || 'Advertiser'}
              {isLocalAdvertiser && (
                <Badge className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5">
                  Local
                </Badge>
              )}
              {placement.advertiser && (
                <EntityIdBadge
                  broadstreet_id={placement.advertiser.broadstreet_id}
                  mongo_id={placement.advertiser.mongo_id}
                />
              )}
            </span>
            {' • '}
            <span className="inline-flex items-center gap-1">
              {placement.campaign?.name || `Campaign ${placement.campaign_id}`}
              {isLocalCampaign && (
                <Badge className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5">
                  Local
                </Badge>
              )}
              {placement.campaign && (
                <EntityIdBadge
                  broadstreet_id={placement.campaign.broadstreet_id}
                  mongo_id={placement.campaign.mongo_id}
                />
              )}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between card-text">
            <span className="text-gray-500">Zone</span>
            <span className="font-medium text-gray-900 inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                {placement.zone?.name || (hasLocalZoneId ? `Zone ${(placement as any).zone_mongo_id?.slice(-8) || 'Local'}` : `Zone ${placement.zone_id || 'undefined'}`)}
                {(isLocalZone || hasLocalZoneId) && (
                  <Badge className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5">
                    Local
                  </Badge>
                )}
              </span>
              {placement.zone ? (
                <EntityIdBadge
                  broadstreet_id={placement.zone.broadstreet_id}
                  mongo_id={placement.zone.mongo_id}
                />
              ) : hasLocalZoneId ? (
                <EntityIdBadge
                  broadstreet_id={undefined}
                  mongo_id={(placement as any).zone_mongo_id}
                />
              ) : null}
              {placement.zone?.alias && (
                <span className="text-gray-500 ml-1">({placement.zone.alias})</span>
              )}
            </span>
          </div>

          {placement.zone?.size_type && (
            <div className="flex items-center justify-between card-text">
              <span className="text-gray-500">Size</span>
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                {placement.zone.size_type}
                {placement.zone.size_number && ` ${placement.zone.size_number}`}
              </span>
            </div>
          )}

          {placement.campaign && (
            <div className="flex items-center justify-between card-text">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium text-gray-900">
                {startDate ? startDate.toLocaleDateString() : 'N/A'}
                {endDate && ` - ${endDate.toLocaleDateString()}`}
              </span>
            </div>
          )}

          {placement.advertisement?.type && (
            <div className="flex items-center justify-between card-text">
              <span className="text-gray-500">Type</span>
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                {placement.advertisement.type}
              </span>
            </div>
          )}
        </div>

        {placement.restrictions && placement.restrictions.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="card-text text-gray-500 mb-1">Restrictions</p>
            <div className="flex flex-wrap gap-1">
              {placement.restrictions.slice(0, 3).map((restriction, index) => (
                <span
                  key={index}
                  className="px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800"
                >
                  {restriction}
                </span>
              ))}
              {placement.restrictions.length > 3 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  +{placement.restrictions.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 flex justify-between items-center card-meta text-gray-400">
          <span className="inline-flex items-center gap-2">
            {placement.network?.name || 'Network'}
            {placement.network && (
              <EntityIdBadge
                broadstreet_id={placement.network.broadstreet_id}
                mongo_id={placement.network.mongo_id}
              />
            )}
          </span>
          <span className="inline-flex items-center gap-2">
            IDs linked
          </span>
        </div>
      </div>
    </div>
  );
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
            <PlacementCard
              key={`${placement.advertisement_id}-${placement.zone_id}-${placement.campaign_id}`}
              placement={placement}
              onDelete={handleDeletePlacement}
              deletingIds={deletingIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

