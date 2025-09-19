/**
 * FILTER STORE - SELECTION AND FILTERING STATE MANAGEMENT
 *
 * This store manages all selection and filtering state with theme integration.
 * Follows the three-tier ID system and uses database model interfaces.
 * All variable names follow docs/variable-origins.md registry.
 *
 * CRITICAL RULES:
 * 1. All variable names from docs/variable-origins.md registry
 * 2. All entity types from database-models.ts interfaces
 * 3. All ID handling uses EntitySelectionKey from entity-helpers.ts
 * 4. Theme selection enforces mutual exclusivity with zones
 * 5. Uses TypeScript for proper type safety
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { FilterState, FilterActions } from './types';
import { NetworkEntity } from '@/lib/types/database-models';
import { EntitySelectionKey } from '@/lib/utils/entity-helpers';

// Default network configuration - FASH Medien Verlag GmbH - SCHWULISSIMO
// This is the primary network that should be selected by default for smooth UX
const DEFAULT_NETWORK_ID = 9396;
const DEFAULT_NETWORK_NAME = 'FASH Medien Verlag GmbH - SCHWULISSIMO';

// Initial state with proper typing and comprehensive coverage
// Variable names follow docs/variable-origins.md registry
const initialState = {
  // Selected entities - use full entity objects for rich data access
  selectedNetwork: null,
  selectedAdvertiser: null,
  selectedCampaign: null,

  // Selection arrays - use EntitySelectionKey for consistent ID handling
  selectedZones: [],
  selectedAdvertisements: [],

  // Theme selection - use proper ThemeEntity interface
  selectedTheme: null,

  // Display options - exact names from variable registry
  showOnlySelected: false,
  showOnlySelectedAds: false,

  // Filter metadata for debugging and analytics
  lastFilterUpdate: new Date(),
  filterSource: 'user',
};

/**
 * Filter Store - Manages selection and filtering state
 * Uses Zustand with Immer for immutable updates and persistence
 */
