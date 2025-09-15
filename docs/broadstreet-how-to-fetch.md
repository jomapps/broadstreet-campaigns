## Broadstreet: How to fetch entities

Authoritative reference: [Broadstreet API v1](https://api.broadstreetads.com/docs/v1)

### Authentication
- Use `access_token` query param on every request.

### Entities and fetch methods
- Networks
  - GET `/networks`
  - Returns `{ networks: Network[] }`
- Advertisers (by network)
  - GET `/advertisers?network_id={networkId}`
  - Returns `{ advertisers: Advertiser[] }`
- Zones (by network)
  - GET `/zones?network_id={networkId}`
  - Returns `{ zones: Zone[] }`
- Campaigns (by advertiser OR by zone)
  - GET `/campaigns?advertiser_id={advertiserId}`
  - GET `/campaigns?zone_id={zoneId}`
  - Returns `{ campaigns: Campaign[] }`
- Advertisements (by network, optionally filtered by zone or advertiser)
  - GET `/advertisements?network_id={networkId}[&zone_id=...][&advertiser_id=...]`
  - Returns `{ advertisements: Advertisement[] }`
- Placements (by campaign)
  - GET `/placements?campaign_id={campaignId}`
  - Returns an array of placement objects

### Recommended sync flow (current implementation: global upsert)
1) Clear Phase (local cache only)
   - Currently, we do not delete per-network. We perform idempotent global upserts for Networks, Advertisers, Zones, Campaigns, and Advertisements using `bulkWrite({ updateOne: { upsert: true }})` to avoid large deletions. Placements are refreshed per-campaign and normalized so every campaign has a `placements` array (possibly empty).
2) Fetch Phase
   - `GET /advertisers?network_id={networkId}` → store advertisers with `network_id`
   - `GET /zones?network_id={networkId}` → store zones
   - For each advertiser: `GET /campaigns?advertiser_id={advertiserId}` → store campaigns with `network_id`
   - `GET /advertisements?network_id={networkId}` → store ads with `network_id`
   - For each campaign: `GET /placements?campaign_id={campaignId}` → embed into campaign document as `{ advertisement_id, zone_id, restrictions[] }`
3) Store Phase
   - Use bulk `updateOne` with `upsert: true` for performance and idempotency; this avoids a full delete-then-insert cycle.
4) Validation Phase
   - Count and log inserted records by entity. Update UI counts via a server component refresh.

### Local model notes
- Persist explicit IDs to avoid confusion:
  - `broadstreet_*_id` mirrors the Broadstreet `id`
  - `local_*_id` mirrors Mongo `_id`
  - For cached (synced) collections, also persist `network_id` where applicable to support network-scoped purges/inserts.

### Code pointers
- HTTP wrapper and mapping: `src/lib/broadstreet-api.ts`
- Network-scoped sync route: `src/app/api/sync/network/route.ts`
- Dashboard stats (counts): `src/app/dashboard/page.tsx`

This process aligns with Broadstreet API requirements (network-scoped for advertisers/zones/ads; advertiser-scoped for campaigns; campaign-scoped for placements). We choose global upsert for simplicity and performance in test environments; if network-scoped clearing is required, adjust filters in queries accordingly. See the official docs: https://api.broadstreetads.com/docs/v1

### Placement sync troubleshooting and fixes

- Root cause: Using `campaign.id` (Mongo `_id`) when calling the placements API returns no results. The Broadstreet API requires the Broadstreet campaign identifier.
- Fix: Use `campaign.broadstreet_id` when invoking placements fetches.
- Implementation reference: `src/lib/utils/sync-helpers.ts` in `syncPlacements()` uses `const campBsId = (campaign as any).broadstreet_id;` and calls `broadstreetAPI.getPlacements(campBsId)`. Embedded placements are mapped to `{ advertisement_id, zone_id, restrictions[] }` with compatibility for `*_broadstreet_id` keys from the API.

### Field mapping standards

- Normalize API payloads to explicit schema fields:
  - `advertisement_broadstreet_id` → `advertisement_id`
  - `zone_broadstreet_id` → `zone_id`
  - Preserve arrays like `restrictions` as-is; default to `[]` if missing.
- Campaign document schema guarantees `placements` is either an array or absent; empty responses should be stored as `placements: []` for consistency.

### Validation expectations

- A complete sync commonly returns: `networks = 2` and 10+ records for each of `advertisers`, `zones`, `campaigns`, `advertisements`. Placement totals vary but should be non-negative and reflect embedded arrays.

### Tests and automated verification

- End-to-end tests validate the sync pipeline and dashboard counts:
  - `tests/sync-functionality.spec.ts`: calls `/api/sync/all`, verifies counts and basic embedding integrity, and cross-checks dashboard numbers.
  - `tests/dashboard-validation.spec.ts`: exercises the Dashboard UI, triggers Sync via Quick Actions, and validates responsive/loading states.
  - `tests/placement-embedding.spec.ts`: asserts placement embedding schema and referential integrity against `advertisements` and `zones` collections.

### Debugging tips

- If placement counts are zero:
  - Confirm `campaign.broadstreet_id` is present for all campaigns.
  - Ensure `broadstreetAPI.getPlacements(campaignId)` is called with Broadstreet ID.
  - Check `Campaign.updateOne({ _id }, { placements: [...] })` runs; look for logs indicating embedded count.
- If counts on the dashboard do not update after sync, ensure a server component refresh occurs. The `QuickActions` component calls `router.refresh()` on successful sync completion.

