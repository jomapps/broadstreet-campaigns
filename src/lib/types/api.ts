// API-related types shared between API routes and client code

/**
 * Sync status interface for the sync status API endpoint
 * Used by /api/sync/status and sync status monitoring components
 */
export interface SyncStatus {
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
