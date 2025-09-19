/**
 * ENTITY STORE - COMPREHENSIVE ENTITY STATE MANAGEMENT
 * 
 * This store manages all entity collections with type safety and ID compliance.
 * Follows the three-tier ID system and uses database model interfaces.
 * All variable names follow docs/variable-origins.md registry.
 * 
 * CRITICAL RULES:
 * 1. All variable names from docs/variable-origins.md registry
 * 2. All entity types from database-models.ts interfaces
 * 3. All ID handling uses EntitySelectionKey from entity-helpers.ts
 * 4. No TypeScript types - using plain JavaScript with JSDoc
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { EntityState, EntityActions, EntityStore } from './types';
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
  PlacementEntity
} from '@/lib/types/database-models';
import { getEntityId, EntitySelectionKey } from '@/lib/utils/entity-helpers';

/**
 * Helper function to validate placement entities
 * Placements must have network_id, advertiser_id, advertisement_id
 * and either campaign_id OR campaign_mongo_id, and either zone_id OR zone_mongo_id
 * @param {PlacementEntity} p - Placement entity to validate
 * @returns {boolean} True if placement is valid
 */
const isPlacementValid = (p: PlacementEntity): boolean => {
  return p.network_id && p.advertiser_id && p.advertisement_id &&
    ((p.campaign_id && !p.campaign_mongo_id) || (!p.campaign_id && p.campaign_mongo_id)) &&
    ((p.zone_id && !p.zone_mongo_id) || (!p.zone_id && p.zone_mongo_id));
};

// Initial state with proper typing and comprehensive coverage
// Variable names follow docs/variable-origins.md registry
const initialState = {
  // Synced entities - empty arrays with proper typing
  networks: [],
  advertisers: [],
  campaigns: [],
  zones: [],
  advertisements: [],

  // Mixed entities - can contain both local and synced
  placements: [],

  // Local entities - empty arrays with proper typing
  localZones: [],
  localAdvertisers: [],
  localCampaigns: [],
  localNetworks: [],
  localAdvertisements: [],
  localPlacements: [],

  // Themes - local-only entities
  themes: [],
  currentTheme: null,

  // Loading states - comprehensive coverage
  isLoading: {
    networks: false,
    advertisers: false,
    campaigns: false,
    zones: false,
    advertisements: false,
    localEntities: false,
    placements: false,
    themes: false,
  },

  // Error states - specific error tracking
  errors: {
    networks: null,
    advertisers: null,
    campaigns: null,
    zones: null,
    advertisements: null,
    localEntities: null,
    placements: null,
    themes: null,
  },
};

/**
 * Entity Store - Manages all entity collections with type safety
 * Uses Zustand with Immer for immutable updates
 */
