# API Reference

**Application**: Broadstreet Campaigns  
**API Version**: Internal v1  
**Base URL**: `/api`  

## 📋 Overview

This document covers the internal API endpoints for the Broadstreet Campaigns application. These endpoints handle local entity management, synchronization with Broadstreet API, and utility operations.

## 🔧 Authentication

Internal API endpoints do not require authentication as they operate within the Next.js application context. External Broadstreet API authentication is handled server-side via environment variables.

## 📊 Entity Management Endpoints

### **Create Endpoints**

#### `POST /api/create/advertiser`
Create a new advertiser in the local database.

**Request Body:**
```typescript
{
  name: string;              // Required: Advertiser name
  network_id: string;        // Required: MongoDB ObjectId of network
  web_home_url?: string;     // Optional: Website URL
  notes?: string;            // Optional: Notes
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    _id: string;
    name: string;
    network_id: string;
    created_locally: true;
    synced_with_api: false;
    created_at: Date;
  };
  error?: string;
}
```

**Example:**
```bash
curl -X POST /api/create/advertiser \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Advertiser",
    "network_id": "507f1f77bcf86cd799439011",
    "web_home_url": "https://example.com"
  }'
```

#### `POST /api/create/campaign`
Create a new campaign in the local database.

**Request Body:**
```typescript
{
  name: string;              // Required: Campaign name
  advertiser_id: string;     // Required: MongoDB ObjectId of advertiser
  start_date: string;        // Required: ISO date string
  end_date?: string;         // Optional: ISO date string
  weight?: number;           // Optional: Campaign weight (0, 0.5, 1, 1.5, 127)
  max_impression_count?: number;
  display_type?: string;     // Optional: no_repeat, allow_repeat_campaign, etc.
  pacing_type?: string;      // Optional: asap, even
  notes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    _id: string;
    name: string;
    advertiser_id: string;
    start_date: Date;
    created_locally: true;
    synced_with_api: false;
    created_at: Date;
  };
  error?: string;
}
```

#### `POST /api/create/zone`
Create a new zone in the local database.

**Request Body:**
```typescript
{
  name: string;              // Required: Zone name
  network_id: string;        // Required: MongoDB ObjectId of network
  alias?: string;            // Optional: Zone alias
  advertisement_count?: number;
  allow_duplicate_ads?: boolean;
  width?: number;
  height?: number;
  self_serve?: boolean;
  archived?: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    _id: string;
    name: string;
    network_id: string;
    created_locally: true;
    synced_with_api: false;
    created_at: Date;
  };
  error?: string;
}
```

#### `POST /api/create/advertisement`
Create a new advertisement in the local database.

**Request Body:**
```typescript
{
  name: string;              // Required: Advertisement name
  type: string;              // Required: image, text, video, native
  preview_url?: string;      // Optional: Preview URL
  destination_url?: string;  // Optional: Click destination
  notes?: string;
}
```

#### `POST /api/create/network`
Create a new network in the local database.

**Request Body:**
```typescript
{
  name: string;              // Required: Network name
  web_home_url?: string;     // Optional: Website URL
  logo?: string;            // Optional: Logo URL
}
```

### **Local Entity Endpoints**

#### `GET /api/local-entities`
Get all local entities across all types.

**Response:**
```typescript
{
  zones: LocalZone[];
  advertisers: LocalAdvertiser[];
  campaigns: LocalCampaign[];
  advertisements: LocalAdvertisement[];
  networks: LocalNetwork[];
}
```

#### `DELETE /api/delete/local-advertiser`
Delete a local advertiser.

**Request Body:**
```typescript
{
  id: string;  // MongoDB ObjectId
}
```

#### `DELETE /api/delete/local-campaign`
Delete a local campaign.

#### `DELETE /api/delete/local-zone`
Delete a local zone.

#### `DELETE /api/delete/local-advertisement`
Delete a local advertisement.

#### `DELETE /api/delete/local-network`
Delete a local network.

#### `DELETE /api/delete/local-all`
Delete all local entities across all types.

**Response:**
```typescript
{
  success: boolean;
  deleted: {
    zones: number;
    advertisers: number;
    campaigns: number;
    advertisements: number;
    networks: number;
  };
}
```

## 🔄 Sync Endpoints

### **Individual Sync Endpoints**

#### `POST /api/sync/networks`
Sync networks from Broadstreet API.

**Response:**
```typescript
{
  success: boolean;
  synced: number;
  total: number;
  errors: string[];
}
```

#### `POST /api/sync/advertisers`
Sync advertisers from Broadstreet API for specified network.

**Request Body:**
```typescript
{
  network_id: number;  // Broadstreet network ID
}
```

#### `POST /api/sync/zones`
Sync zones from Broadstreet API for specified network.

#### `POST /api/sync/campaigns`
Sync campaigns from Broadstreet API for specified advertiser.

**Request Body:**
```typescript
{
  advertiser_id: number;  // Broadstreet advertiser ID
}
```

#### `POST /api/sync/advertisements`
Sync advertisements from Broadstreet API for specified network.

#### `POST /api/sync/placements`
Sync placements from Broadstreet API for specified campaign.

**Request Body:**
```typescript
{
  campaign_id: number;  // Broadstreet campaign ID
}
```

### **Batch Sync Endpoints**

