# Full Test Report

## **Test Environment**

- **OS**: Windows 11
- **Browser**: Chrome
- **Device**: Desktop
- **Resolution**: 1920x1080
- **Playwright Version**: 1.39.0
- **Next.js Version**: 15.0.0
- **Node.js Version**: 20.9.0
- **pnpm Version**: 8.11.0


## Reference Docs
The docs/entity-reference folder has all the files that you should really read.
They are the one source of truth. Ask me if you find conflicts.


## Tasks

### Task 1:Sync Data Test
use Playwright mcp
Go do dashboard page and press sync data button.
Fix any issues and ensure that the data syncs correctly.

#### Findings after success

**Root Cause**: Sync functionality was failing due to database model changes that introduced a new standardized three-tier ID system. The sync functions were using deprecated ID patterns that violated the new ID management standards.

**Critical Issues Identified:**

1. **SyncLog Validation Error**:
   - Error: `SyncLog validation failed: networkId: Path 'networkId' is required`
   - Cause: SyncLog model requires `networkId` field, but global sync functions didn't provide it
   - Solution: Added `networkId: -1` for global sync operations with `syncType: 'full'`

2. **Deprecated ID Pattern Usage**:
   - **Old Pattern (FORBIDDEN)**: `(entity as any).broadstreet_id ?? (entity as any).id`
   - **New Pattern (REQUIRED)**: `mapApiIds(entity, { stripId: true }).broadstreet_id`
   - Impact: All sync functions were using forbidden fallback patterns instead of the standardized `mapApiIds` utility

3. **ID System Compliance**:
   - **Three-tier ID system**: `broadstreet_id` (number), `mongo_id` (string), `_id` (ObjectId)
   - **Documentation source**: `docs/entity-reference/ids.md` and `docs/database-id-consistency.md`
   - **Key principle**: No fallback patterns, strict adherence to field naming conventions

**Files Modified:**
- `src/lib/utils/sync-helpers.ts` - Updated all sync functions (syncNetworks, syncAdvertisers, syncZones, syncCampaigns, syncAdvertisements, syncPlacements)

**Pattern Replacements Made:**
```typescript
// OLD PATTERN (deprecated):
broadstreet_id: (network as any).broadstreet_id ?? (network as any).id,

// NEW PATTERN (required):
const mapped = mapApiIds(network, { stripId: true });
broadstreet_id: mapped.broadstreet_id,
```

**Sync Results After Fix:**
- Networks: 2 ✅
- Advertisers: 48 ✅
- Zones: 649 ✅
- Campaigns: 122 ✅
- Advertisements: 102 ✅
- Placements: 4,358 ✅

**Key Learning**: When database models change to enforce new ID standards, all sync functions must be updated to comply with the new patterns. The `mapApiIds` utility is essential for converting legacy API responses to the standardized ID format.

### Task 2: Networks Page
Please go to the networks page and ensure that all related functions are working correctly, including any filters, selections, display and any other related functions.
we should be able to see - Networks: 2 ✅
and any corresponding sidebar filters and selection systems should also reflect this.
**CRITICAL** We recently changed the /docs/database-id-consistency.md and /docs/entity-reference/ids.md Read to ensure that the truth of the two documents is reflected correctly
use playwright mcp as required
*Note* Data has been successfully syncd
