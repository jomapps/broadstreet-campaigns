# Entity ID Management - Single Source of Truth

## Overview

The Broadstreet Campaigns application uses a **dual-database architecture** with a **standardized three-tier ID system**. This document serves as the **single source of truth** for all ID-related patterns, utilities, and best practices.

## Core ID Types - The Three-Tier System

### **1. Broadstreet ID** (`broadstreet_id`)
- **Type**: `number`
- **Source**: Assigned by the Broadstreet API
- **Usage**: Primary identifier for all synced entities
- **Scope**: All entities that exist in the Broadstreet system
- **Example**: `12345`
- **Rule**: NEVER use generic `id` - always use explicit `broadstreet_id`

### **2. MongoDB ID** (`mongo_id`)
- **Type**: `string` (MongoDB ObjectId as string)
- **Source**: Assigned by MongoDB when document is created
- **Usage**: Primary identifier for local storage and local-only entities
- **Scope**: ALL entities (both synced and local-only)
- **Example**: `"507f1f77bcf86cd799439011"`
- **Rule**: ALWAYS use `mongo_id` - NEVER use `mongodb_id` or other variants

### **3. MongoDB ObjectId** (`_id`)
- **Type**: `ObjectId` (MongoDB native type)
- **Source**: MongoDB's native document identifier
- **Usage**: Internal MongoDB operations, direct database queries
- **Scope**: ALL MongoDB documents
- **Example**: `ObjectId("507f1f77bcf86cd799439011")`
- **Rule**: Use only for direct MongoDB operations, convert to `mongo_id` for application logic

## ID Naming Rules - STRICT ENFORCEMENT

### **NEVER Use These Patterns**
```typescript
// ❌ FORBIDDEN - Generic naming
entity.id                    // Too ambiguous
entity.mongodb_id            // Wrong spelling
entity.mongoId               // Wrong case
entity.objectId              // Wrong concept

// ❌ FORBIDDEN - Legacy API patterns
entity.broadstreet_advertiser_id  // Redundant when context is clear
entity.local_advertiser_id        // Use mongo_id instead
```

### **ALWAYS Use These Patterns**
```typescript
// ✅ REQUIRED - Standard fields
entity.broadstreet_id        // For Broadstreet API IDs
entity.mongo_id              // For MongoDB ObjectId strings
entity._id                   // For native MongoDB operations only

// ✅ ACCEPTABLE - When context requires clarity
campaign.campaign_id         // In placement relationships
zone.zone_id                 // In placement relationships
```

## Entity States and ID Patterns

### 1. **Synced Entities** (Exist in both systems)
```typescript
{
  broadstreet_id: 12345,                    // Primary API identifier
  mongo_id: "507f1f77bcf86cd799439011",     // Local storage identifier
  _id: ObjectId("507f1f77bcf86cd799439011"), // MongoDB native (internal)
  synced_with_api: true,
  // ... other fields
}
```

### 2. **Local-Only Entities** (Not yet synced to Broadstreet)
```typescript
{
  broadstreet_id: undefined,                // No API identifier yet
  mongo_id: "507f1f77bcf86cd799439011",     // Only local identifier
  _id: ObjectId("507f1f77bcf86cd799439011"), // MongoDB native (internal)
  created_locally: true,
  synced_with_api: false,
  // ... other fields
}
```

### 3. **API-First Entities** (Downloaded from Broadstreet)
```typescript
{
  broadstreet_id: 12345,                    // Primary API identifier
  mongo_id: "507f1f77bcf86cd799439011",     // Generated during sync
  _id: ObjectId("507f1f77bcf86cd799439011"), // MongoDB native (internal)
  created_locally: false,
  synced_with_api: true,
  // ... other fields
}
```

## Entity-Specific ID Patterns

### Networks
- **Always synced** - Networks cannot be created locally
- **IDs**: Always have both `broadstreet_id` and `mongo_id`
- **Pattern**: `broadstreet_network_id` (alias for `broadstreet_id`)

### Advertisers
- **Can be local or synced**
- **Business Rule**: Advertisements cannot exist without synced advertisers
- **IDs**:
  - Synced: `broadstreet_advertiser_id` + `local_advertiser_id`
  - Local: Only `local_advertiser_id`

