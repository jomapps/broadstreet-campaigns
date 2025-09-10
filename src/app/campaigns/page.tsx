'use client';

import { Suspense, useState, useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import CampaignActions from '@/components/campaigns/CampaignActions';
import CreationButton from '@/components/creation/CreationButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';

// Type for campaign data from filter context
type CampaignLean = {
  id: number;
  name: string;
  advertiser_id: number;
  start_date: string;
  end_date?: string;
  active: boolean;
  weight: number;
  max_impression_count?: number;
  notes?: string;
  display_type: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  path: string;
};

interface CampaignCardProps {
  campaign: CampaignLean;
  advertiserName?: string;
  isSelected: boolean;
  onSelect: (campaign: CampaignLean) => void;
}

function CampaignCard({ campaign, advertiserName, isSelected, onSelect }: CampaignCardProps) {
  const startDate = new Date(campaign.start_date);
  const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
  const now = new Date();
  
  const isActive = campaign.active && startDate <= now && (!endDate || endDate >= now);
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-200 ${
      isSelected 
        ? 'border-primary shadow-md shadow-primary/10' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(campaign)}
              className="mt-1"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
              {advertiserName && (
                <p className="text-sm text-gray-600 mt-1">Advertiser: {advertiserName}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          {isSelected && (
            <Badge variant="default" className="text-xs">
              Selected
            </Badge>
          )}
          <span className={`px-2 py-1 text-xs rounded-full ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-xs text-gray-500">ID: {campaign.id}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Start Date</p>
          <p className="text-sm font-medium text-gray-900">
            {startDate.toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">End Date</p>
          <p className="text-sm font-medium text-gray-900">
            {endDate ? endDate.toLocaleDateString() : 'No end date'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Weight</p>
          <p className="text-sm font-medium text-gray-900">{campaign.weight}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Max Impressions</p>
          <p className="text-sm font-medium text-gray-900">
            {campaign.max_impression_count?.toLocaleString() || 'Unlimited'}
          </p>
        </div>
      </div>
      
      {campaign.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Notes</p>
          <p className="text-sm text-gray-900 mt-1">{campaign.notes}</p>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignsList() {
  const { selectedNetwork, selectedAdvertiser, selectedCampaign, setSelectedCampaign, campaigns, isLoadingCampaigns } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCampaigns = useMemo(() => {
    if (!searchTerm.trim()) {
      return campaigns;
    }
    
    return campaigns.filter(campaign =>
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.notes && campaign.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      campaign.id.toString().includes(searchTerm)
    );
  }, [campaigns, searchTerm]);

  if (isLoadingCampaigns) {
    return <LoadingSkeleton />;
  }

  // Check if network is selected
  if (!selectedNetwork) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Network Required</h3>
          <p className="text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view campaigns.
          </p>
          <p className="text-sm text-yellow-600">
            Campaigns are specific to each network, so you need to choose which network&apos;s campaigns you want to see.
          </p>
        </div>
      </div>
    );
  }

  // Check if advertiser is selected
  if (!selectedAdvertiser) {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Advertiser Required</h3>
          <p className="text-blue-700 mb-4">
            Please select an advertiser from the sidebar filters to view campaigns.
          </p>
          <p className="text-sm text-blue-600">
            Campaigns belong to specific advertisers, so you need to choose which advertiser&apos;s campaigns you want to see.
          </p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No campaigns found for the selected advertiser. Try syncing data first.</p>
      </div>
    );
  }

  const handleCampaignSelect = (campaign: CampaignLean) => {
    if (selectedCampaign?.id === campaign.id) {
      setSelectedCampaign(null);
    } else {
      setSelectedCampaign(campaign);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <SearchInput
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>
      
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No campaigns match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign}
              advertiserName={selectedAdvertiser?.name}
              isSelected={selectedCampaign?.id === campaign.id}
              onSelect={handleCampaignSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Active advertising campaigns and their details
          </p>
        </div>
        
        <Suspense fallback={<div className="flex space-x-3"><div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div><div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div></div>}>
          <CampaignActions />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CampaignsList />
      </Suspense>

      <CreationButton />
    </div>
  );
}
