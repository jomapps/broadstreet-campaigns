'use client';

import { Suspense, useState, useEffect } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import PlacementActions from '@/components/placements/PlacementActions';
import PlacementsList from './PlacementsList';

// Type for enriched placement data
type PlacementLean = {
  _id: string;
  __v: number;
  advertisement_id: number;
  zone_id: number;
  campaign_id: number;
  restrictions?: string[];
  createdAt: Date;
  updatedAt: Date;
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

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-12 h-5 bg-gray-200 rounded ml-2"></div>
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex justify-between">
                <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between">
              <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlacementsData() {
  const { selectedNetwork, selectedAdvertiser, selectedCampaign } = useFilters();
  const [placements, setPlacements] = useState<PlacementLean[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPlacements = async () => {
      if (!selectedNetwork) {
        setPlacements([]);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('network_id', selectedNetwork.id.toString());
        
        if (selectedAdvertiser) {
          params.append('advertiser_id', selectedAdvertiser.id.toString());
        }
        
        if (selectedCampaign) {
          params.append('campaign_id', selectedCampaign.id.toString());
        }

        const response = await fetch(`/api/placements?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setPlacements(data.placements || []);
        } else {
          console.error('Failed to fetch placements');
          setPlacements([]);
        }
      } catch (error) {
        console.error('Error fetching placements:', error);
        setPlacements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlacements();
  }, [selectedNetwork, selectedAdvertiser, selectedCampaign]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Check if network is selected
  if (!selectedNetwork) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Network Required</h3>
          <p className="text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view placements.
          </p>
          <p className="text-sm text-yellow-600">
            Placements are specific to each network, so you need to choose which network&apos;s placements you want to see.
          </p>
        </div>
      </div>
    );
  }

  return <PlacementsList placements={placements} />;
}

export default function PlacementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Placements</h1>
          <p className="text-sm text-gray-600 mt-1">
            Active ad placements across campaigns, advertisements, and zones
          </p>
        </div>
        
        <Suspense fallback={<div className="flex space-x-3"><div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div><div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div></div>}>
          <PlacementActions />
        </Suspense>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Placement Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Advertisement + Zone + Campaign</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Active Campaigns Only</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span>Network Filtered</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <PlacementsData />
      </Suspense>
    </div>
  );
}
