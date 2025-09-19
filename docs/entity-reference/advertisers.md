# Advertisers

## Overview

Advertisers represent companies that run advertising campaigns. Each advertiser belongs to a single network. Advertisers are fully integrated with the **Zustand store architecture** for consistent state management across the application.

## ID Management

Advertisers follow the standardized three-tier ID system:
- **`broadstreet_id`**: Broadstreet API identifier (number) - for synced advertisers
- **`mongo_id`**: MongoDB ObjectId (string) - for local storage and local-only advertisers
- **`_id`**: MongoDB native ObjectId - for internal database operations only

**Business Rule**: Advertisements cannot exist without synced advertisers (never local-only).

## Zustand Store Integration

### Store Location
- **Synced Advertisers**: `EntityState.advertisers` array (have `broadstreet_id`)
- **Local Advertisers**: `EntityState.localAdvertisers` array (local-only, no `broadstreet_id` yet)

### Selection Management
- **Filter State**: `FilterState.selectedAdvertiser` (can be synced or local)
- **ID Resolution**: Uses `EntitySelectionKey` for consistent handling of both ID types
- **Display**: Local advertisers show with yellowish styling cards and local badges

### Server-Side Integration
```typescript
// Server-side data fetching
const advertisers = await fetchAdvertisers(networkId);

// Client-side store initialization
const { setAdvertisers } = useEntityStore();
useEffect(() => {
  setAdvertisers(advertisers);  // Preserves all ID fields and entity types
}, [advertisers]);
```

## How to create an advertiser

Use the Broadstreet API to create an advertiser on a specific network.

- Required:
  - `access_token` (query) – found in your environment
  - `network_id` (query) – the Broadstreet network to create the advertiser on
- Endpoint: `POST https://api.broadstreetads.com/api/1/advertisers`
- Headers: `Content-Type: application/json`
- Query params:
  - `network_id` (number, required)
  - `access_token` (string, required)
- Request body (JSON):
  - `name` (string, required)
  - `web_home_url` (string, optional)
  - `notes` (string, optional)

Example cURL
```bash
curl -X POST \
  "https://api.broadstreetads.com/api/1/advertisers?network_id=85&access_token=$BROADSTREET_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Co.",
    "web_home_url": "https://acme.example",
    "notes": "VIP account"
  }'
```

Example response (201 Created)
```json
{
  "advertiser": {
    "id": 54321,
    "name": "Acme Co.",
    "logo": { "url": "https://cdn.broadstreetads.com/images/logo.png" },
    "web_home_url": "https://acme.example",
    "notes": null,
    "admins": [
      { "name": "Front Desk", "email": "frontdesk@acme.example" }
    ]
  }
}
```

TypeScript example (using our API helper)
```ts
import broadstreetAPI from '@/lib/broadstreet-api';

const created = await broadstreetAPI.createAdvertiser({
  name: 'Acme Co.',
  network_id: 85,
  web_home_url: 'https://acme.example',
  notes: 'VIP account',
  // Optionally include logo and admins when available in your flow
  // logo: { url: 'https://cdn.example/logo.png' },
  // admins: [{ name: 'Front Desk', email: 'frontdesk@acme.example' }]
});

// created => { broadstreet_id, name, web_home_url, notes, admins, ... }
```

Create locally (in-app, recommended during testing)
- Open the Advertisers page and click the “Create” button → choose Advertiser to open the Add Advertiser modal.
- The modal requires a network to be selected in the sidebar; it uses that selection to set `network_id`.
- On submit, it calls our local endpoint `POST /api/create/advertiser` and stores the advertiser as unsynced (`created_locally: true`, `synced_with_api: false`).

Local endpoint example
```bash
curl -X POST http://localhost:3000/api/create/advertiser \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Co.",
    "network_id": 85,
    "web_home_url": "https://acme.example",
    "notes": "VIP account",
    "admins": [{ "name": "Front Desk", "email": "frontdesk@acme.example" }]
  }'
```

What you should see after creating locally
- Advertisers page: the new advertiser card shows a "🏠 Local" badge and uses local card styling.
- Local Only page: the advertiser appears under “Advertisers” with a "Local Only" status badge, ready to sync.
- Data flags: item is saved with `created_locally: true` and `synced_with_api: false` until synced.

Add Advertiser modal data mapping
- Required: `name` and a selected network. `network_id` is derived from the sidebar-selected network (numeric Broadstreet ID when available).
- Optional fields sent only if provided: `web_home_url`, `notes`, `admins` (array of `{ name, email }`).
- Duplicate checks (local): rejects duplicate `name` within the same `network_id`.

Notes
- Pass `access_token` in the query string; the API expects it there.
- A 401 indicates an invalid or missing token. Ensure `BROADSTREET_API_TOKEN` is set.
- You can list advertisers for a network with `GET /advertisers?network_id=...`.

