/**
 * ZUSTAND STORES INDEX - CENTRALIZED STORE EXPORTS
 * 
 * This file provides centralized exports for all Zustand stores and types.
 * All variable names follow docs/variable-origins.md registry.
 * 
 * USAGE:
 * import { useEntityStore, useFilterStore } from '@/stores';
 * 
 * CRITICAL RULES:
 * 1. All exports follow docs/variable-origins.md registry
 * 2. Consistent naming with store files
 * 3. Type exports for external usage
 * 4. No TypeScript types - using plain JavaScript with JSDoc
 */

// Store Exports
// Variable names follow docs/variable-origins.md registry
export { useEntityStore } from './entity-store';
export { useFilterStore } from './filter-store';

// Import stores for internal use in helper hooks
import { useEntityStore } from './entity-store';
import { useFilterStore } from './filter-store';
import { useSyncStore } from './sync-store';
import { useAppStore } from './app-store';
export { useSyncStore } from './sync-store';
export { useAppStore } from './app-store';

// Type Exports for external usage
// All types from the types.ts file
export type {
  // Entity Store Types
  EntityState,
  EntityActions,
  EntityStore,
  
  // Filter Store Types
  FilterState,
  FilterActions,
  FilterStore,
  
  // Sync Store Types
  SyncState,
  SyncActions,
  SyncStore,
  
  // App Store Types
  AppState,
  AppActions,
  AppStore,
  Notification,
  
  // Utility Types
  AnyEntity,
  EntityCollectionKey,
  LoadingStateKey,
  ErrorStateKey,
} from './types';

// Re-export database model types for convenience
export type {
  NetworkEntity,
  AdvertiserEntity,
  CampaignEntity,
  ZoneEntity,
  AdvertisementEntity,
  LocalAdvertiserEntity,
  LocalZoneEntity,
  LocalCampaignEntity,
  LocalNetworkEntity,
  LocalAdvertisementEntity,
  PlacementEntity,
  ThemeEntity,
} from '@/lib/types/database-models';

// Re-export entity helper types for convenience
export type {
  EntitySelectionKey,
} from '@/lib/utils/entity-helpers';

/**
 * Combined store hooks for components that need multiple stores
 * These are convenience hooks that return multiple store states
 */

/**
 * Hook to get all entity collections
 * @returns {Object} Object containing all entity collections
 */
export const useAllEntities = () => {
  const entityStore = useEntityStore();
  
  return {
    // Synced entities
    networks: entityStore.networks,
    advertisers: entityStore.advertisers,
    campaigns: entityStore.campaigns,
    zones: entityStore.zones,
    advertisements: entityStore.advertisements,
    
    // Local entities
    localZones: entityStore.localZones,
    localAdvertisers: entityStore.localAdvertisers,
    localCampaigns: entityStore.localCampaigns,
    localNetworks: entityStore.localNetworks,
    localAdvertisements: entityStore.localAdvertisements,
    localPlacements: entityStore.localPlacements,
  };
};

/**
 * Hook to get all selected entities and filters
 * @returns {Object} Object containing all filter state
 */
export const useAllFilters = () => {
  const filterStore = useFilterStore();
  
  return {
    // Selected entities
    selectedNetwork: filterStore.selectedNetwork,
    selectedAdvertiser: filterStore.selectedAdvertiser,
    selectedCampaign: filterStore.selectedCampaign,
    selectedTheme: filterStore.selectedTheme,
    
    // Selection arrays
    selectedZones: filterStore.selectedZones,
    selectedAdvertisements: filterStore.selectedAdvertisements,
    
    // Display options
    showOnlySelected: filterStore.showOnlySelected,
    showOnlySelectedAds: filterStore.showOnlySelectedAds,
    
    // Metadata
    lastFilterUpdate: filterStore.lastFilterUpdate,
    filterSource: filterStore.filterSource,
  };
};

/**
 * Hook to get all loading states
 * @returns {Object} Object containing all loading states
 */
export const useAllLoadingStates = () => {
  const entityStore = useEntityStore();
  const syncStore = useSyncStore();
  
  return {
    // Entity loading states
    ...entityStore.isLoading,
    
    // Sync loading state
    syncActive: syncStore.isActive,
  };
};

/**
 * Hook to get all error states
 * @returns {Object} Object containing all error states
 */
export const useAllErrorStates = () => {
  const entityStore = useEntityStore();
  const syncStore = useSyncStore();
  
  return {
    // Entity error states
    ...entityStore.errors,
    
    // Sync error states
    syncErrors: syncStore.errors,
  };
};

/**
 * Hook to get app UI state
 * @returns {Object} Object containing app UI state
 */
export const useAppUI = () => {
  const appStore = useAppStore();
  
  return {
    sidebarCollapsed: appStore.sidebarCollapsed,
    currentPage: appStore.currentPage,
    notifications: appStore.notifications,
    unreadCount: appStore.getUnreadCount(),
    hasErrors: appStore.hasErrorNotifications(),
  };
};

