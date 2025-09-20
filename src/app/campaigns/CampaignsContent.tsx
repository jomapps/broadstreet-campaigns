/**
 * CAMPAIGNS CONTENT - MAIN CAMPAIGNS UI
 * 
 * Main campaigns content component that displays campaigns grid and handles interactions.
 * Reads data from Zustand stores and provides campaign selection and management functionality.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEntityStore, useAllFilters, useFilterActions } from '@/stores';
import { useDeferredCampaignsFilter } from '@/lib/hooks/use-deferred-campaigns-filter';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { SearchInput } from '@/components/ui/search-input';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { FilterLoadingOverlay } from '@/components/ui/filter-loading-overlay';

// Type for campaign data from Zustand store
type CampaignLean = {
  broadstreet_id?: number;
  mongo_id?: string;
  name: string;
  advertiser_id: number | string;
  start_date: string;
  end_date?: string;
  active: boolean;
  weight: number;
  max_impression_count?: number;
  notes?: string;
  display_type: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  path: string;
  created_locally?: boolean;
  synced_with_api?: boolean;
  placements?: Array<{
    advertisement_id: number;
    zone_id: number;
    restrictions?: string[];
  }>;
};

/**
 * Map campaign to universal card props
 * Variable names follow docs/variable-origins.md registry
 */
function mapCampaignToUniversalProps(
  campaign: CampaignLean,
  params: {
    isSelected: boolean;
    onSelect: (c: CampaignLean) => void;
    onDelete?: (c: CampaignLean) => void;
    onCopyZonesToTheme?: (campaignName: string, themeName: string, description?: string) => Promise<void>;
    parents: { network?: any; advertiser?: any };
  }
) {
  const isLocal = !!(campaign.created_locally && !campaign.synced_with_api);
  const startDate = new Date(campaign.start_date);
  const endDate = campaign.end_date ? new Date(campaign.end_date) : undefined;
  const now = new Date();
  const isActive = !!(campaign.active && startDate <= now && (!endDate || endDate >= now));

  const parentsBreadcrumb = [
    params.parents.network && {
      name: String(params.parents.network?.name ?? 'Network'),
      broadstreet_id: typeof params.parents.network?.broadstreet_id === 'number' ? params.parents.network.broadstreet_id : undefined,
      mongo_id: params.parents.network?.mongo_id ?? params.parents.network?._id,
      entityType: 'network' as const,
    },
    params.parents.advertiser && {
      name: String(params.parents.advertiser?.name ?? 'Advertiser'),
      broadstreet_id: typeof params.parents.advertiser?.broadstreet_id === 'number' ? params.parents.advertiser.broadstreet_id : undefined,
      mongo_id: params.parents.advertiser?.mongo_id ?? params.parents.advertiser?._id,
      entityType: 'advertiser' as const,
    },
  ].filter(Boolean) as any[];

  return {
    title: campaign.name,
    broadstreet_id: campaign.broadstreet_id,
    mongo_id: campaign.mongo_id,
    entityType: 'campaign' as const,
    showCheckbox: true,
    isSelected: params.isSelected,
    onSelect: () => params.onSelect(campaign),
    onCardClick: () => params.onSelect(campaign),
    isLocal,
    onDelete: isLocal && params.onDelete ? () => params.onDelete!(campaign) : undefined,
    statusBadge: isActive ? { label: 'Running', variant: 'success' as const } : { label: 'Paused', variant: 'secondary' as const },
    parentsBreadcrumb,
    displayData: [
      { label: 'Start Date', value: startDate, type: 'date' as const },
      { label: 'End Date', value: endDate ? endDate : 'No end date', type: endDate ? 'date' as const : 'string' as const },
      { label: 'Weight', value: campaign.weight, type: 'number' as const },
      { label: 'Max Impressions', value: campaign.max_impression_count ?? 'Unlimited', type: typeof campaign.max_impression_count === 'number' ? 'number' as const : 'string' as const },
    ],
    onCopyToTheme: params.onCopyZonesToTheme
      ? async (themeName: string, description?: string) => {
          await params.onCopyZonesToTheme!(campaign.name, themeName, description);
        }
      : undefined,
  };
}

/**
 * CampaignsList - Campaigns grid component
 * Variable names follow docs/variable-origins.md registry
 */
