# Zones

## Overview

Zones represent ad slots/placements within a network where advertisements can be displayed. Each zone belongs to a single network. Zones are fully integrated with the **Zustand store architecture** for complex filtering by size types, network gating, search, and theme integration.

## ID Management

Zones follow the standardized three-tier ID system:
- **`broadstreet_id`**: Broadstreet API identifier (number) - for synced zones
- **`mongo_id`**: MongoDB ObjectId (string) - for local storage and local-only zones
- **`_id`**: MongoDB native ObjectId - for internal database operations only

**Display Rule**: Local zones should display MongoDB IDs with local badges when `broadstreet_id` is undefined.

## Zustand Store Integration

### Store Location
- **Synced Zones**: `EntityState.zones` array (have `broadstreet_id`)
- **Local Zones**: `EntityState.localZones` array (local-only, no `broadstreet_id` yet)

### Selection Management
- **Filter State**: `FilterState.selectedZones` array of `EntitySelectionKey` values
- **Theme Integration**: Zone selection automatically updates when theme is selected
- **Complex Filtering**: Size types, network gating, search, and theme integration

### Server-Side Integration
```typescript
// Server-side data fetching with network filtering
const zones = await fetchZones(networkId);

// Client-side store initialization
const { setZones, setLocalZones } = useEntityStore();
useEffect(() => {
  setZones(zones.filter(z => z.name && z.network_id && (z.broadstreet_id || z.mongo_id)));
}, [zones]);
```

## How to create a zone

Use the Broadstreet API to create a zone on a specific network.

- Required:
  - `access_token` (query) – found in your environment
  - `network_id` (query) – the Broadstreet network to create the zone on
- Endpoint: `POST https://api.broadstreetads.com/api/1/zones`
- Headers: `Content-Type: application/json`
- Query params:
  - `network_id` (number, required)
  - `access_token` (string, required)
- Request body (JSON):
  - `name` (string, required)
  - `alias` (string, optional)

Example cURL
```bash
curl -X POST \
  "https://api.broadstreetads.com/api/1/zones?network_id=85&access_token=$BROADSTREET_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Homepage Leaderboard",
    "alias": "home-leaderboard"
  }'
```

Example response (201 Created)
```json
{
  "zone": {
    "id": 12345,
    "name": "Homepage Leaderboard",
    "network_id": 85,
    "alias": "home-leaderboard",
    "self_serve": false
  }
}
```

TypeScript example (using our API helper)
```ts
import broadstreetAPI from '@/lib/broadstreet-api';

const created = await broadstreetAPI.createZone({
  name: 'Homepage Leaderboard',
  network_id: 85,
  alias: 'home-leaderboard',
});

// created => { broadstreet_id, name, network_id, alias, self_serve }
```

Create locally (in-app, recommended during testing)
- Open the Zones page and click the “Create” button → choose Zone to open the Add Zone modal.
- The modal requires a network to be selected in the sidebar; it uses that selection to set `network_id`.
- On submit, it calls our local endpoint `POST /api/create/zone` and stores the zone as unsynced (`created_locally: true`, `synced_with_api: false`).

Local endpoint example
```bash
curl -X POST http://localhost:3000/api/create/zone \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Homepage Leaderboard",
    "networkId": 85,
    "alias": "home-leaderboard"
  }'
```

What you should see after creating locally
- Zones page: the new zone card shows a "🏠 Local" badge and uses local card styling.
- Local Only page: the zone appears under “Zones” with a "Local Only" status badge, ready to sync.
- Data flags: item is saved with `created_locally: true` and `synced_with_api: false` until synced.

Add Zone modal data mapping
- Required: `name` and a selected network. `network_id` is derived from the sidebar-selected network (numeric Broadstreet ID when available).
- Optional fields sent only if provided: `alias`, `advertisement_count`, `allow_duplicate_ads`, `concurrent_campaigns`, `advertisement_label`, `archived`, `display_type` (standard/rotation), `rotation_interval` (>= 1000ms when rotation), `animation_type`, `width`, `height`, `rss_shuffle`, `style`, `self_serve`.
- Duplicate checks (local): rejects duplicate `name` or `alias` within the same `network_id`.

