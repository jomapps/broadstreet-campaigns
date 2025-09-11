'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';

// Type for enriched placement data
type PlacementLean = {
  _id: string;
  __v: number;
  advertisement_id: number;
  zone_id: number;
  campaign_id: number;
  restrictions?: string[];
  createdAt: string;
  updatedAt: string;
  advertisement?: {
    id: number;
    name: string;
    type: string;
    preview_url: string;
  } | null;
  campaign?: {
    id: number;
    name: string;
    start_date: string;
    end_date?: string;
    active: boolean;
  } | null;
  zone?: {
    id: number;
    name: string;
    alias?: string | null;
    size_type?: 'SQ' | 'PT' | 'LS' | null;
    size_number?: number | null;
  } | null;
  advertiser?: {
    id: number;
    name: string;
  } | null;
  network?: {
    id: number;
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header with title and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="card-title text-gray-900 truncate">
            {placement.advertisement?.name || `Ad #${placement.advertisement_id}`}
          </h3>
          <p className="card-meta text-gray-500 mt-0.5">
            {placement.campaign?.name || `Campaign #${placement.campaign_id}`}
          </p>
        </div>
        
        <div className="flex flex-col items-end space-y-1 ml-2">
          {isActive ? (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800 px-2 py-0.5">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              Inactive
            </Badge>
          )}
          {placement.zone?.size_type && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
              {placement.zone.size_type}
              {placement.zone.size_number && ` ${placement.zone.size_number}`}
            </span>
          )}
        </div>
      </div>
      
      {/* Main content in compact layout */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between card-text">
          <span className="text-gray-500">Zone:</span>
          <span className="font-medium text-gray-900">
            {placement.zone?.name || `#${placement.zone_id}`}
            {placement.zone?.alias && (
              <span className="text-gray-500 ml-1">({placement.zone.alias})</span>
            )}
          </span>
        </div>
        
        <div className="flex items-center justify-between card-text">
          <span className="text-gray-500">Advertiser:</span>
          <span className="font-medium text-gray-900">
            {placement.advertiser?.name || 'Unknown'}
          </span>
        </div>
        
        {placement.campaign && (
          <div className="flex items-center justify-between card-text">
            <span className="text-gray-500">Duration:</span>
            <span className="font-medium text-gray-900">
              {startDate ? startDate.toLocaleDateString() : 'N/A'}
              {endDate && ` - ${endDate.toLocaleDateString()}`}
            </span>
          </div>
        )}
        
        {placement.advertisement?.type && (
          <div className="flex items-center justify-between card-text">
            <span className="text-gray-500">Type:</span>
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
              {placement.advertisement.type}
            </span>
          </div>
        )}
      </div>
      
      {/* Restrictions */}
      {placement.restrictions && placement.restrictions.length > 0 && (
        <div className="mb-3 pt-2 border-t border-gray-100">
          <p className="card-text text-gray-500 mb-1">Restrictions:</p>
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
      
      {/* Footer with metadata */}
      <div className="pt-2 border-t border-gray-100 flex justify-between items-center card-meta text-gray-400">
        <span>Created: {new Date(placement.createdAt).toLocaleDateString()}</span>
        <span>ID: {placement._id.slice(-6)}</span>
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
        <p className="card-text text-gray-500">No placements found for the selected filters. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <SearchInput
          placeholder="Search placements..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>
      
      {filteredPlacements.length === 0 ? (
        <div className="text-center py-12">
          <p className="card-text text-gray-500">No placements match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
