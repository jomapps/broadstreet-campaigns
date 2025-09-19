/**
 * ZUSTAND STORE TYPE DEFINITIONS - SINGLE SOURCE OF TRUTH
 * 
 * This file provides comprehensive type definitions for all Zustand stores,
 * ensuring type safety throughout the application and proper integration
 * with the three-tier ID system and database model interfaces.
 * 
 * CRITICAL RULES:
 * 1. All variable names follow docs/variable-origins.md registry
 * 2. All entity types use database-models.ts interfaces
 * 3. All ID handling uses EntitySelectionKey from entity-helpers.ts
 * 4. No TypeScript types - using plain JavaScript with JSDoc
 */

// Import database model interfaces for type safety
import {
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
  ThemeEntity
} from '@/lib/types/database-models';

import { EntitySelectionKey } from '@/lib/utils/entity-helpers';

// =============================================================================
// ENTITY STORE TYPES
// =============================================================================

/**
 * Entity state interface - manages all entity collections with proper typing
 * Variable names follow docs/variable-origins.md registry
 */
export interface EntityState {
  // Synced entities (from Broadstreet API) - using exact variable names from registry
  networks: NetworkEntity[];                    // Always have broadstreet_id
  advertisers: AdvertiserEntity[];              // May have broadstreet_id (synced) or only mongo_id (local)
  campaigns: CampaignEntity[];                  // May have broadstreet_id (synced) or only mongo_id (local)
  zones: ZoneEntity[];                          // May have broadstreet_id (synced) or only mongo_id (local)
  advertisements: AdvertisementEntity[];        // Always have broadstreet_id

  // Mixed entities (can contain both local and synced)
  placements: PlacementEntity[];                // Mixed local and synced placements

  // Local entities (created locally before sync) - using Local*Entity interfaces
  localZones: LocalZoneEntity[];
  localAdvertisers: LocalAdvertiserEntity[];
  localCampaigns: LocalCampaignEntity[];
  localNetworks: LocalNetworkEntity[];
  localAdvertisements: LocalAdvertisementEntity[];
  localPlacements: PlacementEntity[];           // Placements are hybrid entities

  // Themes - local-only entities
  themes: ThemeEntity[];
  currentTheme: ThemeEntity | null;

  // Loading states - granular control for better UX
  isLoading: {
    networks: boolean;
    advertisers: boolean;
    campaigns: boolean;
    zones: boolean;
    advertisements: boolean;
    localEntities: boolean;
    placements: boolean;
    themes: boolean;
  };

  // Error states - specific error tracking
  errors: {
    networks: string | null;
    advertisers: string | null;
    campaigns: string | null;
    zones: string | null;
    advertisements: string | null;
    localEntities: string | null;
    placements: string | null;
    themes: string | null;
  };
}

/**
 * Entity store actions interface - all entity management operations
 * Action names follow docs/variable-origins.md registry
 */
export interface EntityActions {
  // Setters - using proper entity types from database-models.ts
  setNetworks: (networks: NetworkEntity[]) => void;
  setAdvertisers: (advertisers: AdvertiserEntity[]) => void;
  setCampaigns: (campaigns: CampaignEntity[]) => void;
  setZones: (zones: ZoneEntity[]) => void;
  setAdvertisements: (advertisements: AdvertisementEntity[]) => void;
  setPlacements: (placements: PlacementEntity[]) => void;

  // Local entity setters - using proper Local*Entity types
  setLocalEntities: (entities: {
    zones: LocalZoneEntity[];
    advertisers: LocalAdvertiserEntity[];
    campaigns: LocalCampaignEntity[];
    networks: LocalNetworkEntity[];
    advertisements: LocalAdvertisementEntity[];
    placements: PlacementEntity[];
  }) => void;

  // Individual local entity setters for granular updates
  setLocalZones: (zones: LocalZoneEntity[]) => void;
  setLocalAdvertisers: (advertisers: LocalAdvertiserEntity[]) => void;
  setLocalCampaigns: (campaigns: LocalCampaignEntity[]) => void;
  setLocalNetworks: (networks: LocalNetworkEntity[]) => void;
  setLocalAdvertisements: (advertisements: LocalAdvertisementEntity[]) => void;
  setLocalPlacements: (placements: PlacementEntity[]) => void;

  // Theme setters
  setThemes: (themes: ThemeEntity[]) => void;
  setCurrentTheme: (theme: ThemeEntity | null) => void;

  // Entity operations with ID resolution using EntitySelectionKey
  addEntity: (entityType: keyof EntityState, entity: any) => void;
  updateEntity: (entityType: keyof EntityState, entityId: EntitySelectionKey, updates: any) => void;
  removeEntity: (entityType: keyof EntityState, entityId: EntitySelectionKey) => void;

  // Bulk operations
  mergeEntities: (entityType: keyof EntityState, entities: any[]) => void;
  replaceEntities: (entityType: keyof EntityState, entities: any[]) => void;

  // Loading states - granular control
  setLoading: (entity: keyof EntityState['isLoading'], loading: boolean) => void;
  setAllLoading: (loading: boolean) => void;

  // Error states - specific error tracking
  setError: (entity: keyof EntityState['errors'], error: string | null) => void;
  clearErrors: () => void;

  // Clear actions with proper typing
  clearAll: () => void;
  clearEntity: (entityType: keyof EntityState) => void;
  clearSyncedEntities: () => void;
  clearLocalEntities: () => void;

  // Utility functions for entity management
  getEntityById: (entityType: keyof EntityState, entityId: EntitySelectionKey) => any | null;
  getEntitiesByIds: (entityType: keyof EntityState, entityIds: EntitySelectionKey[]) => any[];
  filterEntitiesBySync: (entityType: keyof EntityState, synced: boolean) => any[];
}

