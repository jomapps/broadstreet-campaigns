/**
 * AUDIT CONTENT - MAIN AUDIT UI
 * 
 * Main audit content component that displays audit data and handles interactions.
 * Reads data from props (since audit data is complex and doesn't fit well in global state).
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { Search, Calendar, Users, Target, Globe, Trash2, AlertTriangle } from 'lucide-react';

/**
 * Map audit entity to universal card props
 * Variable names follow docs/variable-origins.md registry
 */
function mapAuditEntityToUniversalProps(entity: any) {
  const entityTypeMap = {
    'advertiser': 'advertiser' as const,
    'campaign': 'campaign' as const,
    'zone': 'zone' as const,
  };

  // Format dates in dd/mm/yy format according to design specs
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    title: entity.name,
    broadstreet_id: entity.broadstreet_id,
    mongo_id: entity.entity_id, // entity_id is the MongoDB ID in audit context
    entityType: entityTypeMap[entity.type],
    isLocal: false, // Audit entities are always synced
    statusBadge: {
      label: 'Synced',
      variant: 'success' as const,
    },
    displayData: [
      {
        label: 'Local ID',
        value: entity.entity_id,
        type: 'string' as const
      },
      {
        label: 'Broadstreet ID',
        value: entity.broadstreet_id,
        type: 'number' as const
      },
      {
        label: 'Network ID',
        value: entity.network_id,
        type: 'number' as const
      },
      {
        label: 'Created',
        value: formatDate(entity.created_at),
        type: 'string' as const
      },
      {
        label: 'Synced',
        value: formatDateTime(entity.synced_at),
        type: 'string' as const,
        className: 'text-green-600 font-medium'
      },
    ],
    testId: `audit-entity-${entity.entity_id}`,
    variant: 'compact' as const,
  };
}

/**
 * AuditContent - Main audit display component
 * Variable names follow docs/variable-origins.md registry
 */
export default function AuditContent({ initialData, searchParams }: { initialData: any; searchParams: any }) {
  const [entities, setEntities] = useState(initialData?.entities || []);
  const [summary, setSummary] = useState(initialData?.summary || null);
  const [pagination, setPagination] = useState(initialData?.pagination || { total: 0, limit: 50, offset: 0, has_more: false });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams?.search || '');
  const [entityType, setEntityType] = useState(searchParams?.type || 'all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Fetch audit data function
  const fetchAuditData = async (search = '', type = 'all', offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        type: type === 'all' ? '' : type,
        limit: '50',
        offset: offset.toString()
      });

      const response = await fetch(`/api/audit/synced-entities?${params}`);
      const data = await response.json();

      if (data.success) {
        setEntities(data.entities || []);
        setSummary(data.summary || null);
        setPagination(data.pagination || { total: 0, limit: 50, offset: 0, has_more: false });
      } else {
        console.error('Failed to fetch audit data:', data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (entityType !== 'all') params.set('type', entityType);
    
    router.push(`/audit?${params.toString()}`);
    fetchAuditData(searchTerm, entityType, 0);
  };

  // Handle type filter
  const handleTypeFilter = (type: string) => {
    setEntityType(type);
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (type !== 'all') params.set('type', type);
    
    router.push(`/audit?${params.toString()}`);
    fetchAuditData(searchTerm, type, 0);
  };

  // Load more entities
  const loadMore = () => {
    fetchAuditData(searchTerm, entityType, pagination.offset + pagination.limit);
  };

  // Handle delete all
  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/audit/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the audit data
        await fetchAuditData();
        setShowDeleteConfirm(false);
        alert(`Successfully deleted ${data.deleted_counts.total} synced entities`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting audit data:', error);
      alert('Error deleting audit data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Delete All Button */}
      <div className="flex justify-end">
        {summary && summary.total_synced > 0 && (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Audit Data
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Synced</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_synced}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Advertisers</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.by_type.advertisers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.by_type.campaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Zones</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.by_type.zones}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search synced entities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={entityType} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="advertiser">Advertisers</SelectItem>
                <SelectItem value="campaign">Campaigns</SelectItem>
                <SelectItem value="zone">Zones</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch} className="w-full md:w-auto">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entities List */}
      <Card>
        <CardHeader>
          <CardTitle>Synced Entities</CardTitle>
          <CardDescription>
            Showing {entities.length} of {pagination.total} synced entities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : entities.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No synced entities found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entities.map((entity: any) => (
                <UniversalEntityCard
                  key={entity.entity_id}
                  {...mapAuditEntityToUniversalProps(entity)}
                />
              ))}
              
              {pagination.has_more && (
                <div className="text-center pt-4">
                  <Button onClick={loadMore} variant="outline">
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete All Audit Data</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                This will permanently delete all synced entities from the local database:
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• {summary?.by_type.advertisers || 0} Advertisers</li>
                <li>• {summary?.by_type.campaigns || 0} Campaigns</li>
                <li>• {summary?.by_type.zones || 0} Zones</li>
                <li>• Total: {summary?.total_synced || 0} entities</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAll}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
