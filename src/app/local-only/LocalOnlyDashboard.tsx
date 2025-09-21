/**
 * LOCAL-ONLY DASHBOARD - ZUSTAND INTEGRATION
 *
 * Updated to use Zustand stores instead of props.
 * Reads local entities and networks from entity store.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAllFilters } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressModal, useSyncProgress } from '@/components/ui/progress-modal';
import { X, Upload, Trash2, Calendar, Globe, Users, Target, Image, FileText } from 'lucide-react';
import { EntityIdBadge } from '@/components/ui/entity-id-badge';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { cardStateClasses } from '@/lib/ui/cardStateClasses';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { useAllEntities } from '@/stores';
import { useFilterResetAfterDeletion } from '@/lib/utils/filter-reset-helpers';
import {
  LocalZoneEntity,
  LocalAdvertiserEntity,
  LocalCampaignEntity,
  LocalNetworkEntity,
  LocalAdvertisementEntity,
  PlacementEntity
} from '@/lib/types/database-models';

// Type for local entity data using proper database model interfaces
type LocalOnlyData = {
  zones: (LocalZoneEntity & { type: 'zone' })[];
  advertisers: (LocalAdvertiserEntity & { type: 'advertiser' })[];
  campaigns: (LocalCampaignEntity & { type: 'campaign' })[];
  networks: (LocalNetworkEntity & { type: 'network' })[];
  advertisements: (LocalAdvertisementEntity & { type: 'advertisement' })[];
  placements: PlacementEntity[];
};

// Union type for all local entities with type discrimination
type LocalEntityWithType =
  | (LocalZoneEntity & { type: 'zone' })
  | (LocalAdvertiserEntity & { type: 'advertiser' })
  | (LocalCampaignEntity & { type: 'campaign' })
  | (LocalNetworkEntity & { type: 'network' })
  | (LocalAdvertisementEntity & { type: 'advertisement' });

// No props needed - component reads from Zustand stores

function mapLocalEntityToCardProps(
  entity: LocalEntityWithType,
  params: {
  networkName?: string;
  advertiserName?: string;
  onDelete: (entityId: string, type: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (entityId: string) => void;
}
) {
  const parentsBreadcrumb: any[] = [];
  if (params.networkName) {
    parentsBreadcrumb.push({ name: params.networkName, entityType: 'network' as const });
  }
  if (entity.type === 'campaign' && params.advertiserName) {
    parentsBreadcrumb.push({ name: params.advertiserName, entityType: 'advertiser' as const });
  }

  const displayData: any[] = [
    { label: 'Created', value: new Date(entity.created_at), type: 'date' as const },
  ];
  if (entity.type === 'zone') {
    if (entity.alias) displayData.push({ label: 'Alias', value: entity.alias, type: 'string' as const });
    if ((entity as any).width && (entity as any).height) displayData.push({ label: 'Size', value: `${(entity as any).width}x${(entity as any).height}px`, type: 'string' as const });
  }
  if (entity.type === 'advertiser' && (entity as any).admins) {
    displayData.push({ label: 'Admins', value: (entity as any).admins.length || 0, type: 'number' as const });
  }
  if (entity.type === 'campaign') {
    if ((entity as any).start_date) displayData.push({ label: 'Start', value: new Date((entity as any).start_date), type: 'date' as const });
    if ((entity as any).end_date) displayData.push({ label: 'End', value: new Date((entity as any).end_date), type: 'date' as const });
    if ((entity as any).max_impression_count) displayData.push({ label: 'Max Impr.', value: (entity as any).max_impression_count, type: 'number' as const });
  }
  if (entity.type === 'advertisement' && (entity as any).preview_url) {
    displayData.push({ label: 'Preview', value: (entity as any).preview_url, type: 'string' as const });
  }

  return {
    title: entity.name,
    broadstreet_id: entity.broadstreet_id ?? (entity as any).original_broadstreet_id,
    mongo_id: entity.mongo_id ?? entity._id,
    entityType: (entity.type as any),
    isLocal: true,
    topTags: entity.type ? [{ label: entity.type, variant: 'secondary' as const }] : [],
    parentsBreadcrumb,
    displayData,
    showCheckbox: true,
    isSelected: !!params.isSelected,
    onSelect: () => params.onToggleSelection?.(entity._id),
    onCardClick: () => params.onToggleSelection?.(entity._id),
    onDelete: () => params.onDelete(entity._id, entity.type),
  };
}

interface EntitySectionProps {
  title: string;
  entities: LocalEntityWithType[];
  networkMap: Record<number, string>;
  advertiserMap: Record<number, string>;
  onDelete: (entityId: string, type: string) => void;
  selectedIds: Set<string>;
  onToggleSelection: (entityId: string) => void;
  onDeleteSection?: () => void;
  isDeletingSection?: boolean;
}

function EntitySection({ title, entities, networkMap, advertiserMap, onDelete, selectedIds, onToggleSelection, onDeleteSection, isDeletingSection }: EntitySectionProps) {
  if (entities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <Badge variant="outline" className="text-sm">
          {entities.length} {entities.length === 1 ? 'item' : 'items'}
        </Badge>
        {onDeleteSection && (
          <Button
            onClick={onDeleteSection}
            disabled={isDeletingSection}
            variant="destructive"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {isDeletingSection ? 'Deleting...' : `Delete All ${title}`}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entities.map((entity) => (
          <UniversalEntityCard
            key={entity._id}
            {...mapLocalEntityToCardProps(entity, {
              networkName: entity.type === 'network'
                ? entity.name // Networks don't have network_id, they ARE the network
                : networkMap[
                    typeof (entity as any).network_id === 'string'
                      ? Number((entity as any).network_id)
                      : (entity as any).network_id
                  ],
              advertiserName: entity.type === 'campaign'
                ? advertiserMap[
                    typeof (entity as any).advertiser_id === 'string'
                      ? Number((entity as any).advertiser_id)
                      : (entity as any).advertiser_id
                  ]
                : undefined,
              onDelete,
              isSelected: selectedIds.has(entity._id),
              onToggleSelection,
            })}
          />
        ))}
      </div>
    </div>
  );
}

// Local Placement Card Component
function LocalPlacementCard({
  placement,
  networkMap,
  advertiserMap,
  allLocalEntities,
  onDelete,
  isDeleting
}: {
  placement: LocalOnlyData['placements'][0];
  networkMap: Record<number, string>;
  advertiserMap: Record<number, string>;
  allLocalEntities: LocalOnlyData;
  onDelete: (entityId: string) => void;
  isDeleting: boolean;
}) {
  // Find related entities from local data
  const network = Object.values(networkMap).find((_, index) =>
    Object.keys(networkMap)[index] === String(placement.network_id)
  );
  const advertiser = advertiserMap[placement.advertiser_id];

  // Find campaign entity
  const campaign = placement.campaign_id
    ? allLocalEntities.campaigns.find(c => c.broadstreet_id === placement.campaign_id)
    : placement.campaign_mongo_id
      ? allLocalEntities.campaigns.find(c => c._id === placement.campaign_mongo_id)
      : null;

  // Find advertisement entity
  const advertisement = allLocalEntities.advertisements.find(ad =>
    ad.broadstreet_id === placement.advertisement_id
  );

  // Find zone entity
  const zone = placement.zone_id
    ? allLocalEntities.zones.find(z => z.broadstreet_id === placement.zone_id)
    : placement.zone_mongo_id
      ? allLocalEntities.zones.find(z => z._id === placement.zone_mongo_id)
      : null;

  // Build breadcrumb hierarchy: Network > Advertiser > Campaign > Advertisement + Zone
  const parentsBreadcrumb = [
    // Network
    {
      name: networkMap[placement.network_id] || `Network ${placement.network_id}`,
      broadstreet_id: placement.network_id,
      mongo_id: undefined,
      entityType: 'network' as const,
    },
    // Advertiser
    {
      name: advertiser || `Advertiser ${placement.advertiser_id}`,
      broadstreet_id: placement.advertiser_id,
      mongo_id: undefined,
      entityType: 'advertiser' as const,
    },
    // Campaign (if found)
    campaign && {
      name: campaign.name,
      broadstreet_id: campaign.broadstreet_id,
      mongo_id: campaign._id,
      entityType: 'campaign' as const,
    },
    // Advertisement
    advertisement && {
      name: advertisement.name,
      broadstreet_id: advertisement.broadstreet_id,
      mongo_id: advertisement._id,
      entityType: 'advertisement' as const,
    },
    // Zone
    zone && {
      name: zone.name,
      broadstreet_id: zone.broadstreet_id,
      mongo_id: zone._id,
      entityType: 'zone' as const,
    },
  ].filter(Boolean) as any[];

  // Display data for the card content
  const displayData = [
    { label: 'Campaign', value: campaign?.name ?? (placement.campaign_id ? `Campaign ${placement.campaign_id}` : 'N/A'), type: 'string' as const },
    { label: 'Advertisement', value: advertisement?.name ?? String(placement.advertisement_id), type: 'string' as const },
    { label: 'Zone', value: zone?.name ?? (placement.zone_id ? `Zone ${placement.zone_id}` : 'N/A'), type: 'string' as const },
  ] as any[];

  if (placement.restrictions && placement.restrictions.length > 0) {
    displayData.push({ label: 'Restrictions', value: placement.restrictions.join(', '), type: 'string' as const });
  }

  return (
    <UniversalEntityCard
      title={advertisement?.name || `Advertisement ${placement.advertisement_id}`}
      entityType="placement"
      isLocal={true}
      mongo_id={placement._id}
      parentsBreadcrumb={parentsBreadcrumb}
      displayData={displayData}
      onDelete={() => onDelete(placement._id)}
    />
  );
}

export default function LocalOnlyDashboard() {
  const router = useRouter();

  // Get filter reset helpers
  const { resetFiltersAfterDeletion, resetFiltersAfterBulkDeletion } = useFilterResetAfterDeletion();

  // Get data from Zustand stores using exact names from variable registry
  const {
    localZones,
    localAdvertisers,
    localCampaigns,
    localNetworks,
    localAdvertisements,
    localPlacements,
    networks,
    advertisers
  } = useAllEntities();

  // Create network and advertiser maps from store data
  const networkMap = networks.reduce((map: Record<number, string>, network: any) => {
    map[network.broadstreet_id] = network.name;
    return map;
  }, {} as Record<number, string>);

  // Create advertiser map from store data
  const advertiserMap = useMemo(() => {
    return advertisers.reduce((map: Record<number, string>, advertiser: any) => {
      if (advertiser.broadstreet_id) {
        map[advertiser.broadstreet_id] = advertiser.name || 'Unknown Advertiser';
      }
      return map;
    }, {} as Record<number, string>);
  }, [advertisers]);

  // Reconstruct data object to match expected structure with type discrimination
  const data = {
    zones: localZones.map(zone => ({ ...zone, type: 'zone' as const })),
    advertisers: localAdvertisers.map(advertiser => ({ ...advertiser, type: 'advertiser' as const })),
    campaigns: localCampaigns.map(campaign => ({ ...campaign, type: 'campaign' as const })),
    networks: localNetworks.map(network => ({ ...network, type: 'network' as const })),
    advertisements: localAdvertisements.map(advertisement => ({ ...advertisement, type: 'advertisement' as const })),
    placements: localPlacements
  };
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingSection, setIsDeletingSection] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Enhanced sync progress management
  const {
    isOpen: isProgressModalOpen,
    setIsOpen: setProgressModalOpen,
    steps,
    currentStep,
    overallProgress,
    isComplete,
    hasErrors,
    initializeSteps,
    setStepInProgress,
    setStepCompleted,
    setStepFailed,
    updateStepProgress,
    completeSync
  } = useSyncProgress();

  // Get selected network from filter store using new Zustand pattern
  const { selectedNetwork } = useAllFilters();

  // Count embedded placements within campaigns
  const embeddedPlacementsCount = data.campaigns.reduce((total, campaign) => {
    return total + (Array.isArray((campaign as any).placements) ? (campaign as any).placements.length : 0);
  }, 0);

  const totalEntities = data.zones.length + data.advertisers.length + data.campaigns.length + data.networks.length + data.advertisements.length + data.placements.length + embeddedPlacementsCount;

  const toggleSelection = (entityId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return next;
    });
  };

  const handleDelete = async (entityId: string, type?: string) => {
    // Determine type from the placement data if not provided
    const entityType = type || (data.placements.find(p => p._id === entityId) ? 'placement' : 'unknown');

    if (!confirm(`Are you sure you want to delete this ${entityType}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(entityId);
    try {
      let response;

      if (entityType === 'placement') {
        // Use the local placement deletion endpoint
        response = await fetch(`/api/local-placements/${entityId}`, {
          method: 'DELETE',
        });
      } else {
        // Use the existing entity deletion endpoint
        response = await fetch(`/api/delete/${entityType}/${entityId}`, {
          method: 'DELETE',
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to delete ${entityType}`);
      }

      // Reset filters to prevent stale entity references
      resetFiltersAfterDeletion(entityType, entityId);

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error(`Error deleting ${entityType}:`, error);
      alert(`Failed to delete ${entityType}. Please try again.`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteSection = async (sectionType: string) => {
    const sectionNames: Record<string, string> = {
      'zones': 'zones',
      'advertisers': 'advertisers',
      'campaigns': 'campaigns',
      'networks': 'networks',
      'advertisements': 'advertisements',
      'placements': 'placements'
    };

    const sectionName = sectionNames[sectionType] || sectionType;

    // Calculate entity count - special handling for placements
    let entityCount = 0;
    let confirmMessage = '';

    if (sectionType === 'placements') {
      const standalonePlacements = data.placements?.length || 0;
      const embeddedPlacements = data.campaigns.reduce((total: number, c: any) => total + (c.placements?.length || 0), 0);
      entityCount = standalonePlacements + embeddedPlacements;

      if (embeddedPlacements > 0) {
        confirmMessage = `Are you sure you want to delete ALL ${entityCount} local placements? This includes ${standalonePlacements} standalone placements and ${embeddedPlacements} embedded placements. This action cannot be undone.`;
      } else {
        confirmMessage = `Are you sure you want to delete ALL ${entityCount} local ${sectionName}? This action cannot be undone.`;
      }
    } else {
      entityCount = data[sectionType as keyof typeof data]?.length || 0;
      confirmMessage = `Are you sure you want to delete ALL ${entityCount} local ${sectionName}? This action cannot be undone.`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeletingSection(sectionType);
    try {
      const response = await fetch(`/api/delete/local-${sectionName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${sectionName}`);
      }

      const result = await response.json();

      // Handle special case for placements which includes both standalone and embedded
      if (sectionType === 'placements') {
        const totalDeleted = (result.deleted || 0) + (result.embeddedCleared || 0);
        const message = result.embeddedCleared > 0
          ? `Successfully deleted ${result.deleted} standalone placements and cleared embedded placements from ${result.embeddedCleared} campaigns.`
          : `Successfully deleted ${result.deleted} local placements.`;
        alert(message);
      } else {
        alert(`Successfully deleted ${result.deleted} local ${sectionName}.`);
      }

      // Reset filters to prevent stale entity references
      resetFiltersAfterBulkDeletion([sectionName], result.deleted || 0);

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error(`Delete ${sectionName} error:`, error);
      alert(`Delete ${sectionName} failed. Please try again.`);
    } finally {
      setIsDeletingSection(null);
    }
  };

  // Initialize steps with the new workflow including cleanup and dashboard sync
  const initializeStepsWithCleanup = (entityCounts: Record<string, number>) => {
    // Start with the standard initialization
    initializeSteps(entityCounts);
  };

  const handleSyncAll = async () => {
    if (!confirm(`Are you sure you want to sync all ${totalEntities} local entities to Broadstreet? This will also clean up local data and refresh from Broadstreet. This may take several minutes.`)) {
      return;
    }

    // Initialize progress modal with entity counts for the selected network
    if (!selectedNetwork) {
      alert('Please select a network in the sidebar before syncing');
      return;
    }

    const networkId = selectedNetwork.broadstreet_id;
    const entityCounts = {
      networks: data.networks.filter(n => !n.synced_with_api && String(n.broadstreet_id || n._id) === String(networkId)).length,
      advertisers: data.advertisers.filter(a => !a.synced_with_api && String(a.network_id) === String(networkId)).length,
      zones: data.zones.filter(z => !z.synced_with_api && String(z.network_id) === String(networkId)).length,
      advertisements: data.advertisements.filter(ad => !ad.synced_with_api && String(ad.network_id) === String(networkId)).length,
      campaigns: data.campaigns.filter(c => !c.synced_with_api && String(c.network_id) === String(networkId)).length,
    };
    console.info('[LocalOnly] Computed unsynced counts for network', networkId, entityCounts);

    initializeStepsWithCleanup(entityCounts);
    setProgressModalOpen(true);

    try {
      // Start dry run validation
      setStepInProgress('dry-run');

      // Use the selected network from the sidebar
      if (!selectedNetwork) {
        throw new Error('Please select a network in the sidebar before syncing');
      }

      const networkId = selectedNetwork.broadstreet_id;
      console.info('[LocalOnly] Starting sync for network:', networkId);

      const response = await fetch('/api/sync/local-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkId }),
      });
      console.info('[LocalOnly] Sent sync request for network:', networkId);

      if (!response.ok) {
        throw new Error('Failed to sync entities');
      }

      const result = await response.json();
      
      // Update dry run step
      if (result.nameConflicts && result.nameConflicts.length > 0) {
        setStepCompleted('dry-run', `Found and resolved ${result.nameConflicts.length} name conflicts`);
      } else {
        setStepCompleted('dry-run', 'No name conflicts found');
      }

      // Handle the new workflow response format
      console.log('[LocalOnly] Processing sync result:', {
        success: result.success,
        hasCleanup: !!result.cleanup,
        hasDashboardSync: !!result.dashboardSync
      });

      // Process initial sync steps
      const syncSteps = [
        { stepName: 'networks', count: result.report?.successfulSyncs || 0 },
        { stepName: 'advertisers', count: result.report?.successfulSyncs || 0 },
        { stepName: 'zones', count: result.report?.successfulSyncs || 0 },
        { stepName: 'advertisements', count: result.report?.successfulSyncs || 0 },
        { stepName: 'campaigns', count: result.report?.successfulSyncs || 0 }
      ];

      // Simulate progress for sync steps
      for (const step of syncSteps) {
        setStepInProgress(step.stepName);
        await new Promise(resolve => setTimeout(resolve, 300)); // Faster simulation

        if (step.count > 0) {
          setStepCompleted(step.stepName, `Successfully synced entities`);
        } else {
          setStepCompleted(step.stepName, `No ${step.stepName} to sync`);
        }
      }

      // Handle cleanup step if present in response
      if (result.cleanup) {
        // Since we can't add steps dynamically, we'll show cleanup status in the final step message
        console.log('[LocalOnly] Processing cleanup result:', result.cleanup);

        if (result.cleanup.success) {
          console.log(`[LocalOnly] Cleanup successful: ${result.cleanup.totalDeleted} entities deleted`);
        } else {
          console.log('[LocalOnly] Cleanup had errors:', result.cleanup.errors);
        }
      }

      // Handle dashboard sync step if present in response
      if (result.dashboardSync) {
        console.log('[LocalOnly] Processing dashboard sync result:', {
          success: result.dashboardSync.success,
          error: result.dashboardSync.error
        });
      }

      // Complete the sync with comprehensive error handling
      const syncErrors = result.report?.errors || [];
      const cleanupErrors = result.cleanup?.errors || [];
      const dashboardSyncError = result.dashboardSync?.error ? [result.dashboardSync.error] : [];

      const allErrors = [...syncErrors, ...cleanupErrors, ...dashboardSyncError];
      const hasErrors = allErrors.length > 0;

      // Create a comprehensive completion message
      let completionMessage = 'Sync completed';
      if (result.cleanup?.totalDeleted > 0) {
        completionMessage += `, cleaned up ${result.cleanup.totalDeleted} local entities`;
      }
      if (result.dashboardSync?.success) {
        completionMessage += ', refreshed data from Broadstreet';
      }

      console.log('[LocalOnly] Completing sync with message:', completionMessage);
      completeSync(!hasErrors, allErrors.length > 0 ? allErrors : undefined);
      
    } catch (error) {
      console.error('Error syncing entities:', error);
      setStepFailed('dry-run', error instanceof Error ? error.message : 'Unknown error occurred');
      completeSync(false, [error instanceof Error ? error.message : 'Unknown error occurred']);
    }
  };

  const handleSyncComplete = () => {
    setProgressModalOpen(false);
    router.refresh();
  };

  const handleSyncRetry = () => {
    setProgressModalOpen(false);
    handleSyncAll();
  };

  const handleDeleteAll = async () => {
    const standalonePlacementsCount = data.placements.length;
    const confirmMessage = embeddedPlacementsCount > 0
      ? `Are you sure you want to delete ALL ${totalEntities} local entities? This includes ${standalonePlacementsCount} standalone placements and ${embeddedPlacementsCount} embedded placements. This action cannot be undone and will permanently remove all local creations.`
      : `Are you sure you want to delete ALL ${totalEntities} local entities? This action cannot be undone and will permanently remove all local creations.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeletingAll(true);
    try {
      const response = await fetch('/api/delete/local-all', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete all entities');
      }

      const result = await response.json();
      alert(`Successfully deleted all ${result.deleted} local entities.`);

      // Reset filters to prevent stale entity references
      resetFiltersAfterBulkDeletion(['all entities'], result.deleted || 0);

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Delete all error:', error);
      alert('Delete all failed. Please try again.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (totalEntities === 0) {
    return (
      <div className="space-y-8">
        {/* Audit Trail Button - Always Available */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Local Entities Summary</h2>
              <p className="text-gray-600 mt-1">
                No local entities found
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => router.push('/audit')}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
                data-testid="audit-button"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Audit Trail
              </Button>
            </div>
          </div>
        </div>

        {/* No Local Entities Message */}
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Local Entities</h3>
            <p className="text-gray-600 mb-4">
              You haven&apos;t created any local entities yet. Create zones, advertisers, campaigns, networks, or advertisements to see them here.
            </p>
            <Button onClick={() => router.push('/zones')} variant="outline">
              Create Your First Entity
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Local Entities Summary</h2>
            <p className="text-gray-600 mt-1">
              {totalEntities} local entities ready to sync to Broadstreet
              {embeddedPlacementsCount > 0 && (
                <span className="text-sm text-gray-500 block">
                  (includes {embeddedPlacementsCount} embedded placements)
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleSyncAll}
              disabled={isProgressModalOpen || isDeletingAll}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="sync-all-button"
            >
              <Upload className="h-4 w-4 mr-2" />
              Sync All to Broadstreet
            </Button>
            <Button
              onClick={() => router.push('/audit')}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
              data-testid="audit-button"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Audit Trail
            </Button>
            <Button
              onClick={handleDeleteAll}
              disabled={isProgressModalOpen || isDeletingAll || totalEntities === 0}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="delete-all-button"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeletingAll ? 'Deleting...' : 'Delete All Local'}
            </Button>
          </div>
        </div>
      </div>

      {/* Entity Sections */}
      <EntitySection
        title="Zones"
        entities={data.zones as any}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onDeleteSection={() => handleDeleteSection('zones')}
        isDeletingSection={isDeletingSection === 'zones'}
      />

      <EntitySection
        title="Advertisers"
        entities={data.advertisers as any}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onDeleteSection={() => handleDeleteSection('advertisers')}
        isDeletingSection={isDeletingSection === 'advertisers'}
      />

      <EntitySection
        title="Campaigns"
        entities={data.campaigns as any}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onDeleteSection={() => handleDeleteSection('campaigns')}
        isDeletingSection={isDeletingSection === 'campaigns'}
      />

      <EntitySection
        title="Networks"
        entities={data.networks as any}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onDeleteSection={() => handleDeleteSection('networks')}
        isDeletingSection={isDeletingSection === 'networks'}
      />

      <EntitySection
        title="Advertisements"
        entities={data.advertisements as any}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onDeleteSection={() => handleDeleteSection('advertisements')}
        isDeletingSection={isDeletingSection === 'advertisements'}
      />

      {/* Placements under Campaigns (embedded) */}
      {data.campaigns.some((c: any) => Array.isArray(c.placements) && c.placements.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Placements</h2>
            <Badge variant="outline" className="text-sm">
              {data.campaigns.reduce((total: number, c: any) => total + (c.placements?.length || 0), 0)} {data.campaigns.reduce((total: number, c: any) => total + (c.placements?.length || 0), 0) === 1 ? 'item' : 'items'}
            </Badge>
            <Button
              onClick={() => handleDeleteSection('placements')}
              disabled={isDeletingSection === 'placements'}
              variant="destructive"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {isDeletingSection === 'placements' ? 'Deleting...' : 'Delete All Placements'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.campaigns.flatMap((c: any) => (c.placements || []).map((p: any, idx: number) => (
              <Card key={`${c._id}-${p.advertisement_id}-${p.zone_id || p.zone_mongo_id || idx}`} className="p-4 border-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">Campaign: {c.name}</div>
                  <Badge variant="outline" className="text-xs">Local</Badge>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ad ID:</span>
                    <span className="font-medium">{p.advertisement_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zone:</span>
                    <span className="font-medium">{p.zone_id ?? p.zone_mongo_id}</span>
                  </div>
                  {Array.isArray(p.restrictions) && p.restrictions.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Restrictions:</span>
                      <span className="font-medium">{p.restrictions.join(', ')}</span>
                    </div>
                  )}
                </div>
              </Card>
            )))}
          </div>
        </div>
      )}

      {/* Local Placements from Collection */}
      {data.placements && data.placements.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Local Placements</h2>
            <Badge variant="outline" className="text-sm">
              {data.placements.length} {data.placements.length === 1 ? 'item' : 'items'}
            </Badge>
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
              Collection
            </Badge>
            <Button
              onClick={() => handleDeleteSection('placements')}
              disabled={isDeletingSection === 'placements'}
              variant="destructive"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {isDeletingSection === 'placements' ? 'Deleting...' : 'Delete All Placements'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.placements.map((placement) => (
              <LocalPlacementCard
                key={placement._id}
                placement={placement as any}
                networkMap={networkMap}
                advertiserMap={advertiserMap}
                allLocalEntities={data}
                onDelete={handleDelete}
                isDeleting={isDeleting === placement._id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        title="Sync & Refresh Workflow"
        steps={steps}
        currentStep={currentStep}
        overallProgress={overallProgress}
        isComplete={isComplete}
        hasErrors={hasErrors}
        onRetry={handleSyncRetry}
        onConfirm={handleSyncComplete}
        data-testid="progress-modal"
      />
    </div>
  );
}