// =============================================================================
// FILTER STORE TYPES
// =============================================================================

/**
 * Filter state interface - manages selection and filtering state
 * Variable names follow docs/variable-origins.md registry
 */
export interface FilterState {
  // Selected entities - use full entity objects for rich data access
  selectedNetwork: NetworkEntity | null;       // Always required, always has broadstreet_id
  selectedAdvertiser: AdvertiserEntity | null; // Can be synced or local
  selectedCampaign: CampaignEntity | null;     // Can be synced or local

  // Selection arrays - use EntitySelectionKey for consistent ID handling
  selectedZones: EntitySelectionKey[];         // Array of broadstreet_id or mongo_id strings
  selectedAdvertisements: EntitySelectionKey[]; // Array of broadstreet_id or mongo_id strings

  // Theme selection - use proper ThemeEntity interface
  selectedTheme: ThemeEntity | null;           // Local-only entity with zone_ids array

  // Display options - exact names from variable registry
  showOnlySelected: boolean;
  showOnlySelectedAds: boolean;

  // Filter metadata for debugging and analytics
  lastFilterUpdate: Date;
  filterSource: 'user' | 'url' | 'theme' | 'bulk';
}

/**
 * Filter store actions interface - all selection and filtering operations
 * Action names follow docs/variable-origins.md registry
 */
export interface FilterActions {
  // Selection actions - using exact names from variable registry
  setSelectedNetwork: (network: NetworkEntity | null) => void;
  setSelectedAdvertiser: (advertiser: AdvertiserEntity | null) => void;
  setSelectedCampaign: (campaign: CampaignEntity | null) => void;
  setSelectedZones: (zones: EntitySelectionKey[]) => void;
  setSelectedAdvertisements: (advertisements: EntitySelectionKey[]) => void;
  setSelectedTheme: (theme: ThemeEntity | null) => void;

  // Toggle actions - using exact names from variable registry
  toggleZoneSelection: (zoneId: EntitySelectionKey) => void;
  toggleAdvertisementSelection: (adId: EntitySelectionKey) => void;

  // Bulk actions - using exact names from variable registry
  selectAllZones: (zoneIds: EntitySelectionKey[]) => void;
  deselectAllZones: () => void;
  selectAllAdvertisements: (adIds: EntitySelectionKey[]) => void;
  deselectAllAdvertisements: () => void;

  // Display options - using exact names from variable registry
  setShowOnlySelected: (show: boolean) => void;
  setShowOnlySelectedAds: (show: boolean) => void;

  // Clear actions - using exact names from variable registry
  clearAllFilters: () => void;
  clearSelections: () => void;

  // URL parameter integration
  setFiltersFromParams: (params: any) => void;
  getFiltersAsParams: () => Record<string, string>;
}

// =============================================================================
// SYNC STORE TYPES
// =============================================================================

/**
 * Sync state interface - manages sync operation state
 * Variable names follow docs/variable-origins.md registry
 */
export interface SyncState {
  isActive: boolean;
  progress: number;
  currentPhase: string;
  message: string;
  errors: string[];
  lastSyncTime: Date | null;
}

/**
 * Sync store actions interface - all sync operation management
 * Action names follow docs/variable-origins.md registry
 */
export interface SyncActions {
  startSync: () => void;
  updateProgress: (progress: number, phase: string, message: string) => void;
  addError: (error: string) => void;
  completeSync: (success: boolean) => void;
  resetSync: () => void;
}

// =============================================================================
// APP STORE TYPES
// =============================================================================

/**
 * Notification interface for app-wide notifications
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

/**
 * App state interface - manages application-wide state
 * Variable names follow docs/variable-origins.md registry
 */
export interface AppState {
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: Notification[];
}

/**
 * App store actions interface - all app-wide state management
 * Action names follow docs/variable-origins.md registry
 */
export interface AppActions {
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// =============================================================================
// COMBINED STORE TYPES
// =============================================================================

/**
 * Combined entity store type for use with Zustand create()
 */
export type EntityStore = EntityState & EntityActions;

/**
 * Combined filter store type for use with Zustand create()
 */
export type FilterStore = FilterState & FilterActions;

/**
 * Combined sync store type for use with Zustand create()
 */
export type SyncStore = SyncState & SyncActions;

/**
 * Combined app store type for use with Zustand create()
 */
export type AppStore = AppState & AppActions;

// =============================================================================
// UTILITY TYPES FOR COMMON PATTERNS
// =============================================================================

/**
 * Generic entity type for flexible operations
 */
export type AnyEntity = 
  | NetworkEntity 
  | AdvertiserEntity 
  | CampaignEntity 
  | ZoneEntity 
  | AdvertisementEntity
  | LocalAdvertiserEntity
  | LocalZoneEntity
  | LocalCampaignEntity
  | LocalNetworkEntity
  | LocalAdvertisementEntity
  | PlacementEntity
  | ThemeEntity;

/**
 * Entity collection keys for type-safe entity operations
 */
export type EntityCollectionKey =
  | 'networks'
  | 'advertisers'
  | 'campaigns'
  | 'zones'
  | 'advertisements'
  | 'placements'
  | 'localZones'
  | 'localAdvertisers'
  | 'localCampaigns'
  | 'localNetworks'
  | 'localAdvertisements'
  | 'localPlacements';

/**
 * Loading state keys for type-safe loading operations
 */
export type LoadingStateKey = keyof EntityState['isLoading'];

/**
 * Error state keys for type-safe error operations
 */
export type ErrorStateKey = keyof EntityState['errors'];
