# Sync Operations

## Overview

The sync system manages data synchronization between the local MongoDB database and the Broadstreet API with proper validation and entity lifecycle management.

## Key Features

### Proper Sync Validation
- Only marks entities as synced after successful API response
- Validates API response contains valid ID
- Prevents premature removal from Local Only page

### Entity Lifecycle Management
- Moves successfully synced entities from local to main collections
- Removes entities from local collections after successful sync
- Manages synced entities through normal sync operations

### Real API Integration
- All sync operations use real Broadstreet API calls
- No mock or fallback data
- Proper error handling for API failures

## Sync Process

1. **Local Creation**: Entities created locally stored in separate collections
2. **API Validation**: Real API calls with response validation
3. **Entity Movement**: Successful entities moved to main collections
4. **Error Handling**: Failed syncs preserve local entities

## Local Only Dashboard

Centralized management of unsynced local entities with:
- Entity counts and sync status
- Batch sync functionality
- Individual entity management
- Visual distinction for local vs synced entities

## Testing Infrastructure

- `delete-zone-by-name.js` script for easy cleanup
- npm script `delete:zone-by-name` for convenient access
- Comprehensive testing of sync workflow

---

*For detailed implementation, see the main documentation*