'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OpenListContent from './OpenListContent';
import { IAdvertisingRequest } from '@/lib/models/advertising-request';

interface OpenListClientProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * Open List Client Component
 * Handles client-side data fetching and state management for open requests
 */
export default function OpenListClient({ searchParams }: OpenListClientProps) {
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
  const createdRequestId = searchParams.created as string;

  const fetchRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: statusFilter === 'all' ? '' : statusFilter,
        search: searchQuery,
      });

      // Only show open requests (New and In Progress)
      if (!statusFilter || statusFilter === 'all') {
        params.set('status', 'New,In Progress');
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
  }, [currentPage, statusFilter, searchQuery]);

  const handleStatusUpdate = async (requestId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/advertising-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || `Status updated to ${newStatus}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh the list
      await fetchRequests();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/advertising-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete request');
      }

      // Refresh the list
      await fetchRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete request');
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    params.set('page', page.toString());
    router.push(`/sales/open-list?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to first page when filtering
    router.push(`/sales/open-list?${params.toString()}`);
  };

  return (
    <OpenListContent
      requests={requests}
      loading={loading}
      error={error}
      pagination={pagination}
      currentPage={currentPage}
      statusFilter={statusFilter}
      searchQuery={searchQuery}
      createdRequestId={createdRequestId}
      onStatusUpdate={handleStatusUpdate}
      onDelete={handleDelete}
      onPageChange={handlePageChange}
      onFilterChange={handleFilterChange}
      onRefresh={fetchRequests}
    />
  );
}
