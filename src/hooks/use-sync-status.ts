'use client';

import { useState, useEffect, useCallback } from 'react';

// Simple toast notification function
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-lg text-white font-medium max-w-sm transition-all duration-300 transform translate-x-full`;

  // Set background color based on type
  switch (type) {
    case 'success':
      toast.className += ' bg-green-600';
      break;
    case 'error':
      toast.className += ' bg-red-600';
      break;
    case 'info':
    default:
      toast.className += ' bg-blue-600';
      break;
  }

  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 5000);
};

export interface SyncStatusData {
  status: 'connected' | 'syncing' | 'validating' | 'error';
  message: string;
  details?: {
    syncInProgress?: boolean;
    validationInProgress?: boolean;
    validationStatus?: any;
    error?: string;
  };
  timestamp: string;
}

export interface UseSyncStatusReturn {
  status: SyncStatusData;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  triggerSyncMonitoring: () => void; // New function to start monitoring after sync
}

const DEFAULT_STATUS: SyncStatusData = {
  status: 'connected',
  message: 'API Connected',
  timestamp: new Date().toISOString()
};

export function useSyncStatus(pollInterval: number = 30000): UseSyncStatusReturn {
  const [status, setStatus] = useState<SyncStatusData>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollTimer, setPollTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastStatus, setLastStatus] = useState<string>('connected');

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/sync/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.status) {
        const newStatus = data.status;
        setStatus(newStatus);

        // Show toast notifications for status changes
        if (newStatus.status !== lastStatus) {
          switch (newStatus.status) {
            case 'validating':
              showToast('Theme validation started - checking zone references...', 'info');
              break;
            case 'connected':
              if (lastStatus === 'validating') {
                showToast('Theme validation completed successfully!', 'success');
              }
              break;
            case 'error':
              const errorMsg = newStatus.details?.error || 'Unknown error occurred';
              showToast(`Sync/Validation Error: ${errorMsg}`, 'error');
              break;
          }
          setLastStatus(newStatus.status);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch sync status');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useSyncStatus] Failed to fetch status:', errorMessage);

      // Set error status
      setStatus({
        status: 'error',
        message: 'API Error',
        details: { error: errorMessage },
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  }, [lastStatus]);

  const startPolling = useCallback(() => {
    if (isPolling) return;
    
    setIsPolling(true);
    
    // Fetch immediately
    fetchStatus();
    
    // Set up polling
    const timer = setInterval(() => {
      fetchStatus();
    }, pollInterval);
    
    setPollTimer(timer);
  }, [fetchStatus, pollInterval, isPolling]);

  const stopPolling = useCallback(() => {
    if (pollTimer) {
      clearInterval(pollTimer);
      setPollTimer(null);
    }
    setIsPolling(false);
  }, [pollTimer]);

  const triggerSyncMonitoring = useCallback(() => {
    console.log('[useSyncStatus] Sync monitoring triggered - starting polling');
    startPolling();
  }, [startPolling]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        setPollTimer(null);
      }
      setIsPolling(false);
    };
  }, [pollTimer]);

  return {
    status,
    isLoading,
    error,
    refresh: fetchStatus,
    startPolling,
    stopPolling,
    triggerSyncMonitoring
  };
}
