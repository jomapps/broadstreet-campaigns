# Theme Sync Validation Workflow

## Overview

Themes are independent entities that reference synced Broadstreet zones by their `broadstreet_id`. During sync operations, zones may be deleted and recreated, which can leave themes with invalid zone references. This document describes the validation workflow that runs after sync completion to clean up invalid zone references.

## Core Principles

1. **Themes are independent** - Sync operations do NOT protect zones during sync
2. **Post-sync validation** - After sync completes, validate all theme zone references
3. **Selective cleanup** - Remove ONLY invalid zone IDs from themes
4. **Preserve themes** - Keep themes intact, just clean up invalid references
5. **No theme deletion** - Themes are never deleted, even if they become empty

## Workflow Sequence

### 1. Sync Operations (Normal Flow)
```
Dashboard "Sync Data" → syncAll() → Complete zone wipe and recreation
Local-Only "Sync All" → syncAll() → Complete zone wipe and recreation
```

**Important**: Sync operations completely delete and recreate all zones. Themes are NOT protected during this process.

### 2. Post-Sync Theme Validation
After any sync operation completes successfully, the theme validation workflow automatically starts:

```typescript
// Triggered after sync completion
themeValidationService.startValidation()
```

### 3. Validation Process

#### Step 1: Collect Theme Data
- Find all themes with zone references: `Theme.find({ zone_ids: { $exists: true, $not: { $size: 0 } } })`
- Extract all unique zone IDs from all themes

#### Step 2: Validate Zone References
- Query synced zones: `Zone.find({ broadstreet_id: { $in: allZoneIds }, synced_with_api: true })`
- Create set of valid zone IDs that exist in the database

#### Step 3: Clean Up Invalid References
For each theme:
- Filter `zone_ids` to keep only valid zone IDs
- Remove invalid zone IDs from the theme
- Update theme in database: `Theme.findByIdAndUpdate(themeId, { zone_ids: validZoneIds })`

#### Step 4: Logging and Reporting
- Log validation results for each theme
- Report total zones removed and themes updated
- Never delete themes, even if they become empty

## Implementation Details

### Theme Validation Service
**File**: `src/lib/theme-validation-service.ts`

Key methods:
- `startValidation()` - Main validation workflow
- `validateTheme(themeId)` - Validate specific theme
- `getStatus()` - Get current validation status

### Integration Points

#### 1. Dashboard Sync (`/api/sync/all`)
```typescript
const result = await syncAll();
if (result.success) {
  // Start theme validation asynchronously
  themeValidationService.startValidation().catch(error => {
    console.error('[sync/all] Theme validation failed:', error);
  });
}
```

#### 2. Local-Only Sync (`/api/sync/local-all`)
```typescript
const dashboardSyncResult = await syncAll();
if (dashboardSyncResult.success) {
  // Theme validation is triggered by the syncAll() completion
}
```

### Database Operations

#### Zone Sync (Complete Wipe)
```typescript
// During syncAll() - themes are NOT protected
Zone.deleteMany({}) // Deletes ALL zones including theme-referenced ones
// ... zones are recreated from Broadstreet API
```

#### Theme Validation (Post-Sync)
```typescript
// After sync completion
const validZones = await Zone.find({ synced_with_api: true });
const validZoneIds = new Set(validZones.map(z => z.broadstreet_id));

// Update each theme
await Theme.findByIdAndUpdate(themeId, {
  zone_ids: originalZoneIds.filter(zoneId => validZoneIds.has(zoneId))
});
```

## Error Handling

### Validation Failures
- Individual theme validation errors are logged but don't stop the process
- Failed themes are reported in the validation result
- Validation continues for remaining themes

### Sync Failures
- If sync fails, theme validation is not triggered
- Themes remain unchanged with their existing zone references
- Manual validation can be triggered if needed

## Monitoring and Debugging

### Logging
All validation activities are logged with `[ThemeValidation]` prefix:
```
[ThemeValidation] Starting theme validation workflow...
[ThemeValidation] Found 3 themes to validate
[ThemeValidation] Checking 15 unique zone IDs
[ThemeValidation] Found 12 valid zones in database
[ThemeValidation] Theme "Header Ads": removing 2 invalid zones [123, 456]
[ThemeValidation] Theme "Sidebar Ads": all 5 zones are valid
[ThemeValidation] Validation completed: 3/3 themes validated, 3 invalid zones removed
```

### Validation Results
The validation service returns detailed results:
```typescript
{
  success: boolean;
  totalThemes: number;
  validatedThemes: number;
  invalidZonesRemoved: number;
  emptyThemesCount: number;
  errors: string[];
  duration: number;
}
```

## Business Rules

1. **No Zone Protection**: Sync operations delete ALL zones, themes do not protect zones
2. **Post-Sync Only**: Validation only runs after successful sync completion
3. **Selective Removal**: Only invalid zone IDs are removed from themes
4. **Theme Preservation**: Themes are never deleted, even if all zones are invalid
5. **Automatic Trigger**: Validation is automatically triggered after sync operations
6. **Non-Blocking**: Validation runs asynchronously and doesn't block sync completion

## API Endpoints

### Manual Validation Trigger
```
POST /api/themes/validate
```
Manually trigger theme validation (useful for debugging or recovery)

**Response**:
```json
{
  "success": true,
  "message": "Theme validation completed: 3/3 themes validated, 2 invalid zones removed",
  "result": {
    "success": true,
    "totalThemes": 3,
    "validatedThemes": 3,
    "invalidZonesRemoved": 2,
    "emptyThemesCount": 0,
    "errors": [],
    "duration": 1250
  }
}
```

### Validation Status
```
GET /api/themes/validate
```
Get current validation status and results

**Response**:
```json
{
  "success": true,
  "status": {
    "status": "completed",
    "progress": 100,
    "result": { /* validation result */ },
    "startedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Testing Scenarios

### Scenario 1: Normal Operation
1. Create themes with valid zones
2. Run sync operation
3. All zones recreated successfully
4. Theme validation finds all zones valid
5. No changes to themes

### Scenario 2: Zone Removal
1. Create themes with zones A, B, C
2. Zone B is removed from Broadstreet
3. Run sync operation
4. Only zones A and C are recreated
5. Theme validation removes zone B from all themes
6. Themes now contain only zones A and C

### Scenario 3: Complete Zone Loss
1. Create theme with zones that no longer exist in Broadstreet
2. Run sync operation
3. None of the theme's zones are recreated
4. Theme validation removes all zone IDs
5. Theme becomes empty but is preserved

## Migration Notes

This workflow ensures that themes remain functional after sync operations by automatically cleaning up stale zone references. The validation process is designed to be resilient and non-destructive, preserving theme structure while maintaining data integrity.
