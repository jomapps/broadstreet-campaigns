'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressModal, useSyncProgress } from '@/components/ui/progress-modal';
import { X, Upload, Trash2, Calendar, Globe, Users, Target, Image, FileText } from 'lucide-react';
import { useSelectedEntities } from '@/lib/hooks/use-selected-entities';
import { cardStateClasses } from '@/lib/ui/cardStateClasses';

// Type for local entity data
type LocalEntity = {
  _id: string;
  name: string;
  network_id: number;
  created_at: string;
  synced_with_api: boolean;
  type: 'zone' | 'advertiser' | 'campaign' | 'network' | 'advertisement';
  [key: string]: any;
};

type LocalOnlyData = {
  zones: LocalEntity[];
  advertisers: LocalEntity[];
  campaigns: LocalEntity[];
  networks: LocalEntity[];
  advertisements: LocalEntity[];
};

interface LocalOnlyDashboardProps {
  data: LocalOnlyData;
  networkMap: Map<number, string>;
  advertiserMap: Map<number, string>;
}

interface EntityCardProps {
  entity: LocalEntity;
  networkName?: string;
  advertiserName?: string;
  onDelete: (id: string, type: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

function EntityCard({ entity, networkName, advertiserName, onDelete, isSelected = false, onToggleSelection }: EntityCardProps) {
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'zone': return <Target className="h-4 w-4" />;
      case 'advertiser': return <Users className="h-4 w-4" />;
      case 'campaign': return <Calendar className="h-4 w-4" />;
      case 'network': return <Globe className="h-4 w-4" />;
      case 'advertisement': return <Image className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'zone': return 'bg-blue-100 text-blue-800';
      case 'advertiser': return 'bg-green-100 text-green-800';
      case 'campaign': return 'bg-purple-100 text-purple-800';
      case 'network': return 'bg-indigo-100 text-indigo-800';
      case 'advertisement': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, label')) return;
    onToggleSelection?.(entity._id);
  };

  return (
    <Card 
      className={`relative p-4 border-2 transition-all duration-200 ${cardStateClasses({ isLocal: true, isSelected })}`}
      data-testid="entity-card"
      {...(entity.type === 'campaign' && (entity as any).original_broadstreet_id
        ? { 'data-testid': `local-campaign-${(entity as any).original_broadstreet_id}` } as any
        : {})}
      onClick={handleCardClick}
    >
      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={(e) => { e.stopPropagation(); onDelete(entity._id, entity.type); }}
        data-testid="delete-button"
      >
        <X className="h-4 w-4" />
      </Button>

      {isSelected && (
        <span className="absolute top-2 left-2 px-2 py-1 text-xs rounded-full bg-blue-500 text-white font-semibold">
          ✓ Selected
        </span>
      )}

      {/* Header */}
      <div className="flex items-start space-x-3 mb-3">
        <div className="flex-shrink-0">
          {getEntityIcon(entity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {entity.name}
            </h3>
            <Badge className={`text-xs ${getEntityTypeColor(entity.type)}`}>
              {entity.type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              NET: {entity.network_id}
            </Badge>
            <Badge variant={entity.synced_with_api ? 'secondary' : 'outline'} className={`text-xs ${entity.synced_with_api ? 'bg-green-100 text-green-800' : ''}`}>
              {entity.synced_with_api ? 'Synced' : 'Not Synced'}
            </Badge>
          </div>
          {networkName && (
            <p className="text-sm text-gray-600">Network: {networkName}</p>
          )}
        </div>
      </div>

      {/* Entity-specific details */}
      <div className="space-y-2 text-sm">
        {entity.type === 'zone' && (
          <>
            {entity.alias && (
              <div className="flex justify-between">
                <span className="text-gray-600">Alias:</span>
                <span className="font-medium">{entity.alias}</span>
              </div>
            )}
            {entity.width && entity.height && (
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{entity.width}x{entity.height}px</span>
              </div>
            )}
            {entity.self_serve && (
              <Badge variant="secondary" className="text-xs">Self Serve</Badge>
            )}
          </>
        )}

        {entity.type === 'advertiser' && (
          <>
            {entity.web_home_url && (
              <div className="flex justify-between">
                <span className="text-gray-600">Website:</span>
                <span className="font-medium truncate max-w-32">{entity.web_home_url}</span>
              </div>
            )}
            {entity.admins && entity.admins.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Admins:</span>
                <span className="font-medium">{entity.admins.length}</span>
              </div>
            )}
          </>
        )}

        {entity.type === 'campaign' && (
          <>
            {/* Campaign Dates */}
            {entity.start_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium text-sm">{formatDate(entity.start_date)}</span>
              </div>
            )}
            {entity.end_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium text-sm">{formatDate(entity.end_date)}</span>
              </div>
            )}
            
            {/* Campaign Settings */}
            {entity.weight !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Weight:</span>
                <span className="font-medium text-sm">
                  {entity.weight === 0 ? 'Remnant (0)' :
                   entity.weight === 0.5 ? 'Low (0.5)' :
                   entity.weight === 1 ? 'Default (1)' :
                   entity.weight === 1.5 ? 'High (1.5)' :
                   entity.weight === 127 ? 'Sponsorship (127)' :
                   entity.weight}
                </span>
              </div>
            )}
            
            {/* Advertiser */}
            {entity.advertiser_id && (
              <div className="flex justify-between">
                <span className="text-gray-600">Advertiser:</span>
                <div className="text-right">
                  <div className="font-medium text-sm">{advertiserName || `ID: ${entity.advertiser_id}`}</div>
                  {advertiserName && (
                    <div className="text-xs text-gray-500">ID: {entity.advertiser_id}</div>
                  )}
                </div>
              </div>
            )}
            
            {/* Campaign Limits */}
            {entity.max_impression_count && (
              <div className="flex justify-between">
                <span className="text-gray-600">Max Impressions:</span>
                <span className="font-medium text-sm">{entity.max_impression_count.toLocaleString()}</span>
              </div>
            )}

            {/* Placement Count */}
            {Array.isArray((entity as any).placements) && (entity as any).placements.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Placements:</span>
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  {...((entity as any).original_broadstreet_id
                    ? { 'data-testid': `campaign-placements-count-${(entity as any).original_broadstreet_id}` } as any
                    : {})}
                >
                  {(entity as any).placements.length}
                </Badge>
              </div>
            )}
            
            {/* Display Settings */}
            {(entity.display_type || entity.pacing_type) && (
              <div className="border-t border-orange-200 pt-2 mt-2">
                <div className="text-xs text-gray-500 mb-1">Display Settings:</div>
                {entity.display_type && entity.display_type !== 'no_repeat' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Display:</span>
                    <Badge variant="outline" className="text-xs">
                      {entity.display_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                )}
                {entity.pacing_type && entity.pacing_type !== 'asap' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Pacing:</span>
                    <Badge variant="outline" className="text-xs">
                      {entity.pacing_type}
                    </Badge>
                  </div>
                )}
              </div>
            )}
            
            {/* Status Indicators */}
            <div className="border-t border-orange-200 pt-2 mt-2">
              <div className="flex flex-wrap gap-1">
                {entity.active && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Active
                  </Badge>
                )}
                {entity.paused && (
                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                    Paused
                  </Badge>
                )}
                {entity.archived && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                    Archived
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        {entity.type === 'network' && (
          <>
            {entity.web_home_url && (
              <div className="flex justify-between">
                <span className="text-gray-600">Website:</span>
                <span className="font-medium truncate max-w-32">{entity.web_home_url}</span>
              </div>
            )}
            {entity.valet_active && (
              <Badge variant="secondary" className="text-xs">Valet Active</Badge>
            )}
          </>
        )}

        {entity.type === 'advertisement' && (
          <>
            {entity.type && (
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{entity.type}</span>
              </div>
            )}
            {entity.preview_url && (
              <div className="flex justify-between">
                <span className="text-gray-600">Preview:</span>
                <span className="font-medium truncate max-w-32">{entity.preview_url}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-orange-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Created: {formatDate(entity.created_at)}</span>
          <span>ID: {entity._id.slice(-8)}</span>
        </div>
      </div>
    </Card>
  );
}

interface EntitySectionProps {
  title: string;
  entities: LocalEntity[];
  networkMap: Map<number, string>;
  advertiserMap: Map<number, string>;
  onDelete: (id: string, type: string) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
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
          <EntityCard
            key={entity._id}
            entity={entity}
            networkName={networkMap.get(entity.network_id)}
            advertiserName={entity.type === 'campaign' ? advertiserMap.get(entity.advertiser_id) : undefined}
            onDelete={onDelete}
            isSelected={selectedIds.has(entity._id)}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
    </div>
  );
}

export default function LocalOnlyDashboard({ data, networkMap, advertiserMap }: LocalOnlyDashboardProps) {
  const router = useRouter();
  const entities = useSelectedEntities();
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

  const totalEntities = data.zones.length + data.advertisers.length + data.campaigns.length + data.networks.length + data.advertisements.length;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/delete/${type}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entity');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error deleting entity:', error);
      alert('Failed to delete entity. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSyncAll = async () => {
    if (!confirm(`Are you sure you want to sync all ${totalEntities} local entities to Broadstreet? This may take a few minutes.`)) {
      return;
    }

    // Initialize progress modal with entity counts for the selected network and unsynced only
    const entityCounts = (() => {
      if (!entities.network) {
        return { networks: 0, advertisers: 0, zones: 0, advertisements: 0, campaigns: 0 };
      }
      const nid = entities.network.id;
      const advertisers = data.advertisers.filter(a => a.network_id === nid && !a.synced_with_api).length;
      const zones = data.zones.filter(z => z.network_id === nid && !z.synced_with_api).length;
      const campaigns = data.campaigns.filter(c => c.network_id === nid && !c.synced_with_api).length;
      const networks = data.networks.filter(n => (n as any).id === nid && !(n as any).synced_with_api).length;
      const advertisements = data.advertisements.filter(ad => ad.network_id === nid && !ad.synced_with_api).length;
      // Debug log to help audit
      console.info('[LocalOnly] Computed unsynced counts', { nid, advertisers, zones, campaigns, networks, advertisements });
      return { advertisers, zones, campaigns, networks, advertisements };
    })();
    
    initializeSteps(entityCounts);
    setProgressModalOpen(true);

    try {
      // Start dry run validation
      setStepInProgress('dry-run');
      
      // Use network selection from the sidebar as the single source of truth
      if (!entities.network) {
        throw new Error('Select a network in the sidebar before syncing');
      }
      const selectedNetworkId = entities.network.id;

      const response = await fetch('/api/sync/local-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkId: selectedNetworkId }),
      });
      console.info('[LocalOnly] Sent sync request body:', { networkId: selectedNetworkId });

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

      // Simulate step-by-step progress based on API response
      const syncSteps = [
        { id: 'networks', count: result.synced?.networks || 0 },
        { id: 'advertisers', count: result.synced?.advertisers || 0 },
        { id: 'zones', count: result.synced?.zones || 0 },
        { id: 'advertisements', count: result.synced?.advertisements || 0 },
        { id: 'campaigns', count: result.synced?.campaigns || 0 }
      ];

      // Simulate progress for each step
      for (const step of syncSteps) {
        setStepInProgress(step.id);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
        
        if (step.count > 0) {
          setStepCompleted(step.id, `Successfully synced ${step.count} ${step.id}`);
        } else {
          setStepCompleted(step.id, `No ${step.id} to sync`);
        }
      }

      // Complete the sync
      const hasErrors = result.errors && result.errors.length > 0;
      completeSync(!hasErrors, result.errors);
      
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

      {/* Progress Modal */}
      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        title="Syncing to Broadstreet"
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