Reference: [Broadstreet Advertisers API v1](https://api.broadstreetads.com/docs/v1#tag/Advertisers)

## Sync a local advertiser to Broadstreet

In-app steps
- Go to Local Only → Advertisers section.
- Click “Sync All to Broadstreet” to sync all local entities for the selected network. Advertisers are synced first, before zones and campaigns.

API (sync all local entities for a network)
```bash
curl -X POST http://localhost:3000/api/sync/local-all \
  -H "Content-Type: application/json" \
  -d '{
    "networkId": 85
  }'
```

What happens
- A dry run validates duplicates and dependencies.
- If valid, the service creates missing entities in Broadstreet. For advertisers, it uses `name` and optional fields like `web_home_url`, `notes`, `logo`, and `admins` if present.
- On success, the local advertiser is updated with `broadstreet_id`, `synced_with_api: true`, and `synced_at`.
- If an advertiser with the same `name` already exists remotely, we link to the existing one rather than creating a duplicate.

## How to update an advertiser

Use `PUT https://api.broadstreetads.com/api/1/advertisers/{id}` with any fields you want to update (`name`, `web_home_url`, `notes`). Include `access_token` in the query string.

## Pre-requisites
- access token - found in the .env file
- network id
  - In-app creation: comes from the network you select in the sidebar filters; the Add Advertiser modal reads it automatically.
  - API usage: the numeric Broadstreet `network_id` (e.g., 85). Obtain by listing networks via API or from stored networks where `Network.id` equals the Broadstreet ID.

**CRITICAL**
- if a value is not required and it is not provided, it will not be included in the request body.
- other than the id, we never rely on another id.
- when we open an advertiser creation form, we DO NOT have an advertiser id. We also don’t give it any. We do that only on save.
- fields required by the broadstreet api that are required need to present. They are almost always in the filters section of the sidebar. e.g. network id is always required.
- local duplicate advertiser names within a network are rejected; remote duplicates are linked rather than created.

## Implementation Status

### ✅ **COMPLETED - Production Ready**

Advertiser sync functionality has been successfully implemented and is fully operational.

#### **Core Features Implemented:**
- ✅ **Local Advertiser Creation**: Full support via `src/lib/models/local-advertiser.ts`
- ✅ **Main Advertiser Collection**: Support via `src/lib/models/advertiser.ts`
- ✅ **Broadstreet API Integration**: Complete advertiser creation and sync
- ✅ **Duplicate Detection**: Automatic linking of existing advertisers
- ✅ **Sync Tracking**: `created_locally`, `synced_with_api`, `synced_at` fields
- ✅ **Error Handling**: Comprehensive error classification and retry logic

#### **API Endpoints Implemented:**
- ✅ `POST /api/sync/advertisers` - Individual advertiser sync
- ✅ `POST /api/sync/local-all` - Comprehensive sync including advertisers
- ✅ Advertiser creation via Broadstreet API with proper validation

#### **Sync Process:**
- ✅ **Network Validation**: Ensures network exists before advertiser sync
- ✅ **Duplicate Handling**: Links existing advertisers instead of creating duplicates
- ✅ **ID Resolution**: Converts MongoDB ObjectIds to Broadstreet numeric IDs
- ✅ **Dependency Management**: First entity in sync hierarchy (no dependencies)

**System Status: ✅ FULLY OPERATIONAL**

## Zustand Store Usage Patterns

### Entity Store Actions
```typescript
// Setting advertisers with validation
const { setAdvertisers, setLocalAdvertisers } = useEntityStore();

// Synced advertisers (from Broadstreet API)
setAdvertisers(advertisers.filter(a => a.name && (a.broadstreet_id || a.mongo_id)));

// Local advertisers (created locally)
setLocalAdvertisers(localAdvertisers.filter(a => a.name && a.network_id && a.mongo_id));
```

### Filter Store Integration
```typescript
// Advertiser selection with ID resolution
const { selectedAdvertiser, setSelectedAdvertiser } = useFilterStore();

// Handle advertiser selection (can be synced or local)
const handleAdvertiserSelect = (advertiser: AdvertiserEntity) => {
  setSelectedAdvertiser(advertiser);
  // Automatically clears dependent selections (campaigns)
};

// Check if advertiser is selected
const isSelected = selectedAdvertiser &&
  getEntityId(selectedAdvertiser) === getEntityId(advertiser);
```

### Component Integration
```typescript
// Using advertisers in components
const advertisers = useEntityStore(state => state.advertisers);
const localAdvertisers = useEntityStore(state => state.localAdvertisers);
const selectedAdvertiser = useFilterStore(state => state.selectedAdvertiser);

// Combined advertiser list for display
const allAdvertisers = useMemo(() => [
  ...advertisers,
  ...localAdvertisers
], [advertisers, localAdvertisers]);

// Filter by network
const filteredAdvertisers = allAdvertisers.filter(advertiser =>
  !selectedNetwork || advertiser.network_id === selectedNetwork.broadstreet_id
);
```

### Variable Naming Compliance
Following `docs/variable-origins.md` standards:
- `selectedAdvertiser` - Currently selected advertiser entity in filter state
- `advertisers` - Collection of all synced advertiser entities from API/database
- `localAdvertisers` - Collection of locally created advertiser entities
- `isLoadingAdvertisers` - Loading state for advertiser data fetching operations
- `advertiserError` - Error state for advertiser-related operations