function CampaignsList() {
  // Get data from Zustand stores using exact names from docs/variable-origins.md registry
  const { campaigns, isLoading } = useEntityStore();
  const { selectedCampaign, selectedNetwork, selectedAdvertiser } = useAllFilters();
  const { setSelectedCampaign } = useFilterActions();

  // Create entities object for compatibility with existing code
  const entities = {
    network: selectedNetwork,
    advertiser: selectedAdvertiser
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  // Use deferred filtering for better performance with loading states
  const { filteredCampaigns, isFiltering, filterCount } = useDeferredCampaignsFilter({
    campaigns,
    selectedAdvertiser,
    searchTerm
  });

  if (isLoading.campaigns) {
    return (
      <div className="space-y-6">
        <div className="max-w-md">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
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
      </div>
    );
  }

  // Check if network is selected
  if (!entities.network) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="card-title text-yellow-800 mb-2">Network Required</h3>
          <p className="card-text text-yellow-700 mb-4">
            Please select a network from the sidebar filters to view campaigns.
          </p>
          <p className="card-text text-yellow-600">
            Campaigns are specific to each network, so you need to choose which network's campaigns you want to see.
          </p>
        </div>
      </div>
    );
  }



  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="card-text text-gray-500">No campaigns found. Try syncing data first.</p>
      </div>
    );
  }

  const handleCampaignSelect = (campaign: CampaignLean) => {
    const currentId = getEntityId(selectedCampaign);
    const nextId = getEntityId(campaign);
    if (String(currentId ?? '') === String(nextId ?? '')) {
      setSelectedCampaign(null);
    } else {
      setSelectedCampaign(campaign as any);
    }
  };

  const handleDelete = async (campaign: CampaignLean) => {
    const campId = getEntityId(campaign);
    if (campId == null) {
      alert('Missing campaign ID. Cannot delete.');
      return;
    }
    
    const confirmed = confirm(`Are you sure you want to delete "${campaign.name}"?`);
    if (!confirmed) return;

    setIsDeleting(String(campId));
    try {
      const response = await fetch(`/api/delete/campaign/${campId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      // Clear selection if deleted campaign was selected
      if (String(getEntityId(selectedCampaign)) === String(campId)) {
        setSelectedCampaign(null);
      }

      // Soft refresh for any server components
      router.refresh();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle copying zones from campaign to theme
  const handleCopyZonesToTheme = async (campaignName: string, themeName: string, description?: string) => {
    try {
      // Find the campaign to get its zone IDs
      const campaign = filteredCampaigns.find(c => c.name === campaignName);
      if (!campaign || !campaign.placements) {
        throw new Error('Campaign not found or has no placements');
      }

      // Extract unique zone IDs from placements
      const zoneIds = [...new Set(campaign.placements.map((p: any) => p.zone_id))];

      if (zoneIds.length === 0) {
        throw new Error('Campaign has no zones to copy');
      }

      // Create the theme with the zone IDs
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: themeName,
          description,
          zone_ids: zoneIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create theme');
      }

      const result = await response.json();

      // Show success message
      alert(`Successfully created theme "${themeName}" with ${zoneIds.length} zone${zoneIds.length !== 1 ? 's' : ''} from campaign "${campaignName}"`);

      // Optionally navigate to the new theme
      const themeId = result.theme._id;
      if (themeId) {
        router.push(`/themes/${themeId}`);
      }
    } catch (error) {
      console.error('Error copying zones to theme:', error);
      alert(`Failed to create theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  return (
    <div className="space-y-6" data-testid="campaigns-list">
      <div className="max-w-md">
        <SearchInput
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>
      
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="card-text text-gray-500">No campaigns match your search.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => {
              const isSelected = String(getEntityId(selectedCampaign)) === String(getEntityId(campaign));
              return (
                <UniversalEntityCard
                  key={String(getEntityId(campaign))}
                  {...mapCampaignToUniversalProps(campaign as any, {
                    isSelected,
                    onSelect: handleCampaignSelect,
                    onDelete: handleDelete,
                    onCopyZonesToTheme: handleCopyZonesToTheme,
                    parents: { network: entities.network, advertiser: entities.advertiser },
                  })}
                />
              );
            })}
          </div>

          {/* Loading overlay during filtering operations */}
          <FilterLoadingOverlay
            isVisible={isFiltering}
            filterCount={filterCount}
            totalCount={campaigns?.length}
            entityType="campaigns"
          />
        </div>
      )}
    </div>
  );
}

/**
 * CampaignsContent - Main campaigns content component
 * Variable names follow docs/variable-origins.md registry
 */
export default function CampaignsContent() {
  return <CampaignsList />;
}