### Campaigns
- **Can be local or synced**
- **IDs**:
  - Synced: `broadstreet_campaign_id` + `local_campaign_id`
  - Local: Only `local_campaign_id`

### Zones
- **Can be local or synced**
- **IDs**:
  - Synced: `broadstreet_zone_id` + `local_zone_id`
  - Local: Only `local_zone_id`

### Advertisements
- **Always synced** - Cannot be created locally
- **IDs**: Always have both `broadstreet_advertisement_id` and `local_advertisement_id`

### Placements
- **Complex relationship management**
- **Required IDs**: `network_id`, `advertiser_id`, `advertisement_id` (always Broadstreet IDs)
- **Flexible IDs**: Campaign and Zone references can be either type
- **Patterns**:
  ```typescript
  // Synced campaign + Synced zone
  {
    campaign_id: 123,           // Broadstreet ID
    zone_id: 456,              // Broadstreet ID
    campaign_mongo_id: undefined,
    zone_mongo_id: undefined
  }

  // Local campaign + Synced zone
  {
    campaign_id: undefined,
    zone_id: 456,              // Broadstreet ID
    campaign_mongo_id: "507f...", // MongoDB ID
    zone_mongo_id: undefined
  }

  // Synced campaign + Local zone
  {
    campaign_id: 123,           // Broadstreet ID
    zone_id: undefined,
    campaign_mongo_id: undefined,
    zone_mongo_id: "507f..."   // MongoDB ID
  }

  // Local campaign + Local zone
  {
    campaign_id: undefined,
    zone_id: undefined,
    campaign_mongo_id: "507f...", // MongoDB ID
    zone_mongo_id: "507f..."      // MongoDB ID
  }
  ```

## ID Utilities and Helpers

### Core Utility Functions (`src/lib/utils/entity-helpers.ts`)

#### `getEntityId(entity)`
**Purpose**: Extract the primary ID from any entity, preferring Broadstreet ID over MongoDB ID
```typescript
// Returns: number | string | undefined
const id = getEntityId(entity);
// Priority: broadstreet_id > mongo_id > broadstreet_*_id > local_*_id
```

#### `isEntitySynced(entity)`
**Purpose**: Determine if an entity is synced with Broadstreet API
```typescript
// Returns: boolean
const synced = isEntitySynced(entity);
// True if entity has any broadstreet_id variant
```

#### `getEntityType(entity)`
**Purpose**: Classify entity sync status
```typescript
// Returns: 'synced' | 'local' | 'both' | 'none'
const type = getEntityType(entity);
```

### API Mapping Utilities (`src/lib/types/mapApiIds.ts`)

#### `mapApiIds(obj, options?)`
**Purpose**: Convert legacy API payloads that use `id` to `broadstreet_id`
```typescript
const mapped = mapApiIds(apiResponse, { stripId: true });
// Converts: { id: 123, name: "Test" }
// To: { broadstreet_id: 123, name: "Test" }
```

### Display Components (`src/components/ui/entity-id-badge.tsx`)

#### `EntityIdBadge`
**Purpose**: Consistent ID display across the application
```typescript
<EntityIdBadge
  broadstreet_id={entity.broadstreet_id}
  mongo_id={entity.mongo_id}
  // Or use explicit naming:
  broadstreet_advertiser_id={advertiser.broadstreet_id}
  local_advertiser_id={advertiser.mongo_id}
/>
```

## Database Schema Patterns

### Virtual Fields
All models include virtual getters for consistent ID access:
```typescript
// Standard virtuals (all models)
virtual('mongo_id').get(() => this._id?.toString())

// Entity-specific virtuals
virtual('local_advertiser_id').get(() => this._id?.toString())
virtual('broadstreet_advertiser_id').get(() => this.broadstreet_id)
```

### Indexes and Constraints
- **Unique indexes**: `broadstreet_id` fields have unique constraints
- **Compound indexes**: Placements use complex compound indexes for uniqueness
- **Partial indexes**: Used for optional fields in placement relationships

## Relationship Management Patterns

### Storing Entity References

#### **Rule 1: Prefer Broadstreet IDs for relationships**
```typescript
// ✅ CORRECT - Use Broadstreet ID when available
{
  advertiser_id: 12345,  // Broadstreet ID
  network_id: 67890      // Broadstreet ID
}
```

