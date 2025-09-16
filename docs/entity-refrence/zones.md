# Zones

## Overview

Zones represent ad slots/placements within a network where advertisements can be displayed. Each zone belongs to a single network.

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
    "network_id": 85,
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
- On success, the local zone is updated with `original_broadstreet_id`, `synced_with_api: true`, and `synced_at`.

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

