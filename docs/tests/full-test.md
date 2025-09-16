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

#### Findings after success

**Root Cause**: Networks page and sidebar filters were using forbidden fallback patterns that violated the standardized three-tier ID system established in the database consistency audit. Multiple components were using deprecated ID resolution patterns instead of the centralized utility functions.

**Critical Issues Identified:**

1. **Forbidden Fallback Patterns in FiltersCard.tsx**:
   - **Error Pattern**: `(selectedNetwork as any)?.broadstreet_id ?? (selectedNetwork as any)?.id`
   - **Error Pattern**: `(network as any).broadstreet_id?.toString?.() || (network as any).id?.toString?.()`
   - **Cause**: Direct field access with fallback logic instead of using standardized utility functions
   - **Solution**: Replaced all instances with `getEntityId(entity)` utility function

2. **Inconsistent ID Display Patterns**:
   - **Error Pattern**: Hardcoded `"BS ID: {network.broadstreet_id}"` in network cards
   - **Cause**: Manual ID display instead of using standardized component
   - **Solution**: Replaced with `<EntityIdBadge broadstreet_id={entity.broadstreet_id} mongo_id={entity.mongo_id} />`

3. **Non-Standard Selection Logic**:
   - **Error Pattern**: `(selectedNetwork as any)?.broadstreet_id === network.broadstreet_id`
   - **Cause**: Direct field comparison instead of using entity ID utilities
   - **Solution**: Replaced with `getEntityId(selectedNetwork) === getEntityId(network)`

**Files Modified:**
- `src/components/layout/FiltersCard.tsx` - Fixed network dropdown selection logic
- `src/app/networks/page.tsx` - Fixed network card selection and ID display

**Pattern Replacements Made:**
```typescript
// OLD PATTERNS (forbidden):
(entity as any)?.broadstreet_id ?? (entity as any)?.id
(entity as any).broadstreet_id?.toString?.() || (entity as any).id?.toString?.()
"BS ID: {entity.broadstreet_id}"

// NEW PATTERNS (required):
getEntityId(entity)
getEntityId(entity)?.toString()
<EntityIdBadge broadstreet_id={entity.broadstreet_id} mongo_id={entity.mongo_id} />
```

**Testing Results After Fix:**
- Networks Display: 2 networks ✅ (matches sync results)
- Network Selection: Card and dropdown selection working ✅
- Sidebar Synchronization: Network filters properly synchronized ✅
- ID Display: EntityIdBadge showing "BS #9396" and "BS #9415" ✅
- Standards Compliance: All forbidden patterns eliminated ✅

**Key Learning**: The same forbidden fallback patterns (`entity.broadstreet_id ?? entity.id`) are likely present in other entity pages (advertisers, campaigns, zones, advertisements, placements). All entity components should be audited for:
1. **Forbidden fallback patterns** in selection logic
2. **Hardcoded ID displays** instead of EntityIdBadge
3. **Direct field access** instead of getEntityId() utility
4. **Inconsistent key/value patterns** in dropdown components

**Confirmed Similar Issues in Other Entities:**

**ADVERTISERS PAGE** (`src/app/advertisers/page.tsx`) - **5 VIOLATIONS FOUND**:
```typescript
// ❌ Line 246: Forbidden fallback pattern in selection logic
const currentId = (selectedAdvertiser as any)?.broadstreet_id ?? (selectedAdvertiser as any)?.mongo_id ?? (selectedAdvertiser as any)?.name;

// ❌ Line 247: Forbidden fallback pattern in comparison
const nextId = advertiser.broadstreet_id ?? advertiser.mongo_id ?? advertiser.name;

// ❌ Line 256: Forbidden fallback pattern in delete logic
const advId = advertiser.broadstreet_id ?? advertiser.mongo_id;

// ❌ Line 313: Forbidden fallback pattern in key generation
key={String(advertiser.broadstreet_id ?? advertiser.mongo_id ?? advertiser.name)}

// ❌ Line 316: Mixed pattern - uses getEntityId() but also fallback
String(getEntityId(selectedAdvertiser as any)) === String(advertiser.broadstreet_id ?? advertiser.mongo_id ?? advertiser.name)
```

**CAMPAIGNS PAGE** (`src/app/campaigns/page.tsx`) - **1 VIOLATION FOUND**:
```typescript
// ❌ Line 224: Forbidden fallback pattern in search logic
const idStr = String(campaign.broadstreet_id ?? campaign.mongo_id ?? '');
```

**ZONES, ADVERTISEMENTS, PLACEMENTS PAGES** - **NO VIOLATIONS FOUND**:
- These pages appear to be already using proper patterns or EntityIdBadge components
- May have been fixed in previous updates or built with correct patterns initially

**Immediate Action Required:**
1. **ADVERTISERS PAGE**: Fix 5 critical violations in `src/app/advertisers/page.tsx`
2. **CAMPAIGNS PAGE**: Fix 1 violation in `src/app/campaigns/page.tsx`
3. **VALIDATION**: Run regex search `broadstreet_id.*\?\?.*id|id.*\?\?.*broadstreet_id` across entire codebase
4. **TESTING**: Verify all entity selection and display functionality after fixes

**Fix Pattern Template:**
```typescript
// Replace all instances of:
entity.broadstreet_id ?? entity.mongo_id ?? entity.name
// With:
getEntityId(entity)

// Add required import:
import { getEntityId } from '@/lib/utils/entity-helpers';
```