#### **Rule 2: Use MongoDB IDs only for local-only entities**
```typescript
// ✅ CORRECT - Local campaign reference
{
  campaign_id: undefined,
  campaign_mongo_id: "507f1f77bcf86cd799439011"
}
```

#### **Rule 3: Never mix ID types in the same reference**
```typescript
// ❌ WRONG - Don't use both simultaneously
{
  campaign_id: 123,
  campaign_mongo_id: "507f..."  // This violates XOR constraint
}
```

### Query Patterns

#### Finding by Either ID Type
```typescript
// Using utility function
const entity = await Model.findOne({
  $or: [
    { broadstreet_id: getEntityId(searchEntity) },
    { _id: getEntityId(searchEntity) }
  ]
});

// Direct query patterns
const byBroadstreetId = await Model.findOne({ broadstreet_id: 123 });
const byMongoId = await Model.findById("507f1f77bcf86cd799439011");
```

#### Relationship Queries
```typescript
// Placement queries with flexible ID types
const placements = await Placement.find({
  $or: [
    { campaign_id: campaignBroadstreetId },
    { campaign_mongo_id: campaignMongoId }
  ]
});
```

## Common ID Management Problems and Solutions

### Problem 1: Inconsistent ID Field Names
**Issue**: Different parts of the codebase use different field names for the same ID
```typescript
// ❌ INCONSISTENT - Multiple names for same concept
entity.id              // Legacy API field
entity.broadstreet_id   // Standard field
entity.broadstreet_advertiser_id  // Explicit naming
```

**Solution**: Use the standardized explicit naming pattern
```typescript
// ✅ CONSISTENT - Use explicit entity-specific names
entity.broadstreet_advertiser_id  // For advertisers
entity.local_advertiser_id        // For local advertiser references
entity.broadstreet_campaign_id    // For campaigns
entity.local_campaign_id          // For local campaign references
```

### Problem 2: Mixed ID Types in Relationships
**Issue**: Using both Broadstreet and MongoDB IDs simultaneously
```typescript
// ❌ WRONG - Violates XOR constraint
{
  campaign_id: 123,
  campaign_mongo_id: "507f..."
}
```

**Solution**: Use exactly one ID type per relationship
```typescript
// ✅ CORRECT - XOR pattern
{
  campaign_id: 123,           // Use this OR
  campaign_mongo_id: undefined
}
// OR
{
  campaign_id: undefined,
  campaign_mongo_id: "507f..."  // Use this
}
```

### Problem 3: Incorrect Entity State Detection
**Issue**: Assuming entities are local based on incomplete checks
```typescript
// ❌ WRONG - Incomplete check
const isLocal = !entity.broadstreet_id;
```

**Solution**: Use the standardized utility functions
```typescript
// ✅ CORRECT - Comprehensive check
const isLocal = !isEntitySynced(entity);
const entityType = getEntityType(entity);
```

### Problem 4: Display Inconsistencies
**Issue**: Different ID display patterns across components
```typescript
// ❌ INCONSISTENT - Manual ID display
<span>ID: {entity.broadstreet_id || entity.mongo_id}</span>
```

**Solution**: Use the standardized EntityIdBadge component
```typescript
// ✅ CONSISTENT - Standardized display
<EntityIdBadge
  broadstreet_advertiser_id={entity.broadstreet_id}
  local_advertiser_id={entity.mongo_id}
/>
```

## Best Practices

### 1. **Always Use Utility Functions**
- Use `getEntityId()` for primary ID extraction
- Use `isEntitySynced()` for sync status checks
- Use `getEntityType()` for comprehensive entity classification

### 2. **Follow Explicit Naming Conventions**
- Use `broadstreet_{entity}_id` for Broadstreet IDs
- Use `local_{entity}_id` for MongoDB IDs
- Avoid generic `id` or `broadstreet_id` when entity type is clear

### 3. **Implement Proper Validation**
- Use XOR constraints for placement relationships
- Validate ObjectId format for MongoDB IDs
- Check entity existence before creating relationships

