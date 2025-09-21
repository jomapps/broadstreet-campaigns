# Themes Entity Reference

## Overview

Themes are collections of synced Broadstreet zones used for bulk operations and filtering. They are local-only entities that reference synced zones by their `broadstreet_id`.

## Database Schema

**Collection**: `themes`
**Model**: `src/lib/models/theme.ts`

```typescript
interface ITheme extends Document {
  mongo_id: string;           // Virtual field
  name: string;               // Required, max 100 chars
  description?: string;       // Optional, max 500 chars
  zone_ids: number[];         // Array of Broadstreet zone IDs (synced zones only)
  zone_count: number;         // Virtual field for display
  createdAt: Date;           // Mongoose timestamp
  updatedAt: Date;           // Mongoose timestamp
}
```

## Key Characteristics

### 1. Independent Entity
- Themes are **independent** of sync operations
- Sync operations do NOT protect zones referenced by themes
- Themes are never deleted during sync operations

### 2. Zone References
- Themes only reference **synced Broadstreet zones** by `broadstreet_id`
- Never reference local zones or MongoDB ObjectIds
- Zone references are validated after sync operations

### 3. Post-Sync Validation
- After sync completion, themes are automatically validated
- Invalid zone references are removed from themes
- Themes are preserved even if they become empty

## Workflow Integration

### Theme Creation
1. User creates theme on themes page
2. User adds synced zones to theme
3. Theme stores array of `broadstreet_id` values
4. Theme is immediately available for filtering

### Sync Operations
1. **Dashboard "Sync Data"** or **Local-Only "Sync All"** triggered
2. `syncAll()` completely wipes and recreates all zones
3. Themes are **NOT protected** during this process
4. After sync completion, theme validation automatically starts

### Post-Sync Validation
1. Theme validation service starts automatically
2. Checks all zone references in all themes
3. Removes invalid zone IDs from themes
4. Preserves themes even if they become empty
5. Logs validation results

## API Endpoints

### Theme Management
- `GET /api/themes` - List all themes
- `POST /api/themes` - Create new theme
- `GET /api/themes/[id]` - Get theme with zones
- `PUT /api/themes/[id]` - Update theme
- `DELETE /api/themes/[id]` - Delete theme

### Zone Management
- `POST /api/themes/[id]/zones` - Add zones to theme
- `DELETE /api/themes/[id]/zones` - Remove zones from theme

### Validation
- `POST /api/themes/validate` - Manual validation trigger
- `GET /api/themes/validate` - Get validation status

## Business Rules

### Zone Eligibility
- Only synced zones can be added to themes
- Zones must have `broadstreet_id` and `synced_with_api: true`
- Local zones cannot be added to themes

### Validation Rules
- Validation runs automatically after sync operations
- Invalid zone references are removed silently
- Themes are never deleted, even if empty
- Validation is non-blocking and runs asynchronously

### Filtering Integration
- Theme selection in sidebar filters automatically selects all theme zones
- Theme selection replaces currently selected zones
- Network selection does not reset when using theme filters

## File Locations

### Core Files
- **Model**: `src/lib/models/theme.ts`
- **Validation Service**: `src/lib/theme-validation-service.ts`
- **Theme Service**: `src/lib/theme-service.ts`

### API Routes
- **CRUD Operations**: `src/app/api/themes/[id]/route.ts`
- **Zone Management**: `src/app/api/themes/[id]/zones/route.ts`
- **Validation**: `src/app/api/themes/validate/route.ts`

### UI Components
- **Theme List**: `src/app/themes/ThemesContent.tsx`
- **Theme Detail**: `src/app/themes/[id]/ThemeDetailContent.tsx`
- **Theme Card**: `src/components/themes/ThemeCard.tsx`
- **Sidebar Filter**: Theme selection in sidebar filters

### Documentation
- **Sync Validation**: `docs/implementation/theme-sync-validation.md`
- **Entity Reference**: `docs/entity-reference/themes.md` (this file)

## Error Handling

### Validation Errors
- Individual theme validation errors are logged
- Failed themes are reported but don't stop validation
- Validation continues for remaining themes

### Zone Addition Errors
- Adding invalid zones returns 400 error
- Only synced zones with valid `broadstreet_id` accepted
- Duplicate zones are automatically deduplicated

### Sync Integration Errors
- If sync fails, theme validation is not triggered
- Manual validation can be triggered via API
- Validation status can be checked via API

## Monitoring and Debugging

### Logging
All theme operations are logged with appropriate prefixes:
- `[ThemeValidation]` - Validation operations
- `[API]` - API endpoint operations
- `[sync/all]` - Sync integration

### Validation Results
Detailed validation results include:
- Total themes processed
- Invalid zones removed
- Empty themes count
- Processing duration
- Individual theme details

## Testing Scenarios

### Normal Operation
1. Create themes with valid zones
2. Run sync operation
3. All zones recreated successfully
4. Validation finds all zones valid
5. No changes to themes

### Zone Removal
1. Zones removed from Broadstreet
2. Sync operation recreates remaining zones
3. Validation removes invalid zone references
4. Themes updated with valid zones only

### Complete Zone Loss
1. All theme zones removed from Broadstreet
2. Sync operation doesn't recreate any theme zones
3. Validation removes all zone references
4. Themes become empty but are preserved

## Migration and Maintenance

### Data Integrity
- Themes maintain referential integrity through validation
- Invalid references are automatically cleaned up
- No manual intervention required for zone reference maintenance

### Performance Considerations
- Validation runs asynchronously to avoid blocking sync operations
- Bulk operations used for efficient database updates
- Validation results are cached for status queries

### Backup and Recovery
- Themes are preserved during all sync operations
- Manual validation can recover from validation failures
- Theme structure is maintained even with invalid zone references