/**
 * Hook for entity management actions
 * @returns {Object} Object containing entity management actions
 */
export const useEntityActions = () => {
  const entityStore = useEntityStore();
  
  return {
    // Setters
    setNetworks: entityStore.setNetworks,
    setAdvertisers: entityStore.setAdvertisers,
    setCampaigns: entityStore.setCampaigns,
    setZones: entityStore.setZones,
    setAdvertisements: entityStore.setAdvertisements,
    setLocalEntities: entityStore.setLocalEntities,
    setLocalZones: entityStore.setLocalZones,
    setLocalAdvertisers: entityStore.setLocalAdvertisers,
    setLocalCampaigns: entityStore.setLocalCampaigns,
    setLocalPlacements: entityStore.setLocalPlacements,
    
    // Operations
    addEntity: entityStore.addEntity,
    updateEntity: entityStore.updateEntity,
    removeEntity: entityStore.removeEntity,
    mergeEntities: entityStore.mergeEntities,
    replaceEntities: entityStore.replaceEntities,
    
    // State management
    setLoading: entityStore.setLoading,
    setAllLoading: entityStore.setAllLoading,
    setError: entityStore.setError,
    clearErrors: entityStore.clearErrors,
    
    // Clear actions
    clearAll: entityStore.clearAll,
    clearEntity: entityStore.clearEntity,
    clearSyncedEntities: entityStore.clearSyncedEntities,
    clearLocalEntities: entityStore.clearLocalEntities,
    
    // Utilities
    getEntityById: entityStore.getEntityById,
    getEntitiesByIds: entityStore.getEntitiesByIds,
    filterEntitiesBySync: entityStore.filterEntitiesBySync,
  };
};

/**
 * Hook for filter management actions
 * @returns {Object} Object containing filter management actions
 */
export const useFilterActions = () => {
  const filterStore = useFilterStore();
  
  return {
    // Selection actions
    setSelectedNetwork: filterStore.setSelectedNetwork,
    setSelectedAdvertiser: filterStore.setSelectedAdvertiser,
    setSelectedCampaign: filterStore.setSelectedCampaign,
    setSelectedZones: filterStore.setSelectedZones,
    setSelectedAdvertisements: filterStore.setSelectedAdvertisements,
    setSelectedTheme: filterStore.setSelectedTheme,
    
    // Toggle actions
    toggleZoneSelection: filterStore.toggleZoneSelection,
    toggleAdvertisementSelection: filterStore.toggleAdvertisementSelection,
    
    // Bulk actions
    selectAllZones: filterStore.selectAllZones,
    deselectAllZones: filterStore.deselectAllZones,
    selectAllAdvertisements: filterStore.selectAllAdvertisements,
    deselectAllAdvertisements: filterStore.deselectAllAdvertisements,
    
    // Display options
    setShowOnlySelected: filterStore.setShowOnlySelected,
    setShowOnlySelectedAds: filterStore.setShowOnlySelectedAds,
    
    // Clear actions
    clearAllFilters: filterStore.clearAllFilters,
    clearSelections: filterStore.clearSelections,
    
    // URL integration
    setFiltersFromParams: filterStore.setFiltersFromParams,
    getFiltersAsParams: filterStore.getFiltersAsParams,
  };
};

/**
 * Hook for sync management actions
 * @returns {Object} Object containing sync management actions
 */
export const useSyncActions = () => {
  const syncStore = useSyncStore();
  
  return {
    startSync: syncStore.startSync,
    updateProgress: syncStore.updateProgress,
    addError: syncStore.addError,
    completeSync: syncStore.completeSync,
    resetSync: syncStore.resetSync,
    clearSyncErrors: syncStore.clearSyncErrors,
    updatePhase: syncStore.updatePhase,
    setProgress: syncStore.setProgress,
    incrementProgress: syncStore.incrementProgress,
  };
};

/**
 * Hook for app management actions
 * @returns {Object} Object containing app management actions
 */
export const useAppActions = () => {
  const appStore = useAppStore();
  
  return {
    // UI actions
    setSidebarCollapsed: appStore.setSidebarCollapsed,
    toggleSidebar: appStore.toggleSidebar,
    setCurrentPage: appStore.setCurrentPage,
    
    // Notification actions
    addNotification: appStore.addNotification,
    markNotificationRead: appStore.markNotificationRead,
    markAllNotificationsRead: appStore.markAllNotificationsRead,
    removeNotification: appStore.removeNotification,
    clearAllNotifications: appStore.clearAllNotifications,
    clearReadNotifications: appStore.clearReadNotifications,
    
    // Convenience notification methods
    addSuccessNotification: appStore.addSuccessNotification,
    addErrorNotification: appStore.addErrorNotification,
    addWarningNotification: appStore.addWarningNotification,
    addInfoNotification: appStore.addInfoNotification,
    
    // Utility actions
    resetAppState: appStore.resetAppState,
    cleanupOldNotifications: appStore.cleanupOldNotifications,
  };
};
