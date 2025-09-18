'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressModal, useSyncProgress } from '@/components/ui/progress-modal';
import { X, Upload, Trash2, Calendar, Globe, Users, Target, Image, FileText } from 'lucide-react';

import { EntityIdBadge } from '@/components/ui/entity-id-badge';
import { getEntityId } from '@/lib/utils/entity-helpers';
import { cardStateClasses } from '@/lib/ui/cardStateClasses';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';

// Type for local entity data
type LocalEntity = {
  _id: string;
  name: string;
  network_id: number | string;
  created_at: string;
  synced_with_api: boolean;
  type: 'zone' | 'advertiser' | 'campaign' | 'network' | 'advertisement';
  broadstreet_id?: number;
  mongo_id?: string;
  [key: string]: any;
};

type LocalOnlyData = {
  zones: LocalEntity[];
  advertisers: LocalEntity[];
  campaigns: LocalEntity[];
  networks: LocalEntity[];
  advertisements: LocalEntity[];
  placements: Array<{
    _id: string;
    network_id: number;
    advertiser_id: number;
    advertisement_id: number;
    campaign_id?: number;
    campaign_mongo_id?: string;
    zone_id?: number;
    zone_mongo_id?: string;
    restrictions?: string[];
    created_at?: string;
    type: 'placement';
  }>;
};

interface LocalOnlyDashboardProps {
  data: LocalOnlyData;
  networkMap: Map<number, string>;
  advertiserMap: Map<number, string>;
}

function mapLocalEntityToCardProps(
  entity: LocalEntity,
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
  entities: LocalEntity[];
  networkMap: Map<number, string>;
  advertiserMap: Map<number, string>;
  onDelete: (entityId: string, type: string) => void;
  selectedIds: Set<string>;
  onToggleSelection: (entityId: string) => void;
}

function EntitySection({ title, entities, networkMap, advertiserMap, onDelete, selectedIds, onToggleSelection }: EntitySectionProps) {
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entities.map((entity) => (
          <UniversalEntityCard
            key={entity._id}
            {...mapLocalEntityToCardProps(entity, {
              networkName: networkMap.get(
              typeof entity.network_id === 'string' ? Number(entity.network_id) : entity.network_id
              ),
              advertiserName: entity.type === 'campaign'
              ? advertiserMap.get(
                  typeof (entity as any).advertiser_id === 'string'
                    ? Number((entity as any).advertiser_id)
                    : (entity as any).advertiser_id
                )
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
  onDelete,
  isDeleting
}: {
  placement: LocalOnlyData['placements'][0];
  networkMap: Map<number, string>;
  advertiserMap: Map<number, string>;
  onDelete: (entityId: string) => void;
  isDeleting: boolean;
}) {
  const networkName = networkMap.get(placement.network_id) || `Network ${placement.network_id}`;
  const advertiserName = advertiserMap.get(placement.advertiser_id) || `Advertiser ${placement.advertiser_id}`;

  return (
    <UniversalEntityCard
      title={`Local Placement`}
      entityType="placement"
      isLocal={true}
      displayData={[
        { label: 'Network', value: networkName, type: 'string' as const },
        { label: 'Advertiser', value: advertiserName, type: 'string' as const },
        { label: 'Ad ID', value: String(placement.advertisement_id), type: 'string' as const },
        { label: 'Campaign', value: placement.campaign_id ? `Campaign ${placement.campaign_id}` : (placement.campaign_mongo_id || 'N/A'), type: 'string' as const },
        { label: 'Zone', value: placement.zone_id ? `Zone ${placement.zone_id}` : (placement.zone_mongo_id || 'N/A'), type: 'string' as const },
        placement.restrictions && placement.restrictions.length > 0 ? { label: 'Restrictions', value: placement.restrictions.join(', '), type: 'string' as const } : undefined,
      ].filter(Boolean) as any}
      onDelete={() => onDelete(placement._id)}
    />
  );
}

export default function LocalOnlyDashboard({ data, networkMap, advertiserMap }: LocalOnlyDashboardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
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

  const totalEntities = data.zones.length + data.advertisers.length + data.campaigns.length + data.networks.length + data.advertisements.length + data.placements.length;

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

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error(`Error deleting ${entityType}:`, error);
      alert(`Failed to delete ${entityType}. Please try again.`);
    } finally {
      setIsDeleting(null);
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

    // Initialize progress modal with entity counts for all unsynced local entities
    const entityCounts = {
      networks: data.networks.filter(n => !n.synced_with_api).length,
      advertisers: data.advertisers.filter(a => !a.synced_with_api).length,
      zones: data.zones.filter(z => !z.synced_with_api).length,
      advertisements: data.advertisements.filter(ad => !ad.synced_with_api).length,
      campaigns: data.campaigns.filter(c => !c.synced_with_api).length,
    };
    console.info('[LocalOnly] Computed unsynced counts', entityCounts);

    initializeStepsWithCleanup(entityCounts);
    setProgressModalOpen(true);

    try {
      // Start dry run validation
      setStepInProgress('dry-run');

      // Sync all local entities regardless of network selection
      console.info('[LocalOnly] Starting sync of all local entities');

      const response = await fetch('/api/sync/local-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      console.info('[LocalOnly] Sent sync request for all local entities');

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
    if (!confirm(`Are you sure you want to delete ALL ${totalEntities} local entities? This action cannot be undone and will permanently remove all local creations.`)) {
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
        entities={data.zones}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
      />

      <EntitySection
        title="Advertisers"
        entities={data.advertisers}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
      />

      <EntitySection
        title="Campaigns"
        entities={data.campaigns}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
      />

      <EntitySection
        title="Networks"
        entities={data.networks}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
      />

      <EntitySection
        title="Advertisements"
        entities={data.advertisements}
        networkMap={networkMap}
        advertiserMap={advertiserMap}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
      />

      {/* Placements under Campaigns (embedded) */}
      {data.campaigns.some((c: any) => Array.isArray(c.placements) && c.placements.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Placements (Local Embedded)</h2>
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
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
              Collection
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.placements.map((placement) => (
              <LocalPlacementCard
                key={placement._id}
                placement={placement}
                networkMap={networkMap}
                advertiserMap={advertiserMap}
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
