'use client';

import { Suspense, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFilters } from '@/contexts/FilterContext';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { getEntityId } from '@/lib/utils/entity-helpers';
import CreationButton from '@/components/creation/CreationButton';
import { SearchInput } from '@/components/ui/search-input';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';

// Type for campaign data from filter context
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

// Map campaign to universal card props
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
    // Remove titleUrl to prevent 404 errors from external Broadstreet URLs
    // titleUrl: campaign.path, // This contains external URLs like "/networks/9396/advertisers/207298/campaigns/810557"
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
  const entities = useSelectedEntities();
  const { selectedCampaign, setSelectedCampaign, campaigns, isLoadingCampaigns, setCampaigns } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const filteredCampaigns = useMemo(() => {
    if (!searchTerm.trim()) {
      return campaigns;
    }
    
    return campaigns.filter(campaign => {
      const term = searchTerm.toLowerCase();
      const nameMatch = campaign.name.toLowerCase().includes(term);
      const notesMatch = (campaign.notes && campaign.notes.toLowerCase().includes(term)) || false;
      const idStr = String(getEntityId(campaign) ?? '');
      const idMatch = idStr.toLowerCase().includes(term);
      return nameMatch || notesMatch || idMatch;
    });
  }, [campaigns, searchTerm]);

  if (isLoadingCampaigns) {
    return <LoadingSkeleton />;
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
            Campaigns are specific to each network, so you need to choose which network&apos;s campaigns you want to see.
          </p>
        </div>
      </div>
    );
  }

  // Check if advertiser is selected
  if (!entities.advertiser) {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="card-title text-blue-800 mb-2">Advertiser Required</h3>
          <p className="card-text text-blue-700 mb-4">
            Please select an advertiser from the sidebar filters to view campaigns.
          </p>
          <p className="card-text text-blue-600">
            Campaigns belong to specific advertisers, so you need to choose which advertiser&apos;s campaigns you want to see.
          </p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="card-text text-gray-500">No campaigns found for the selected advertiser. Try syncing data first.</p>
      </div>
    );
  }

  const handleCampaignSelect = (campaign: CampaignLean) => {
    const currentId = getEntityId(selectedCampaign as any);
    const nextId = getEntityId(campaign as any);
    if (String(currentId) === String(nextId)) {
      setSelectedCampaign(null);
    } else {
      setSelectedCampaign(campaign);
    }
  };

  const handleDelete = async (campaign: CampaignLean) => {
    const campId = getEntityId(campaign as any);
    if (campId == null) {
      alert('Missing campaign ID. Cannot delete.');
      return;
    }
    setIsDeleting(String(campId));
    try {
      const response = await fetch(`/api/delete/campaign/${campId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      // Clear selection if the deleted campaign was selected
      if (String(getEntityId(selectedCampaign as any)) === String(getEntityId(campaign as any))) setSelectedCampaign(null);

      // Reload campaigns for the current advertiser so the list updates immediately
      try {
        if (entities.advertiser) {
          const advId = getEntityId(entities.advertiser as any);
          const listRes = await fetch(`/api/campaigns?advertiser_id=${advId}`, { cache: 'no-store' });
          if (listRes.ok) {
            const listData = await listRes.json();
            const next = Array.isArray(listData.campaigns) ? listData.campaigns : [];
            // Ensure deleted campaign is not present even if API is stale
            const filtered = next.filter((c: any) => String(getEntityId(c)) !== String(getEntityId(campaign as any)));
            setCampaigns(filtered);
            // Give React a tick to commit state before refreshing server components
            await new Promise((r) => setTimeout(r, 0));
          }
        }
      } catch (e) {
        console.info('Post-delete campaigns reload failed; falling back to refresh');
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
      const zoneIds = [...new Set(campaign.placements.map(p => p.zone_id))];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const isSelected = String(getEntityId(selectedCampaign as any)) === String(getEntityId(campaign as any));
            return (
              <UniversalEntityCard
                key={String(getEntityId(campaign as any))}
                {...mapCampaignToUniversalProps(campaign, {
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
      )}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
          <p className="card-text text-gray-600 mt-1">
            Active advertising campaigns and their details
          </p>
        </div>
        
        <Suspense fallback={<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>}>
          <CreationButton />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CampaignsList />
      </Suspense>
    </div>
  );
}