export const useFilterStore = create<FilterState & FilterActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Selection actions - using exact names from variable registry
      
      /**
       * Set selected network - clears dependent selections
       */
      setSelectedNetwork: (network) => set((state) => {
        state.selectedNetwork = network;
        // Clear dependent selections when network changes
        state.selectedAdvertiser = null;
        state.selectedCampaign = null;
        state.selectedZones = [];
        state.selectedAdvertisements = [];
        state.selectedTheme = null;
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      /**
       * Set selected advertiser - clears dependent selections
       */
      setSelectedAdvertiser: (advertiser) => set((state) => {
        state.selectedAdvertiser = advertiser;
        // Clear dependent selections when advertiser changes
        state.selectedCampaign = null;
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      /**
       * Set selected campaign
       */
      setSelectedCampaign: (campaign) => set((state) => {
        state.selectedCampaign = campaign;
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      /**
       * Set selected zones - enforces theme mutual exclusivity
       */
      setSelectedZones: (zones) => set((state) => {
        state.selectedZones = zones;
        
        // Clear theme if zones don't match theme's zones
        if (state.selectedTheme) {
          const themeZoneIds = state.selectedTheme.zone_ids.map(String);
          const zonesMatch = zones.length === themeZoneIds.length &&
            zones.every(id => themeZoneIds.includes(String(id)));
          if (!zonesMatch) {
            state.selectedTheme = null;
          }
        }
        
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      /**
       * Set selected advertisements
       */
      setSelectedAdvertisements: (advertisements) => set((state) => {
        state.selectedAdvertisements = advertisements;
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      /**
       * Set selected theme - updates zones to match theme
       */
      setSelectedTheme: (theme) => set((state) => {
        state.selectedTheme = theme;
        
        // Update zones to match theme (enforces mutual exclusivity)
        if (theme) {
          state.selectedZones = theme.zone_ids.map(String);
          state.filterSource = 'theme';
        }
        
        state.lastFilterUpdate = new Date();
      }),

      // Toggle actions - using exact names from variable registry

      /**
       * Toggle individual zone selection - maintains theme consistency
       */
      toggleZoneSelection: (zoneId) => set((state) => {
        const index = state.selectedZones.indexOf(zoneId);
        if (index > -1) {
          // Remove zone
          state.selectedZones.splice(index, 1);
        } else {
          // Add zone
          state.selectedZones.push(zoneId);
        }
        
        // Clear theme if zones no longer match theme's zones
        if (state.selectedTheme) {
          const themeZoneIds = state.selectedTheme.zone_ids.map(String);
          const zonesMatch = state.selectedZones.length === themeZoneIds.length &&
            state.selectedZones.every(id => themeZoneIds.includes(String(id)));
          if (!zonesMatch) {
            state.selectedTheme = null;
          }
        }
        
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      /**
       * Toggle individual advertisement selection
       */
      toggleAdvertisementSelection: (adId) => set((state) => {
        const index = state.selectedAdvertisements.indexOf(adId);
        if (index > -1) {
          // Remove advertisement
          state.selectedAdvertisements.splice(index, 1);
        } else {
          // Add advertisement
          state.selectedAdvertisements.push(adId);
        }
        
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      // Bulk actions - using exact names from variable registry

      /**
       * Select all zones from provided array
       */
      selectAllZones: (zoneIds) => set((state) => {
        state.selectedZones = [...zoneIds];
        state.selectedTheme = null; // Clear theme when bulk selecting
        state.lastFilterUpdate = new Date();
        state.filterSource = 'bulk';
      }),

      /**
       * Deselect all zones and clear theme
       */
      deselectAllZones: () => set((state) => {
        state.selectedZones = [];
        state.selectedTheme = null;
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      /**
       * Select all advertisements from provided array
       */
      selectAllAdvertisements: (adIds) => set((state) => {
        state.selectedAdvertisements = [...adIds];
        state.lastFilterUpdate = new Date();
        state.filterSource = 'bulk';
      }),

      /**
       * Deselect all advertisements
       */
      deselectAllAdvertisements: () => set((state) => {
        state.selectedAdvertisements = [];
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      // Display options - using exact names from variable registry

      /**
       * Set show only selected zones flag
       */
      setShowOnlySelected: (show) => set((state) => {
        state.showOnlySelected = show;
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      /**
       * Set show only selected advertisements flag
       */
      setShowOnlySelectedAds: (show) => set((state) => {
        state.showOnlySelectedAds = show;
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      // Clear actions - using exact names from variable registry

      /**
       * Clear all filters and selections
       */
      clearAllFilters: () => set(() => ({
        ...initialState,
        lastFilterUpdate: new Date(),
        filterSource: 'user',
      })),

      /**
       * Clear only zone and advertisement selections
       */
      clearSelections: () => set((state) => {
        state.selectedZones = [];
        state.selectedAdvertisements = [];
        state.selectedTheme = null;
        state.showOnlySelected = false;
        state.showOnlySelectedAds = false;
        state.lastFilterUpdate = new Date();
        state.filterSource = 'user';
      }),

      // Default network initialization

      /**
       * Set default network if none is selected
       */
      setDefaultNetworkIfNone: (networks) => set((state) => {
        // Only set default if no network is currently selected
        if (!state.selectedNetwork && networks.length > 0) {
          // Try to find the default network (FASH Medien Verlag GmbH - SCHWULISSIMO)
          const defaultNetwork = networks.find(n => n.broadstreet_id === DEFAULT_NETWORK_ID);

          if (defaultNetwork) {
            state.selectedNetwork = defaultNetwork;
            state.lastFilterUpdate = new Date();
            state.filterSource = 'default';
          } else {
            // Fallback to first network if default not found
            state.selectedNetwork = networks[0];
            state.lastFilterUpdate = new Date();
            state.filterSource = 'default';
          }
        }
      }),

      // URL parameter integration

      /**
       * Set filters from URL search parameters
       */
      setFiltersFromParams: (params) => set((state) => {
        // Parse network parameter
        if (params.network) {
          // Note: This would need to be resolved to actual entity
          // For now, just store the ID - actual entity resolution happens in components
          state.filterSource = 'url';
        }

        // Parse advertiser parameter
        if (params.advertiser) {
          state.filterSource = 'url';
        }

        // Parse campaign parameter
        if (params.campaign) {
          state.filterSource = 'url';
        }

        // Parse zones parameter
        if (params.zones) {
          const zoneIds = Array.isArray(params.zones) ? params.zones : [params.zones];
          state.selectedZones = zoneIds;
          state.filterSource = 'url';
        }

        // Parse advertisements parameter
        if (params.advertisements) {
          const adIds = Array.isArray(params.advertisements) ? params.advertisements : [params.advertisements];
          state.selectedAdvertisements = adIds;
          state.filterSource = 'url';
        }

        // Parse display options
        if (params.showOnlySelected === 'true') {
          state.showOnlySelected = true;
          state.filterSource = 'url';
        }

        if (params.showOnlySelectedAds === 'true') {
          state.showOnlySelectedAds = true;
          state.filterSource = 'url';
        }

        state.lastFilterUpdate = new Date();
      }),

      /**
       * Get current filters as URL parameters
       * @returns {Record<string, string>} Object suitable for URL search params
       */
      getFiltersAsParams: () => {
        const state = get();
        const params = {};

        // Add network parameter
        if (state.selectedNetwork) {
          params.network = state.selectedNetwork.broadstreet_id?.toString() || state.selectedNetwork.mongo_id;
        }

        // Add advertiser parameter
        if (state.selectedAdvertiser) {
          params.advertiser = state.selectedAdvertiser.broadstreet_id?.toString() || state.selectedAdvertiser.mongo_id;
        }

        // Add campaign parameter
        if (state.selectedCampaign) {
          params.campaign = state.selectedCampaign.broadstreet_id?.toString() || state.selectedCampaign.mongo_id;
        }

        // Add zones parameter
        if (state.selectedZones.length > 0) {
          params.zones = state.selectedZones.join(',');
        }

        // Add advertisements parameter
        if (state.selectedAdvertisements.length > 0) {
          params.advertisements = state.selectedAdvertisements.join(',');
        }

        // Add display options
        if (state.showOnlySelected) {
          params.showOnlySelected = 'true';
        }

        if (state.showOnlySelectedAds) {
          params.showOnlySelectedAds = 'true';
        }

        return params;
      },
    })),
    {
      name: 'broadstreet-filters',
      // Only persist essential filter state, not metadata
      partialize: (state) => ({
        selectedNetwork: state.selectedNetwork,
        selectedAdvertiser: state.selectedAdvertiser,
        selectedCampaign: state.selectedCampaign,
        selectedTheme: state.selectedTheme,
        showOnlySelected: state.showOnlySelected,
        showOnlySelectedAds: state.showOnlySelectedAds,
      }),
    }
  )
);
