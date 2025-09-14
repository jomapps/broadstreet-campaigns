'use client';

import { useState, useMemo } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { EntityIdBadge } from '@/components/ui/entity-id-badge';

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
    ids: { broadstreet_id?: number; mongo_id?: string };
    name: string;
    type: string;
    preview_url: string;
  } | null;
  campaign?: {
    ids: { broadstreet_id?: number; mongo_id?: string };
    name: string;
    start_date: string;
    end_date?: string;
    active: boolean;
  } | null;
  zone?: {
    ids: { broadstreet_id?: number; mongo_id?: string };
    name: string;
    alias?: string | null;
    size_type?: 'SQ' | 'PT' | 'LS' | null;
    size_number?: number | null;
  } | null;
  advertiser?: {
    ids: { broadstreet_id?: number; mongo_id?: string };
    name: string;
  } | null;
  network?: {
    ids: { broadstreet_id?: number; mongo_id?: string };
    name: string;
  } | null;
};

interface PlacementCardProps {
  placement: PlacementLean;
}

function PlacementCard({ placement }: PlacementCardProps) {
  const startDate = placement.campaign?.start_date ? new Date(placement.campaign.start_date) : null;
  const endDate = placement.campaign?.end_date ? new Date(placement.campaign.end_date) : null;
  const now = new Date();

  const isActive = placement.campaign?.active &&
    startDate && startDate <= now &&
    (!endDate || endDate >= now);
  
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      data-testid={`placement-card`}
      data-placement-id={`${placement.advertisement_id}-${placement.zone_id}-${placement.campaign_id}`}
    >
      {/* Thumbnail and title */}
      <div className="relative h-36 bg-gray-50 border-b border-gray-100">
        {placement.advertisement?.preview_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={placement.advertisement.preview_url}
            alt={`Preview of ${placement.advertisement.name}`}
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute top-2 right-2">
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
            <h3 className="card-title text-gray-900 truncate" data-testid="placement-advertisement-name">
              {placement.advertisement?.name || `Advertisement`}
            </h3>
            {placement.advertisement && (
              <EntityIdBadge
                broadstreet_id={placement.advertisement.ids?.broadstreet_id}
                mongo_id={placement.advertisement.ids?.mongo_id}
              />
            )}
          </div>
          <p className="card-meta text-gray-500 mt-0.5">
            <span className="inline-flex items-center gap-1">
              {placement.advertiser?.name || 'Advertiser'}
              {placement.advertiser && (
                <EntityIdBadge
                  broadstreet_id={placement.advertiser.ids?.broadstreet_id}
                  mongo_id={placement.advertiser.ids?.mongo_id}
                />
              )}
            </span>
            {' • '}
            <span className="inline-flex items-center gap-1">
              {placement.campaign?.name || 'Campaign'}
              {placement.campaign && (
                <EntityIdBadge
                  broadstreet_id={placement.campaign.ids?.broadstreet_id}
                  mongo_id={placement.campaign.ids?.mongo_id}
                />
              )}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between card-text">
            <span className="text-gray-500">Zone</span>
            <span className="font-medium text-gray-900 inline-flex items-center gap-2">
              {placement.zone?.name || 'Zone'}
              {placement.zone && (
                <EntityIdBadge
                  broadstreet_id={placement.zone.ids?.broadstreet_id}
                  mongo_id={placement.zone.ids?.mongo_id}
                />
              )}
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
                broadstreet_id={placement.network.ids?.broadstreet_id}
                mongo_id={placement.network.ids?.mongo_id}
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
}

export default function PlacementsList({ placements }: PlacementsListProps) {
  const [searchTerm, setSearchTerm] = useState('');

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
      placement.advertisement_id.toString().includes(searchTerm) ||
      placement.zone_id.toString().includes(searchTerm) ||
      placement.campaign_id.toString().includes(searchTerm) ||
      (placement.restrictions && placement.restrictions.some(r => 
        r.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }, [placements, searchTerm]);

  if (placements.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="card-text text-gray-500" data-testid="no-placements-message">No placements found for the selected filters. Try syncing data first.</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

