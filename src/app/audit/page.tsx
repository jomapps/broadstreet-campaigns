'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, Calendar, Users, Target, Globe, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface AuditEntity {
  _id: string;
  name: string;
  type: 'advertiser' | 'campaign' | 'zone';
  entity_id: string;
  broadstreet_id: number;
  synced_at: string;
  created_at: string;
  network_id: number;
  [key: string]: any;
}

interface AuditSummary {
  total_synced: number;
  by_type: {
    advertisers: number;
    campaigns: number;
    zones: number;
  };
  recent_syncs: Array<{
    name: string;
    type: string;
    synced_at: string;
    broadstreet_id: number;
  }>;
}

interface AuditResponse {
  success: boolean;
  entities: AuditEntity[];
  summary: AuditSummary;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export default function AuditPage() {
  const [entities, setEntities] = useState<AuditEntity[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityType, setEntityType] = useState('all');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const data: Partial<AuditResponse> & { success?: boolean; message?: string } = await response.json();

      if (data.success) {
        setEntities((data.entities as any) || []);
        setSummary((data.summary as any) || null);
        setPagination((data.pagination as any) || { total: 0, limit: 50, offset: 0, has_more: false });
      } else {
        console.error('Failed to fetch audit data:', data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const handleSearch = () => {
    fetchAuditData(searchTerm, entityType, 0);
  };

  const handleTypeFilter = (type: string) => {
    setEntityType(type);
    fetchAuditData(searchTerm, type, 0);
  };

  const loadMore = () => {
    fetchAuditData(searchTerm, entityType, pagination.offset + pagination.limit);
  };

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

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'advertiser': return <Users className="h-4 w-4" />;
      case 'campaign': return <Calendar className="h-4 w-4" />;
      case 'zone': return <Target className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'advertiser': return 'bg-green-100 text-green-800';
      case 'campaign': return 'bg-purple-100 text-purple-800';
      case 'zone': return 'bg-blue-100 text-blue-800';
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
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/local-only">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Local Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-600">View all successfully synced entities</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {entities.map((entity) => (
                <div
                  key={entity.entity_id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getEntityIcon(entity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {entity.name}
                          </h3>
                          <Badge className={getEntityTypeColor(entity.type)}>
                            {entity.type}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Local ID:</span>
                            <p className="font-mono text-xs">{entity.entity_id}</p>
                          </div>
                          <div>
                            <span className="font-medium">Broadstreet ID:</span>
                            <p className="font-mono text-xs">{entity.broadstreet_id}</p>
                          </div>
                          <div>
                            <span className="font-medium">Network ID:</span>
                            <p className="font-mono text-xs">{entity.network_id}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
                          <div>
                            <span className="font-medium">Created:</span>
                            <p>{formatDate(entity.created_at)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Synced:</span>
                            <p className="text-green-600 font-medium">{formatDate(entity.synced_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