### 4. **Consistent Display Patterns**
- Always use `EntityIdBadge` for ID display
- Show local badges for local-only entities
- Use yellowish styling for local entity cards

### 5. **Database Query Optimization**
- Use appropriate indexes for both ID types
- Implement compound indexes for complex relationships
- Use partial indexes for optional fields

## Migration and Cleanup Patterns

### Removing Duplicate ID Implementations

#### 1. **Consolidate Virtual Fields**
Replace multiple virtual field implementations with standardized patterns:
```typescript
// ✅ STANDARD - Use this pattern in all models
Schema.virtual('mongo_id').get(function() {
  return this._id?.toString();
});

Schema.virtual('local_{entity}_id').get(function() {
  return this._id?.toString();
});

Schema.virtual('broadstreet_{entity}_id').get(function() {
  return this.broadstreet_id;
});
```

#### 2. **Standardize API Mapping**
Use `mapApiIds` utility consistently:
```typescript
// ✅ STANDARD - Use in all API integration points
const mapped = mapApiIds(apiResponse, { stripId: true });
```

#### 3. **Update Component Props**
Migrate to explicit naming in component interfaces:
```typescript
// ✅ STANDARD - Explicit prop naming
interface Props {
  broadstreet_advertiser_id?: number;
  local_advertiser_id?: string;
  // Instead of generic broadstreet_id, mongo_id
}
```

## Testing Patterns

### ID-Related Test Cases
```typescript
describe('ID Management', () => {
  test('getEntityId prefers Broadstreet ID', () => {
    const entity = { broadstreet_id: 123, mongo_id: "507f..." };
    expect(getEntityId(entity)).toBe(123);
  });

  test('getEntityId falls back to MongoDB ID', () => {
    const entity = { mongo_id: "507f..." };
    expect(getEntityId(entity)).toBe("507f...");
  });

  test('isEntitySynced detects synced entities', () => {
    const synced = { broadstreet_id: 123 };
    const local = { mongo_id: "507f..." };
    expect(isEntitySynced(synced)).toBe(true);
    expect(isEntitySynced(local)).toBe(false);
  });

  test('Placement XOR constraints work', async () => {
    // Should fail with both IDs
    const invalid = new Placement({
      campaign_id: 123,
      campaign_mongo_id: "507f...",
      // ... other required fields
    });
    await expect(invalid.validate()).rejects.toThrow();
  });
});
```

## Troubleshooting Guide

### Common Error Messages and Solutions

#### "Exactly one of campaign_id or campaign_mongo_id must be provided"
**Cause**: Placement validation failed due to XOR constraint violation
**Solution**: Ensure exactly one campaign reference is provided

#### "Invalid campaign_mongo_id. Must be a valid Mongo ObjectId"
**Cause**: Invalid ObjectId format in API request
**Solution**: Validate ObjectId format before API calls

#### "Duplicate key error on broadstreet_id"
**Cause**: Attempting to create entity with existing Broadstreet ID
**Solution**: Use upsert operations or check existence first

### Debug Utilities
```typescript
// Debug entity ID state
console.log('Entity ID Analysis:', {
  id: getEntityId(entity),
  type: getEntityType(entity),
  synced: isEntitySynced(entity),
  broadstreet_id: entity.broadstreet_id,
  mongo_id: entity.mongo_id
});
```

---

## Summary

This document establishes the **single source of truth** for ID management in the Broadstreet Campaigns application. Key takeaways:

1. **Two ID types**: Broadstreet IDs (numbers) and MongoDB IDs (strings)
2. **Three entity states**: Synced, Local-only, API-first
3. **Explicit naming**: Use entity-specific ID field names
4. **Utility functions**: Always use provided helpers for ID operations
5. **XOR constraints**: Placements use exactly one ID type per relationship
6. **Consistent display**: Use EntityIdBadge component for all ID displays
7. **Proper validation**: Implement appropriate constraints and checks

Following these patterns ensures consistent, maintainable ID management across the entire application.

## Single source of truth
Ensure theat we have common utilities so that there is a single source of truth for working with IDs.

## Getting ids from sidebar filter
Sidebar filters can provide either a broadstreet_id or a mongo_id. 
have a clear way, used by everyone to use it.
The app cannot work without network id and it is always in the sidebar filter.
