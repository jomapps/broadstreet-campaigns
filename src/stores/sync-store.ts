/**
 * SYNC STORE - SYNC OPERATION STATE MANAGEMENT
 *
 * This store manages sync operation state and progress tracking.
 * All variable names follow docs/variable-origins.md registry.
 *
 * CRITICAL RULES:
 * 1. All variable names from docs/variable-origins.md registry
 * 2. Progress tracking with detailed phase information
 * 3. Error collection for comprehensive error reporting
 * 4. Uses TypeScript for proper type safety
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SyncState, SyncActions } from './types';

// Initial state with proper typing and comprehensive coverage
// Variable names follow docs/variable-origins.md registry
const initialState = {
  isActive: false,
  progress: 0,
  currentPhase: '',
  message: '',
  errors: [],
  lastSyncTime: null,
};

/**
 * Sync Store - Manages sync operation state and progress
 * Uses Zustand with Immer for immutable updates
 */
export const useSyncStore = create<SyncState & SyncActions>()(
  immer((set, get) => ({
    ...initialState,

    /**
     * Start sync operation - initializes sync state
     */
    startSync: () => set((state) => {
      state.isActive = true;
      state.progress = 0;
      state.currentPhase = 'initializing';
      state.message = 'Starting sync operation...';
      state.errors = [];
    }),

    /**
     * Update sync progress with phase and message
     */
    updateProgress: (progress, phase, message) => set((state) => {
      state.progress = Math.min(100, Math.max(0, progress));
      state.currentPhase = phase;
      state.message = message;
    }),

    /**
     * Add error to sync error collection
     */
    addError: (error) => set((state) => {
      state.errors.push(error);
    }),

    /**
     * Complete sync operation with success/failure status
     */
    completeSync: (success) => set((state) => {
      state.isActive = false;
      state.progress = 100;
      state.currentPhase = success ? 'completed' : 'failed';
      state.message = success 
        ? 'Sync completed successfully' 
        : `Sync failed with ${state.errors.length} error(s)`;
      state.lastSyncTime = new Date();
    }),

    /**
     * Reset sync state to initial values
     */
    resetSync: () => set(() => ({
      ...initialState,
    })),

    // Additional utility methods for sync management

    /**
     * Check if sync is currently running
     * @returns {boolean} True if sync is active
     */
    isSyncRunning: () => {
      const state = get();
      return state.isActive;
    },

    /**
     * Get sync summary for display
     * @returns {Object} Sync summary object
     */
    getSyncSummary: () => {
      const state = get();
      return {
        isActive: state.isActive,
        progress: state.progress,
        phase: state.currentPhase,
        message: state.message,
        errorCount: state.errors.length,
        lastSync: state.lastSyncTime,
        hasErrors: state.errors.length > 0,
      };
    },

    /**
     * Get all sync errors
     * @returns {string[]} Array of error messages
     */
    getSyncErrors: () => {
      const state = get();
      return [...state.errors];
    },

    /**
     * Clear sync errors without affecting other state
     */
    clearSyncErrors: () => set((state) => {
      state.errors = [];
    }),

    /**
     * Update sync phase without changing progress
     */
    updatePhase: (phase, message) => set((state) => {
      state.currentPhase = phase;
      state.message = message;
    }),

    /**
     * Set sync progress without changing phase
     */
    setProgress: (progress) => set((state) => {
      state.progress = Math.min(100, Math.max(0, progress));
    }),

    /**
     * Increment progress by specified amount
     */
    incrementProgress: (increment) => set((state) => {
      state.progress = Math.min(100, state.progress + increment);
    }),

    /**
     * Check if sync has completed (successfully or with errors)
     * @returns {boolean} True if sync has completed
     */
    isSyncCompleted: () => {
      const state = get();
      return !state.isActive && state.progress === 100;
    },

    /**
     * Check if sync completed successfully (no errors)
     * @returns {boolean} True if sync completed without errors
     */
    isSyncSuccessful: () => {
      const state = get();
      return !state.isActive && 
             state.progress === 100 && 
             state.errors.length === 0 &&
             state.currentPhase === 'completed';
    },

    /**
     * Get time since last sync in human-readable format
     * @returns {string|null} Time since last sync or null if never synced
     */
    getTimeSinceLastSync: () => {
      const state = get();
      if (!state.lastSyncTime) return null;

      const now = new Date();
      const diffMs = now.getTime() - state.lastSyncTime.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    },

    /**
     * Get sync status for UI display
     * @returns {Object} Status object with display properties
     */
    getSyncStatus: () => {
      const state = get();
      
      if (state.isActive) {
        return {
          status: 'running',
          color: 'blue',
          icon: 'loading',
          text: `${state.currentPhase} (${state.progress}%)`,
          description: state.message,
        };
      }

      if (state.errors.length > 0) {
        return {
          status: 'error',
          color: 'red',
          icon: 'error',
          text: 'Sync failed',
          description: `${state.errors.length} error(s) occurred`,
        };
      }

      if (state.lastSyncTime) {
        const timeSince = get().getTimeSinceLastSync();
        return {
          status: 'success',
          color: 'green',
          icon: 'success',
          text: 'Sync completed',
          description: `Last synced ${timeSince}`,
        };
      }

      return {
        status: 'idle',
        color: 'gray',
        icon: 'idle',
        text: 'Not synced',
        description: 'No sync has been performed',
      };
    },
  }))
);
