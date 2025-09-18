# Variable Origins Registry - Single Source of Truth for Variable Names

## Purpose

This document maintains a registry of all variable names used across multiple functions to ensure 100% consistency throughout the Zustand implementation and beyond.

## Usage Rules

**MANDATORY PROCESS FOR ALL VARIABLE NAMING:**

1. **Before creating ANY variable name that will be used by more than one function:**
   - ✅ **Check this document FIRST**
   - ✅ **If variable name exists**: Use the EXACT name from this document
   - ✅ **If variable name does NOT exist**: Add new entry with variable name + one-sentence description

2. **Multi-Function Criteria** - Variables used across:
   - Multiple store actions
   - Store state + component usage  
   - Multiple components
   - Server-side functions + client-side usage
   - Any cross-boundary variable references

3. **Entry Format**: `variableName` - One sentence description of what it holds/represents

---

## Entity Variables

### Selected Entities (Filter State)
- `selectedNetwork` - Currently selected network entity in filter state
- `selectedAdvertiser` - Currently selected advertiser entity in filter state  
- `selectedCampaign` - Currently selected campaign entity in filter state
- `selectedTheme` - Currently selected theme entity in filter state

### Entity Collections (Store State)
- `networks` - Collection of all network entities from API/database
- `advertisers` - Collection of all advertiser entities from API/database
- `campaigns` - Collection of all campaign entities from API/database
- `zones` - Collection of all zone entities from API/database
- `advertisements` - Collection of all advertisement entities from API/database

### Local Entity Collections (Store State)
- `localAdvertisers` - Collection of locally created advertiser entities before sync
- `localZones` - Collection of locally created zone entities before sync
- `localCampaigns` - Collection of locally created campaign entities before sync
- `localNetworks` - Collection of locally created network entities before sync
- `localAdvertisements` - Collection of locally created advertisement entities before sync
- `localPlacements` - Collection of locally created placement entities before sync

### Selection Arrays (Filter State)
- `selectedZones` - Array of selected zone IDs (EntitySelectionKey[]) for filtering operations
- `selectedAdvertisements` - Array of selected advertisement IDs (EntitySelectionKey[]) for filtering operations

---

## State Variables

### Loading States
- `isLoadingNetworks` - Loading state for network data fetching operations
- `isLoadingAdvertisers` - Loading state for advertiser data fetching operations
- `isLoadingCampaigns` - Loading state for campaign data fetching operations
- `isLoadingZones` - Loading state for zone data fetching operations
- `isLoadingAdvertisements` - Loading state for advertisement data fetching operations
- `isLoadingLocalEntities` - Loading state for local entity data fetching operations
- `isLoadingPlacements` - Loading state for placement data fetching operations
- `isLoadingThemes` - Loading state for theme data fetching operations

### Error States
- `networkError` - Error state for network-related operations
- `advertiserError` - Error state for advertiser-related operations
- `campaignError` - Error state for campaign-related operations
- `zoneError` - Error state for zone-related operations
- `advertisementError` - Error state for advertisement-related operations
- `localEntitiesError` - Error state for local entity operations
- `placementError` - Error state for placement-related operations
- `themeError` - Error state for theme-related operations

### Display Options (Filter State)
- `showOnlySelected` - Boolean flag to show only selected zones in displays
- `showOnlySelectedAds` - Boolean flag to show only selected advertisements in displays

---

## Action Variables

### Entity Setters
- `setNetworks` - Action to set the networks collection in store state
- `setAdvertisers` - Action to set the advertisers collection in store state
- `setCampaigns` - Action to set the campaigns collection in store state
- `setZones` - Action to set the zones collection in store state
- `setAdvertisements` - Action to set the advertisements collection in store state

### Local Entity Setters
- `setLocalEntities` - Action to set all local entity collections in store state
- `setLocalZones` - Action to set the local zones collection in store state
- `setLocalAdvertisers` - Action to set the local advertisers collection in store state
- `setLocalCampaigns` - Action to set the local campaigns collection in store state
- `setLocalPlacements` - Action to set the local placements collection in store state

### Selection Actions
- `setSelectedNetwork` - Action to set the currently selected network in filter state
- `setSelectedAdvertiser` - Action to set the currently selected advertiser in filter state
- `setSelectedCampaign` - Action to set the currently selected campaign in filter state
- `setSelectedZones` - Action to set the array of selected zone IDs in filter state
- `setSelectedAdvertisements` - Action to set the array of selected advertisement IDs in filter state
- `setSelectedTheme` - Action to set the currently selected theme in filter state