export const useEntityStore = create(
  immer((set, get) => ({
    ...initialState,

    // Synced entity setters with validation and type safety
    // Variable names follow docs/variable-origins.md registry
    
    /**
     * Set networks collection - networks are always synced
     * @param {NetworkEntity[]} networks - Array of network entities
     */
    setNetworks: (networks) => set((state) => {
      // Validate that all networks have broadstreet_id (networks are always synced)
      const validNetworks = networks.filter(n => n.broadstreet_id && n.name);
      state.networks = validNetworks;
      state.isLoading.networks = false;
      state.errors.networks = null;
    }),

    /**
     * Set advertisers collection - can be synced or local
     * @param {AdvertiserEntity[]} advertisers - Array of advertiser entities
     */
    setAdvertisers: (advertisers) => set((state) => {
      // Advertisers can be synced or local - validate accordingly
      const validAdvertisers = advertisers.filter(a => a.name && (a.broadstreet_id || a.mongo_id));
      state.advertisers = validAdvertisers;
      state.isLoading.advertisers = false;
      state.errors.advertisers = null;
    }),

    /**
     * Set campaigns collection - can be synced or local
     * @param {CampaignEntity[]} campaigns - Array of campaign entities
     */
    setCampaigns: (campaigns) => set((state) => {
      // Campaigns can be synced or local - validate accordingly
      const validCampaigns = campaigns.filter(c => c.name && (c.broadstreet_id || c.mongo_id));
      state.campaigns = validCampaigns;
      state.isLoading.campaigns = false;
      state.errors.campaigns = null;
    }),

    /**
     * Set zones collection - can be synced or local
     * @param {ZoneEntity[]} zones - Array of zone entities
     */
    setZones: (zones) => set((state) => {
      // Zones can be synced or local - validate accordingly
      const validZones = zones.filter(z => z.name && z.network_id && (z.broadstreet_id || z.mongo_id));
      state.zones = validZones;
      state.isLoading.zones = false;
      state.errors.zones = null;
    }),

    /**
     * Set advertisements collection - always synced
     * @param {AdvertisementEntity[]} advertisements - Array of advertisement entities
     */
    setAdvertisements: (advertisements) => set((state) => {
      // Advertisements are always synced - validate broadstreet_id
      const validAdvertisements = advertisements.filter(a => a.broadstreet_id && a.name);
      state.advertisements = validAdvertisements;
      state.isLoading.advertisements = false;
      state.errors.advertisements = null;
    }),

    /**
     * Set placements collection - mixed local and synced
     * @param {PlacementEntity[]} placements - Array of placement entities
     */
    setPlacements: (placements) => set((state) => {
      // Placements can be local or synced - validate required fields
      const validPlacements = placements.filter(isPlacementValid);
      state.placements = validPlacements;
      state.isLoading.placements = false;
      state.errors.placements = null;
    }),

    // Local entity setters with proper validation
    // Variable names follow docs/variable-origins.md registry

    /**
     * Set all local entities at once
     * @param {Object} entities - Object containing all local entity arrays
     */
    setLocalEntities: (entities) => set((state) => {
      // Validate local entities have required fields
      state.localZones = entities.zones.filter(z => z.name && z.network_id && z.mongo_id);
      state.localAdvertisers = entities.advertisers.filter(a => a.name && a.network_id && a.mongo_id);
      state.localCampaigns = entities.campaigns.filter(c => c.name && c.network_id && c.mongo_id);
      state.localNetworks = entities.networks.filter(n => n.name && n.mongo_id);
      state.localAdvertisements = entities.advertisements.filter(a => a.name && a.network_id && a.mongo_id);
      state.localPlacements = entities.placements.filter(isPlacementValid);
      state.isLoading.localEntities = false;
      state.errors.localEntities = null;
    }),

    /**
     * Set local zones collection
     * @param {LocalZoneEntity[]} zones - Array of local zone entities
     */
    setLocalZones: (zones) => set((state) => {
      state.localZones = zones.filter(z => z.name && z.network_id && z.mongo_id);
    }),

    /**
     * Set local advertisers collection
     * @param {LocalAdvertiserEntity[]} advertisers - Array of local advertiser entities
     */
    setLocalAdvertisers: (advertisers) => set((state) => {
      state.localAdvertisers = advertisers.filter(a => a.name && a.network_id && a.mongo_id);
    }),

    /**
     * Set local campaigns collection
     * @param {LocalCampaignEntity[]} campaigns - Array of local campaign entities
     */
    setLocalCampaigns: (campaigns) => set((state) => {
      state.localCampaigns = campaigns.filter(c => c.name && c.network_id && c.mongo_id);
    }),

    /**
     * Set local networks collection
     * @param {LocalNetworkEntity[]} networks - Array of local network entities
     */
    setLocalNetworks: (networks) => set((state) => {
      state.localNetworks = networks.filter(n => n.name && n.mongo_id);
    }),

    /**
     * Set local advertisements collection
     * @param {LocalAdvertisementEntity[]} advertisements - Array of local advertisement entities
     */
    setLocalAdvertisements: (advertisements) => set((state) => {
      state.localAdvertisements = advertisements.filter(a => a.name && a.network_id && a.mongo_id);
    }),

    /**
     * Set local placements collection
     * @param {PlacementEntity[]} placements - Array of local placement entities
     */
    setLocalPlacements: (placements) => set((state) => {
      state.localPlacements = placements.filter(isPlacementValid);
    }),

    /**
     * Set themes collection - themes are local-only entities
     * @param {any[]} themes - Array of theme entities
     */
    setThemes: (themes) => set((state) => {
      state.themes = themes.filter(t => t.name && t._id);
      state.isLoading.themes = false;
      state.errors.themes = null;
    }),

    /**
     * Set current theme for detail view
     * @param {any} theme - Theme entity with zones
     */
    setCurrentTheme: (theme) => set((state) => {
      state.currentTheme = theme;
    }),

    // Entity operations with ID resolution using EntitySelectionKey
    // Variable names follow docs/variable-origins.md registry

    /**
     * Add entity to collection
     * @param {string} entityType - Type of entity collection
     * @param {any} entity - Entity to add
     */
    addEntity: (entityType, entity) => set((state) => {
      if (entityType in state && Array.isArray(state[entityType])) {
        state[entityType].push(entity);
      }
    }),

    /**
     * Update entity in collection
     * @param {string} entityType - Type of entity collection
     * @param {EntitySelectionKey} entityId - ID of entity to update
     * @param {any} updates - Updates to apply
     */
    updateEntity: (entityType, entityId, updates) => set((state) => {
      if (entityType in state && Array.isArray(state[entityType])) {
        const index = state[entityType].findIndex(entity => getEntityId(entity) === entityId);
        if (index !== -1) {
          Object.assign(state[entityType][index], updates);
        }
      }
    }),

    /**
     * Remove entity from collection
     * @param {string} entityType - Type of entity collection
     * @param {EntitySelectionKey} entityId - ID of entity to remove
     */
    removeEntity: (entityType, entityId) => set((state) => {
      if (entityType in state && Array.isArray(state[entityType])) {
        state[entityType] = state[entityType].filter(entity => getEntityId(entity) !== entityId);
      }
    }),

    // Bulk operations
    // Variable names follow docs/variable-origins.md registry

    /**
     * Merge entities into collection (add new, update existing)
     * @param {string} entityType - Type of entity collection
     * @param {any[]} entities - Entities to merge
     */
    mergeEntities: (entityType, entities) => set((state) => {
      if (entityType in state && Array.isArray(state[entityType])) {
        entities.forEach(entity => {
          const entityId = getEntityId(entity);
          const existingIndex = state[entityType].findIndex(existing => getEntityId(existing) === entityId);
          if (existingIndex !== -1) {
            // Update existing
            Object.assign(state[entityType][existingIndex], entity);
          } else {
            // Add new
            state[entityType].push(entity);
          }
        });
      }
    }),

    /**
     * Replace entire entity collection
     * @param {string} entityType - Type of entity collection
     * @param {any[]} entities - Entities to replace with
     */
    replaceEntities: (entityType, entities) => set((state) => {
      if (entityType in state) {
        state[entityType] = entities;
      }
    }),

    // Loading state management
    // Variable names follow docs/variable-origins.md registry

    /**
     * Set loading state for specific entity type
     * @param {string} entity - Entity type key
     * @param {boolean} loading - Loading state
     */
    setLoading: (entity, loading) => set((state) => {
      state.isLoading[entity] = loading;
    }),

    /**
     * Set loading state for all entity types
     * @param {boolean} loading - Loading state
     */
    setAllLoading: (loading) => set((state) => {
      Object.keys(state.isLoading).forEach(key => {
        state.isLoading[key] = loading;
      });
    }),

    // Error state management
    // Variable names follow docs/variable-origins.md registry

    /**
     * Set error state for specific entity type
     * @param {string} entity - Entity type key
     * @param {string|null} error - Error message or null
     */
    setError: (entity, error) => set((state) => {
      state.errors[entity] = error;
      state.isLoading[entity] = false;
    }),

    /**
     * Clear all error states
     */
    clearErrors: () => set((state) => {
      Object.keys(state.errors).forEach(key => {
        state.errors[key] = null;
      });
    }),

    // Clear actions with proper typing
    // Variable names follow docs/variable-origins.md registry

    /**
     * Clear all entity data and reset to initial state
     */
    clearAll: () => set(() => initialState),

    /**
     * Clear specific entity collection
     * @param {string} entityType - Type of entity collection to clear
     */
    clearEntity: (entityType) => set((state) => {
      if (entityType in state) {
        state[entityType] = [];
      }
    }),

    /**
     * Clear all synced entity collections
     */
    clearSyncedEntities: () => set((state) => {
      state.networks = [];
      state.advertisers = [];
      state.campaigns = [];
      state.zones = [];
      state.advertisements = [];
    }),

    /**
     * Clear all local entity collections
     */
    clearLocalEntities: () => set((state) => {
      state.localZones = [];
      state.localAdvertisers = [];
      state.localCampaigns = [];
      state.localNetworks = [];
      state.localAdvertisements = [];
      state.localPlacements = [];
    }),

    // Utility functions for entity management
    // Variable names follow docs/variable-origins.md registry

    /**
     * Get entity by ID from collection
     * @param {string} entityType - Type of entity collection
     * @param {EntitySelectionKey} entityId - ID of entity to find
     * @returns {any|null} Found entity or null
     */
    getEntityById: (entityType, entityId) => {
      const state = get();
      if (entityType in state && Array.isArray(state[entityType])) {
        return state[entityType].find(entity => getEntityId(entity) === entityId) || null;
      }
      return null;
    },

    /**
     * Get multiple entities by IDs from collection
     * @param {string} entityType - Type of entity collection
     * @param {EntitySelectionKey[]} entityIds - Array of entity IDs
     * @returns {any[]} Array of found entities
     */
    getEntitiesByIds: (entityType, entityIds) => {
      const state = get();
      if (entityType in state && Array.isArray(state[entityType])) {
        return state[entityType].filter(entity => entityIds.includes(getEntityId(entity)));
      }
      return [];
    },

    /**
     * Filter entities by sync status
     * @param {string} entityType - Type of entity collection
     * @param {boolean} synced - Whether to get synced (true) or local (false) entities
     * @returns {any[]} Array of filtered entities
     */
    filterEntitiesBySync: (entityType, synced) => {
      const state = get();
      if (entityType in state && Array.isArray(state[entityType])) {
        return state[entityType].filter(entity => {
          const hasBroadstreetId = Boolean(entity.broadstreet_id);
          return synced ? hasBroadstreetId : !hasBroadstreetId;
        });
      }
      return [];
    },
  }))
);
