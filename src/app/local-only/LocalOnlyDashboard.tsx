'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Trash2, Calendar, Globe, Users, Target, Image } from 'lucide-react';

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
}

interface EntityCardProps {
  entity: LocalEntity;
  networkName?: string;
  onDelete: (id: string, type: string) => void;
}

function EntityCard({ entity, networkName, onDelete }: EntityCardProps) {
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

  return (
    <Card className="relative p-4 border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 shadow-orange-200 hover:shadow-orange-300 transition-all duration-200 hover:scale-[1.02]">
      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={() => onDelete(entity._id, entity.type)}
      >
        <X className="h-4 w-4" />
      </Button>

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
            {entity.start_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">Start:</span>
                <span className="font-medium">{entity.start_date}</span>
              </div>
            )}
            {entity.end_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">End:</span>
                <span className="font-medium">{entity.end_date}</span>
              </div>
            )}
            {entity.max_impression_count && (
              <div className="flex justify-between">
                <span className="text-gray-600">Max Impressions:</span>
                <span className="font-medium">{entity.max_impression_count.toLocaleString()}</span>
              </div>
            )}
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
  onDelete: (id: string, type: string) => void;
}

function EntitySection({ title, entities, networkMap, onDelete }: EntitySectionProps) {
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
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default function LocalOnlyDashboard({ data, networkMap }: LocalOnlyDashboardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const totalEntities = data.zones.length + data.advertisers.length + data.campaigns.length + data.networks.length + data.advertisements.length;

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

    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync/local-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync entities');
      }

      const result = await response.json();
      alert(`Sync completed! ${result.synced} entities synced successfully.`);
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error syncing entities:', error);
      alert('Failed to sync entities. Please try again.');
    } finally {
      setIsSyncing(false);
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
            You haven't created any local entities yet. Create zones, advertisers, campaigns, networks, or advertisements to see them here.
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
          <Button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isSyncing ? 'Syncing...' : 'Sync All to Broadstreet'}
          </Button>
        </div>
      </div>

      {/* Entity Sections */}
      <EntitySection
        title="Zones"
        entities={data.zones}
        networkMap={networkMap}
        onDelete={handleDelete}
      />

      <EntitySection
        title="Advertisers"
        entities={data.advertisers}
        networkMap={networkMap}
        onDelete={handleDelete}
      />

      <EntitySection
        title="Campaigns"
        entities={data.campaigns}
        networkMap={networkMap}
        onDelete={handleDelete}
      />

      <EntitySection
        title="Networks"
        entities={data.networks}
        networkMap={networkMap}
        onDelete={handleDelete}
      />

      <EntitySection
        title="Advertisements"
        entities={data.advertisements}
        networkMap={networkMap}
        onDelete={handleDelete}
      />
    </div>
  );
}
