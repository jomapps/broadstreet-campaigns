'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  RefreshCw, 
  Download,
  Archive,
  Calendar,
  Filter
} from 'lucide-react';
import { IAdvertisingRequest } from '@/lib/models/advertising-request';
import AuditRequestCard from './AuditRequestCard';
import { Pagination } from '@/components/ui/pagination';

interface AuditLogContentProps {
  requests: IAdvertisingRequest[];
  loading: boolean;
  error: string;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  currentPage: number;
  statusFilter: string;
  searchQuery: string;
  dateRange: string;
  onPageChange: (page: number) => void;
  onFilterChange: (key: string, value: string) => void;
  onRefresh: () => Promise<void>;
  onExport: () => Promise<void>;
}

/**
 * Audit Log Content Component
 * Displays the list of completed and cancelled advertising requests
 */
export default function AuditLogContent({
  requests,
  loading,
  error,
  pagination,
  currentPage,
  statusFilter,
  searchQuery,
  dateRange,
  onPageChange,
  onFilterChange,
  onRefresh,
  onExport,
}: AuditLogContentProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [exporting, setExporting] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange('search', localSearch);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport();
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-64 h-10 bg-gray-200 rounded"></div>
              <div className="w-32 h-10 bg-gray-200 rounded"></div>
              <div className="w-32 h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-10 bg-gray-200 rounded"></div>
              <div className="w-24 h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          {/* Request cards skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <div className="w-48 h-6 bg-gray-200 rounded"></div>
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-36 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  <div className="w-28 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-18 h-4 bg-gray-200 rounded"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search requests..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Closed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {requests.length} of {pagination.totalCount} requests
        </span>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No completed requests</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter || dateRange
              ? 'No requests match your current filters.' 
              : 'There are no completed or cancelled requests yet.'
            }
          </p>
          {(searchQuery || statusFilter || dateRange) && (
            <Button 
              variant="outline" 
              onClick={() => {
                onFilterChange('search', '');
                onFilterChange('status', '');
                onFilterChange('dateRange', '');
                setLocalSearch('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <AuditRequestCard
              key={String(request._id)}
              request={request}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          totalItems={pagination.totalCount}
          itemsPerPage={pagination.limit}
          currentPage={pagination.page}
          onPageChange={onPageChange}
          showItemsPerPageSelector={false}
        />
      )}
    </div>
  );
}