#### `POST /api/sync/all`
Sync all entities from Broadstreet API in dependency order.

**Response:**
```typescript
{
  success: boolean;
  results: {
    networks: { synced: number; total: number; errors: string[] };
    advertisers: { synced: number; total: number; errors: string[] };
    zones: { synced: number; total: number; errors: string[] };
    campaigns: { synced: number; total: number; errors: string[] };
    advertisements: { synced: number; total: number; errors: string[] };
    placements: { synced: number; total: number; errors: string[] };
  };
}
```

#### `POST /api/sync/local-all`
Sync all local entities to Broadstreet API with dependency resolution.

**Response:**
```typescript
{
  success: boolean;
  results: {
    networks: { synced: number; total: number; errors: string[] };
    advertisers: { synced: number; total: number; errors: string[] };
    zones: { synced: number; total: number; errors: string[] };
    campaigns: { synced: number; total: number; errors: string[] };
    advertisements: { synced: number; total: number; errors: string[] };
  };
  idMaps: {
    networks: Map<string, number>;
    advertisers: Map<string, number>;
    zones: Map<string, number>;
  };
}
```

## 🎯 Placement Creation Endpoints

#### `POST /api/placements`
Create placements for campaigns using the fallback ad utility.

**Request Body:**
```typescript
{
  campaign_id: number;         // Broadstreet campaign ID
  advertisement_ids: number[]; // Array of Broadstreet advertisement IDs
  size_types: string[];        // Array of size types: ["SQ", "PT", "LS"]
  network_id: number;          // Broadstreet network ID for zone filtering
}
```

**Response:**
```typescript
{
  success: boolean;
  placements_created: number;
  details: {
    size_type: string;
    zones_matched: number;
    placements_created: number;
  }[];
  errors: string[];
}
```

## 🔍 Utility Endpoints

#### `GET /api/networks`
Get all networks from local database.

**Response:**
```typescript
{
  networks: Network[];
}
```

#### `GET /api/advertisers`
Get advertisers with optional network filtering.

**Query Parameters:**
- `network_id?: string` - Filter by network

#### `GET /api/campaigns`
Get campaigns with optional filtering.

**Query Parameters:**
- `advertiser_id?: string` - Filter by advertiser
- `network_id?: string` - Filter by network

#### `GET /api/zones`
Get zones with optional filtering and size detection.

**Query Parameters:**
- `network_id?: string` - Filter by network
- `size_type?: string` - Filter by detected size (SQ, PT, LS)

#### `GET /api/advertisements`
Get advertisements with optional filtering.

**Query Parameters:**
- `network_id?: string` - Filter by network
- `type?: string` - Filter by advertisement type

## 🧪 Test Utilities

#### `POST /api/test-utils/create-test-data`
Create test data for development and testing.

**Request Body:**
```typescript
{
  networks: number;      // Number of test networks to create
  advertisers: number;   // Number of test advertisers per network
  zones: number;         // Number of test zones per network
  campaigns: number;     // Number of test campaigns per advertiser
}
```

#### `DELETE /api/test-utils/cleanup`
Clean up test data and reset database.

## 📊 Response Patterns

### **Success Response**
```typescript
{
  success: true;
  data: any;          // Response data
  message?: string;   // Optional success message
}
```

### **Error Response**
```typescript
{
  success: false;
  error: string;      // Error message
  details?: any;      // Optional error details
  code?: string;      // Optional error code
}
```

### **Validation Error Response**
```typescript
{
  success: false;
  error: "Validation failed";
  details: {
    field: string;
    message: string;
  }[];
}
```

## 🚨 Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `VALIDATION_ERROR` | Request validation failed | Check request body format |
| `NOT_FOUND` | Entity not found | Verify entity ID |
| `DUPLICATE_NAME` | Entity name already exists | Use unique name |
| `API_ERROR` | Broadstreet API error | Check API credentials |
| `DEPENDENCY_ERROR` | Missing required dependency | Ensure parent entities exist |
| `SYNC_ERROR` | Synchronization failed | Retry or check logs |

## 🔧 Rate Limiting

The Broadstreet API has rate limiting:
- **Reporting endpoints**: 2 requests per 5 seconds
- **Other endpoints**: Standard rate limits apply

Internal endpoints are not rate limited but should be used efficiently.

## 📝 Examples

### **Complete Entity Creation Flow**
```javascript
// 1. Create local advertiser
const advertiser = await fetch('/api/create/advertiser', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Advertiser',
    network_id: '507f1f77bcf86cd799439011',
    web_home_url: 'https://example.com'
  })
});

// 2. Create local campaign
const campaign = await fetch('/api/create/campaign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Campaign',
    advertiser_id: advertiser.data._id,
    start_date: '2024-01-01T00:00:00Z',
    weight: 1
  })
});

// 3. Sync to Broadstreet API
const syncResult = await fetch('/api/sync/local-all', {
  method: 'POST'
});
```

### **Zone Creation with Size Detection**
```javascript
const zone = await fetch('/api/create/zone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Homepage SQ Zone',
    network_id: '507f1f77bcf86cd799439011',
    width: 300,
    height: 250,
    advertisement_count: 1
  })
});
```

---

**Note**: All endpoints handle errors gracefully and return consistent response formats. Always check the `success` field before processing response data.