### Toggle Actions
- `toggleZoneSelection` - Action to toggle a single zone's selection state
- `toggleAdvertisementSelection` - Action to toggle a single advertisement's selection state

### Bulk Actions
- `selectAllZones` - Action to select all available zones
- `deselectAllZones` - Action to deselect all currently selected zones
- `selectAllAdvertisements` - Action to select all available advertisements
- `deselectAllAdvertisements` - Action to deselect all currently selected advertisements

### Loading Actions
- `setLoading` - Action to set loading state for a specific entity type
- `setAllLoading` - Action to set loading state for all entity types

### Error Actions
- `setError` - Action to set error state for a specific entity type
- `clearErrors` - Action to clear all error states

---

## Function Parameters

### Entity Parameters
- `network` - Single network entity parameter in functions
- `advertiser` - Single advertiser entity parameter in functions
- `campaign` - Single campaign entity parameter in functions
- `zone` - Single zone entity parameter in functions
- `advertisement` - Single advertisement entity parameter in functions

### Collection Parameters
- `networks` - Array of network entities parameter in functions
- `advertisers` - Array of advertiser entities parameter in functions
- `campaigns` - Array of campaign entities parameter in functions
- `zones` - Array of zone entities parameter in functions
- `advertisements` - Array of advertisement entities parameter in functions

### ID Parameters
- `networkId` - Network ID parameter (always number/broadstreet_id)
- `advertiserId` - Advertiser ID parameter (number or string depending on context)
- `campaignId` - Campaign ID parameter (number or string depending on context)
- `zoneId` - Zone ID parameter (number or string depending on context)
- `advertisementId` - Advertisement ID parameter (always number/broadstreet_id)

### Filter Parameters
- `filterValue` - Generic filter value parameter for sidebar filter resolution
- `entityId` - Generic entity ID parameter for utility functions
- `entityType` - Entity type parameter for generic entity operations

---

## Server-Side Variables

### Data Fetchers
- `fetchNetworks` - Server-side function to fetch networks from database
- `fetchAdvertisers` - Server-side function to fetch advertisers from database
- `fetchCampaigns` - Server-side function to fetch campaigns from database
- `fetchZones` - Server-side function to fetch zones from database
- `fetchAdvertisements` - Server-side function to fetch advertisements from database
- `fetchLocalEntities` - Server-side function to fetch all local entities from database

### Search Parameters
- `searchParams` - Next.js search parameters object from page props
- `params` - Parsed search parameters object in server components

### Initial Data Props
- `initialNetworks` - Initial networks data passed from server to client
- `initialAdvertisers` - Initial advertisers data passed from server to client
- `initialCampaigns` - Initial campaigns data passed from server to client
- `initialZones` - Initial zones data passed from server to client
- `initialAdvertisements` - Initial advertisements data passed from server to client
- `initialLocalEntities` - Initial local entities data passed from server to client

---

## Component Variables

### Hook Returns
- `entityStore` - Return value from useEntityStore hook
- `filterStore` - Return value from useFilterStore hook
- `syncStore` - Return value from useSyncStore hook
- `appStore` - Return value from useAppStore hook

### Component Props
- `entity` - Generic entity prop in reusable components
- `entities` - Generic entities array prop in reusable components
- `selectedIds` - Array of selected entity IDs prop in selection components
- `onSelectionChange` - Callback function prop for selection changes

---

## Utility Variables

### ID Resolution
- `entityId` - Result from getEntityId utility function
- `broadstreet_id` - Broadstreet ID extracted from resolveSidebarFilterId
- `mongo_id` - MongoDB ID extracted from resolveSidebarFilterId

### Entity Classification
- `isSync` - Result from isEntitySynced utility function
- `entityType` - Result from getEntityType utility function
- `entitySelectionKey` - Result from getEntitySelectionKey utility function

---

## Notes

- This registry will be continuously updated during implementation
- All entries must follow the established naming conventions in `docs/style-guides/variable-naming.md`
- When in doubt, add the variable to this registry rather than risk inconsistency
- Review this document regularly to ensure no duplicate or conflicting names exist
