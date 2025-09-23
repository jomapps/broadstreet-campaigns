'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuditLogContent from './AuditLogContent';
import { IAdvertisingRequest } from '@/lib/models/advertising-request';

interface AuditLogClientProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * Audit Log Client Component
 * Handles client-side data fetching and state management for completed/cancelled requests
 */
export default function AuditLogClient({ searchParams }: AuditLogClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<IAdvertisingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Extract filters from search params
  const currentPage = parseInt((searchParams.page as string) || '1');
  const statusFilter = (searchParams.status as string) || '';
  const searchQuery = (searchParams.search as string) || '';
  const dateRange = (searchParams.dateRange as string) || '';

  const fetchRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchQuery,
      });

      // Only show completed and cancelled requests for audit log
      if (statusFilter && (statusFilter === 'Completed' || statusFilter === 'Cancelled')) {
        params.set('status', statusFilter);
      } else {
        params.set('status', 'Completed,Cancelled');
      }

      // Add date range filter if specified
      if (dateRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0); // All time
        }
        
        params.set('startDate', startDate.toISOString());
      }

      const response = await fetch(`/api/advertising-requests?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.requests);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage, statusFilter, searchQuery, dateRange]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    params.set('page', page.toString());
    router.push(`/sales/audit-log?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to first page when filtering
    router.push(`/sales/audit-log?${params.toString()}`);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter || 'Completed,Cancelled',
        search: searchQuery,
        export: 'csv',
      });

      if (dateRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        params.set('startDate', startDate.toISOString());
      }

      const response = await fetch(`/api/advertising-requests?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `advertising-requests-audit-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  return (
    <AuditLogContent
      requests={requests}
      loading={loading}
      error={error}
      pagination={pagination}
      currentPage={currentPage}
      statusFilter={statusFilter}
      searchQuery={searchQuery}
      dateRange={dateRange}
      onPageChange={handlePageChange}
      onFilterChange={handleFilterChange}
      onRefresh={fetchRequests}
      onExport={handleExport}
    />
  );
}