Notes
- Pass `access_token` in the query string; the API expects it there.
- A 401 indicates an invalid or missing token. Ensure `BROADSTREET_API_TOKEN` is set.
- Name must be unique enough for your workflow; you can optionally check for existing zones before creating.

Reference: [Broadstreet Zones API v1](https://api.broadstreetads.com/docs/v1#tag/Zones)

## Sync a local zone to Broadstreet

In-app steps
- Go to Local Only → Zones section.
- Click “Sync All to Broadstreet” to sync all local entities for the selected network. Zones will be synced after advertisers, before campaigns.
- Alternatively, use the Zones page to ensure your network is selected, then run a sync from the Local Only page.

API (sync all local entities for a network)
```bash
curl -X POST http://localhost:3000/api/sync/local-all \\
  -H "Content-Type: application/json" \\
  -d '{
    "networkId": 85
  }'
```

What happens
- A dry run validates duplicates and dependencies.
- If valid, the service creates missing entities in Broadstreet. For zones, it uses `name`, `network_id`, and optional fields like `alias` and `self_serve` if present.
- On success, the local zone is updated with `broadstreet_id`, `synced_with_api: true`, and `synced_at`.

## How to update a zone

## Pre-requisites
- access token - found in the .env file
- network id
  - In-app creation: comes from the network you select in the sidebar filters; the Add Zone modal reads it automatically.
  - API usage: the numeric Broadstreet `network_id` (e.g., 85). Obtain by listing networks via API or from stored networks where `Network.id` equals the Broadstreet ID.

**CRITICAL**
- if a value is not required and it is not provided, it will not be included in the request body.
- other than the id, we never rely on another id.
- when we open a zone creation form, we DO NOT have a zone id. We also dont give it any. We do that only on save.
- fields required by the broadstreet api that are required need to present. They are almost always in the filters section of the sidebar. e.g. network id is always required.
- in zone duplicate names are allowed.

## Implementation Status

### ✅ **COMPLETED - Production Ready**

Zone sync functionality has been successfully implemented and is fully operational.

#### **Core Features Implemented:**
- ✅ **Local Zone Creation**: Full support via `src/lib/models/local-zone.ts`
- ✅ **Broadstreet API Integration**: Complete zone creation and sync
- ✅ **Duplicate Detection**: Automatic linking of existing zones
- ✅ **Sync Tracking**: `created_locally`, `synced_with_api`, `synced_at` fields
- ✅ **Error Handling**: Comprehensive error classification and retry logic

#### **API Endpoints Implemented:**
- ✅ `POST /api/sync/zones` - Individual zone sync
- ✅ `POST /api/sync/local-all` - Comprehensive sync including zones
- ✅ Zone creation via Broadstreet API with proper validation

#### **Sync Process:**
- ✅ **Network Validation**: Ensures network exists before zone sync
- ✅ **Duplicate Handling**: Links existing zones instead of creating duplicates
- ✅ **ID Resolution**: Converts MongoDB ObjectIds to Broadstreet numeric IDs
- ✅ **Dependency Management**: Independent entity (no dependencies except network)

**System Status: ✅ FULLY OPERATIONAL**

## Zustand Store Usage Patterns

### Entity Store Actions
```typescript
// Setting zones with validation
const { setZones, setLocalZones } = useEntityStore();

// Synced zones (from Broadstreet API)
setZones(zones.filter(z => z.name && z.network_id && (z.broadstreet_id || z.mongo_id)));

// Local zones (created locally)
setLocalZones(localZones.filter(z => z.name && z.network_id && z.mongo_id));
```

### Filter Store Integration with Theme Support
```typescript
// Zone selection with theme integration
const { selectedZones, setSelectedZones, selectedTheme, setSelectedTheme } = useFilterStore();

// Handle zone selection
const handleZoneToggle = (zone: ZoneEntity) => {
  const zoneId = String(getEntityId(zone));
  const newSelection = selectedZones.includes(zoneId)
    ? selectedZones.filter(id => id !== zoneId)
    : [...selectedZones, zoneId];

  setSelectedZones(newSelection);
  // Automatically clears theme if zones no longer match
};

// Theme selection with automatic zone mapping
const handleThemeSelect = (theme: ThemeEntity) => {
  setSelectedTheme(theme);
  // Automatically sets selectedZones to theme's zone IDs
  setSelectedZones(theme.zone_ids.map(String));
};

// Bulk zone operations
const selectAllZones = (zones: ZoneEntity[]) => {
  const zoneIds = zones.map(z => String(getEntityId(z)));
  setSelectedZones(zoneIds);
};
```

### Complex Zone Filtering
```typescript
// Multi-dimensional zone filtering
const zones = useEntityStore(state => state.zones);
const localZones = useEntityStore(state => state.localZones);
const selectedNetwork = useFilterStore(state => state.selectedNetwork);

// Combined zone list with network filtering
const allZones = useMemo(() => [
  ...zones,
  ...localZones
], [zones, localZones]);

const filteredZones = allZones.filter(zone => {
  // Network filtering
  if (selectedNetwork && zone.network_id !== selectedNetwork.broadstreet_id) {
    return false;
  }

  // Size type filtering
  if (sizeTypeFilter && zone.size_type !== sizeTypeFilter) {
    return false;
  }

  // Search filtering
  if (searchQuery && !zone.name.toLowerCase().includes(searchQuery.toLowerCase())) {
    return false;
  }

  return true;
});
```

### Theme Integration Patterns
```typescript
// Sidebar filter mutual exclusivity
const { selectedTheme, selectedZones, setSelectedTheme, setSelectedZones } = useFilterStore();

// Selecting a theme replaces currently selected zones
const selectTheme = (theme: ThemeEntity) => {
  setSelectedTheme(theme);
  setSelectedZones(theme.zone_ids.map(String)); // Replace current selection
};

// Selecting zones manually clears theme if they don't match
const updateZoneSelection = (newZones: string[]) => {
  setSelectedZones(newZones);

  // Clear theme if zones don't match theme's zones
  if (selectedTheme) {
    const themeZoneIds = selectedTheme.zone_ids.map(String);
    const zonesMatch = newZones.length === themeZoneIds.length &&
      newZones.every(id => themeZoneIds.includes(id));
    if (!zonesMatch) {
      setSelectedTheme(null);
    }
  }
};
```

### Variable Naming Compliance
Following `docs/variable-origins.md` standards:
- `selectedZones` - Array of selected zone IDs for filtering operations
- `zones` - Collection of all synced zone entities from API/database
- `localZones` - Collection of locally created zone entities
- `isLoadingZones` - Loading state for zone data fetching operations
- `zoneError` - Error state for zone-related operations

## Business Logic for display and selection
Zones are selected in three ways. Except for themes, selection of zones is an additive process. Filtering does not deselect zones.
- by theme
- by filter
- by clicking on a zone card

Deselection also happens in 3 ways. 
- when a theme is selected, all other zones are deselected. 
- using the deselect all visible button
- using the deselect by clicking on a zone card

### Selction by Theme
The theme selection is the only exclusive zone selection. All the currnt zones are deselected and the zones in the theme are selected. 
**IMPORTANT**Themes never have local zones in thme.

### Selection by filters
bu default, the zones page shows ALL zones. It is not filtered by the sidebar filters. Ofcourse network is always set.
Currently we have a filter. the filter will filter out zones beased on substring match in ANY part of the zone data (pls confirm this)
**NEW FEATURE** We will add a negative filter. it superceedes the search filter and filters out zones whoes data contains a substring that match the negative filter. (pls implement)

once the zones are displayed, we can simple click on select all visible. The existing zones in selected list will be preserved and only the visible zones will be added to the selected list.

### Selection by clicking on a zone card
When we click on a zone card, we toggle the selection of the zone. If the zone is already selected, we deselect it. If the zone is not selected, we select it. The rest of the zones are preserved.

### Deselection by clicking on a zone card
When we click on a zone card, we toggle the selection of the zone. If the zone is already selected, we deselect it. If the zone is not selected, we select it. The rest of the zones are preserved.

### Deselection by using the deselect all visible button
When we click on the deselect all visible button, we deselect all the visible zones. The rest of the zones are preserved.
Again we will use the search and negative search to filter the zones. we can also use the show selected zones checkbox present in the ui to quickly filter to selected zones.


