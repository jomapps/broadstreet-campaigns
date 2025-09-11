# API Reference

## 🎯 Overview

This document provides technical details about the API endpoints, data models, and integration points in the Broadstreet Campaigns application.

**CRITICAL ARCHITECTURE PRINCIPLE:**
This app works with a local database (MongoDB) for ALL data operations. The Broadstreet API is ONLY used during sync operations. All page queries, filtering, and data display come from the app database.

## 📊 Data Access Patterns

### ✅ Correct Data Access
- **Page Queries**: All `/api/networks`, `/api/advertisers`, `/api/campaigns`, `/api/zones`, `/api/advertisements`, `/api/placements` endpoints query the local database
- **Filtering**: All filtering operations use local database queries
- **Search**: All search operations use local database queries
- **Local Entity Management**: All local entity operations use the database

### ❌ Incorrect Data Access (DO NOT DO)
- **Direct Broadstreet API calls** for page data loading
- **Direct Broadstreet API calls** for filtering or searching
- **Direct Broadstreet API calls** for regular UI operations

### 🔄 Sync Operations Only
- **Sync endpoints** (`/api/sync/*`) are the ONLY places that call Broadstreet API
- **Fallback ad creation** creates local placements only (no direct API calls)
- **Local entity sync** pushes local changes to Broadstreet API

## 🌐 API Endpoints

### Base URL
All API endpoints are relative to the application base URL with `/api` prefix.

### Authentication
- **Method**: API Key authentication via query parameter
- **Parameter**: `access_token` in query string
- **Storage**: Environment variables

## 📊 Data Endpoints

### Networks

#### GET `/api/networks`
**Purpose**: Retrieve all networks

**Response**:
```json
{
  "networks": [
    {
      "id": 123,
      "name": "Example Network",
      "group_id": 456,
      "web_home_url": "https://example.com",
      "logo": {
        "url": "https://example.com/logo.png"
      },
      "valet_active": true,
      "path": "/networks/123",
      "advertiser_count": 25,
      "zone_count": 150
    }
  ]
}
```

**Error Responses**:
- `500`: Server error
- `503`: Service unavailable

### Advertisers

#### GET `/api/advertisers`
**Purpose**: Retrieve advertisers with optional network filtering

**Query Parameters**:
- `network_id` (optional): Filter by network ID

**Response**:
```json
{
  "advertisers": [
    {
      "id": 789,
      "name": "Example Advertiser",
      "logo": {
        "url": "https://example.com/advertiser-logo.png"
      },
      "web_home_url": "https://advertiser.com",
      "notes": "Important advertiser notes",
      "admins": [
        {
          "name": "John Doe",
          "email": "john@advertiser.com"
        }
      ]
    }
  ]
}
```

**Error Responses**:
- `400`: Invalid network_id parameter
- `500`: Server error

### Campaigns

#### GET `/api/campaigns`
**Purpose**: Retrieve campaigns with optional advertiser filtering

**Query Parameters**:
- `advertiser_id` (optional): Filter by advertiser ID

**Response**:
```json
{
  "campaigns": [
    {
      "id": 101112,
      "name": "Example Campaign",
      "advertiser_id": 789,
      "start_date": "2024-01-01",
      "end_date": "2024-12-31",
      "max_impression_count": 1000000,
      "display_type": "no_repeat",
      "active": true,
      "weight": 100,
      "path": "/campaigns/101112",
      "archived": false,
      "pacing_type": "even",
      "impression_max_type": "goal",
      "paused": false,
      "notes": "Campaign notes"
    }
  ]
}
```

**Error Responses**:
- `400`: Invalid advertiser_id parameter
- `500`: Server error

### Zones

#### GET `/api/zones`
**Purpose**: Retrieve zones with optional network filtering

**Query Parameters**:
- `network_id` (optional): Filter by network ID

**Response**:
```json
{
  "zones": [
    {
      "id": 131415,
      "name": "Home Banner",
      "network_id": 123,
      "alias": "home-banner-728x90",
      "self_serve": true,
      "size_type": "LS",
      "size_number": 728,
      "category": "banner",
      "block": "header",
      "is_home": true
    }
  ]
}
```

**Error Responses**:
- `400`: Invalid network_id parameter
- `500`: Server error

### Advertisements

#### GET `/api/advertisements`
**Purpose**: Retrieve advertisements with optional filtering

**Query Parameters**:
- `network_id` (required): Filter by network ID
- `advertiser_id` (optional): Filter by advertiser ID
- `zone_id` (optional): Filter by zone ID

**Response**:
```json
{
  "advertisements": [
    {
      "id": 161718,
      "name": "Example Ad",
      "updated_at": "2024-01-15T10:30:00Z",
      "type": "banner",
      "advertiser": "Example Advertiser",
      "active": {
        "url": "https://example.com/ad.html"
      },
      "active_placement": true,
      "preview_url": "https://example.com/preview.html"
    }
  ]
}
```

**Error Responses**:
- `400`: Invalid network_id, advertiser_id, or zone_id parameter
- `500`: Server error

## 🔄 Sync Endpoints

### Network Sync

#### POST `/api/sync/networks`
**Purpose**: Synchronize network data from Broadstreet API

**Response**:
```json
{
  "success": true,
  "message": "Networks synced successfully",
  "data": {
    "networks_updated": 12,
    "networks_created": 3,
    "networks_deleted": 1
  }
}
```

**Error Responses**:
- `500`: Sync failed
- `503`: Broadstreet API unavailable

### Local Entity Sync

#### POST `/api/sync/local-all`
**Purpose**: Sync all local entities to Broadstreet API with dependency resolution

**Request Body**:
```json
{
  "networkId": 123
}
```

**Response**:
```json
{
  "success": true,
  "report": {
    "advertisers": {
      "synced": 5,
      "failed": 0
    },
    "zones": {
      "synced": 8,
      "failed": 0
    },
    "campaigns": {
      "synced": 3,
      "failed": 0
    }
  }
}
```

#### GET `/api/sync/local-all`
**Purpose**: Perform dry run validation for local entity sync

**Query Parameters**:
- `networkId` (required): Network ID for validation

**Response**:
```json
{
  "success": true,
  "dryRun": {
    "valid": true,
    "conflicts": [],
    "resolvedNames": {}
  }
}
```

### Advertiser Sync

#### POST `/api/sync/advertisers`
**Purpose**: Synchronize advertiser data from Broadstreet API

**Response**:
```json
{
  "success": true,
  "message": "Advertisers synced successfully",
  "data": {
    "advertisers_updated": 45,
    "advertisers_created": 8,
    "advertisers_deleted": 2
  }
}
```

### Campaign Sync

#### POST `/api/sync/campaigns`
**Purpose**: Synchronize campaign data from Broadstreet API

**Response**:
```json
{
  "success": true,
  "message": "Campaigns synced successfully",
  "data": {
    "campaigns_updated": 120,
    "campaigns_created": 15,
    "campaigns_deleted": 5
  }
}
```

### Zone Sync

#### POST `/api/sync/zones`
**Purpose**: Synchronize zone data from Broadstreet API

**Response**:
```json
{
  "success": true,
  "message": "Zones synced successfully",
  "data": {
    "zones_updated": 200,
    "zones_created": 25,
    "zones_deleted": 3
  }
}
```

### All Data Sync

#### POST `/api/sync/all`
**Purpose**: Synchronize all data types from Broadstreet API

**Response**:
```json
{
  "success": true,
  "message": "All data synced successfully",
  "data": {
    "networks": {
      "updated": 12,
      "created": 3,
      "deleted": 1
    },
    "advertisers": {
      "updated": 45,
      "created": 8,
      "deleted": 2
    },
    "campaigns": {
      "updated": 120,
      "created": 15,
      "deleted": 5
    },
    "zones": {
      "updated": 200,
      "created": 25,
      "deleted": 3
    }
  }
}
```

## 🛠️ Utility Endpoints

### Fallback Ad Creation

#### POST `/api/fallback-ad/create`
**Purpose**: Create fallback ad placements

**Request Body**:
```json
{
  "networkId": 123,
  "advertiserId": 789,
  "campaignId": 101112,
  "advertisementIds": [161718, 161719],
  "sizes": ["SQ", "PT", "LS"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Fallback ads created successfully",
  "data": {
    "placementsCreated": 12,
    "placements": [
      {
        "advertisement_id": 161718,
        "zone_id": 131415,
        "campaign_id": 101112,
        "restrictions": ["home_page_only"]
      }
    ],
    "zonesMatched": [
      {
        "id": 131415,
        "name": "Home Banner",
        "network_id": 123
      }
    ]
  }
}
```

**Error Responses**:
- `400`: Invalid request parameters
- `404`: Network, advertiser, or campaign not found
- `500`: Creation failed

## 🏗️ Creation Endpoints

### Advertiser Creation

#### POST `/api/create/advertiser`
**Purpose**: Create a new advertiser locally

**Request Body**:
```json
{
  "name": "New Advertiser",
  "network_id": 123,
  "web_home_url": "https://example.com",
  "notes": "Advertiser notes",
  "admins": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Advertiser created successfully",
  "advertiser": {
    "_id": "...",
    "name": "New Advertiser",
    "network_id": 123,
    "created_locally": true,
    "synced_with_api": false
  }
}
```

### Campaign Creation

#### POST `/api/create/campaign`
**Purpose**: Create a new campaign locally

**Request Body**:
```json
{
  "name": "New Campaign",
  "advertiser_id": 789,
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z",
  "weight": 1,
  "display_type": "no_repeat"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Campaign created successfully",
  "campaign": {
    "_id": "...",
    "name": "New Campaign",
    "advertiser_id": 789,
    "created_locally": true,
    "synced_with_api": false
  }
}
```

### Zone Creation

#### POST `/api/create/zone`
**Purpose**: Create a new zone locally

**Request Body**:
```json
{
  "name": "New Zone",
  "network_id": 123,
  "alias": "new-zone",
  "advertisement_count": 1,
  "allow_duplicate_ads": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Zone created successfully",
  "zone": {
    "_id": "...",
    "name": "New Zone",
    "network_id": 123,
    "created_locally": true,
    "synced_with_api": false
  }
}
```

## 📊 Local Entity Management

### Local Entities

#### GET `/api/local-entities`
**Purpose**: Get all local entities that haven't been synced

**Response**:
```json
{
  "success": true,
  "entities": {
    "zones": [...],
    "advertisers": [...],
    "campaigns": [...],
    "networks": [...],
    "advertisements": [...]
  }
}
```

### Delete Local Entities

#### DELETE `/api/delete/local-all`
**Purpose**: Delete all local entities

**Response**:
```json
{
  "success": true,
  "message": "All local entities deleted successfully",
  "deleted": {
    "zones": 5,
    "advertisers": 3,
    "campaigns": 2,
    "networks": 0,
    "advertisements": 0
  }
}
```

## 📊 Data Models

### Network Model
```typescript
interface Network {
  id: number;
  name: string;
  group_id?: number | null;
  web_home_url?: string;
  logo?: {
    url: string;
  };
  valet_active: boolean;
  path: string;
  advertiser_count?: number;
  zone_count?: number;
}
```

### Advertiser Model
```typescript
interface Advertiser {
  id: number;
  name: string;
  logo?: {
    url: string;
  };
  web_home_url?: string;
  notes?: string | null;
  admins?: Array<{
    name: string;
    email: string;
  }>;
}
```

### Campaign Model
```typescript
interface Campaign {
  id: number;
  name: string;
  advertiser_id: number;
  start_date: string;
  end_date?: string;
  max_impression_count?: number;
  display_type: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;
  weight: number;
  path: string;
  archived?: boolean;
  pacing_type?: 'asap' | 'even';
  impression_max_type?: 'cap' | 'goal';
  paused?: boolean;
  notes?: string;
}
```

### Zone Model
```typescript
interface Zone {
  id: number;
  name: string;
  network_id: number;
  alias?: string | null;
  self_serve: boolean;
  size_type?: 'SQ' | 'PT' | 'LS' | null;
  size_number?: number | null;
  category?: string | null;
  block?: string | null;
  is_home?: boolean;
}
```

### Advertisement Model
```typescript
interface Advertisement {
  id: number;
  name: string;
  updated_at: string;
  type: string;
  advertiser: string;
  active: {
    url?: string | null;
  };
  active_placement: boolean;
  preview_url: string;
}
```

### Placement Model
```typescript
interface Placement {
  advertisement_id: number;
  zone_id: number;
  campaign_id: number;
  restrictions?: string[];
}
```

## 🔧 Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes
- `INVALID_PARAMETER`: Invalid request parameter
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error
- `SERVICE_UNAVAILABLE`: External service unavailable

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

## 🔒 Security

### Authentication
- **API Key**: Required for all endpoints
- **Rate Limiting**: 100 requests per minute per IP
- **CORS**: Configured for specific origins
- **Input Validation**: All inputs validated and sanitized

### Data Protection
- **Encryption**: HTTPS for all communications
- **Sanitization**: XSS and injection protection
- **Validation**: Strict input validation
- **Logging**: Security event logging

## 📈 Performance

### Caching
- **Response Caching**: 5-minute cache for GET requests
- **Database Caching**: MongoDB query optimization
- **CDN**: Static asset delivery

### Optimization
- **Pagination**: Large datasets paginated
- **Compression**: Gzip compression enabled
- **Database Indexing**: Optimized database queries
- **Connection Pooling**: Efficient database connections

## 🔗 Integration

### Broadstreet API
- **Base URL**: `https://api.broadstreetads.com/api/1`
- **Authentication**: API key authentication via query parameter
- **Rate Limits**: Respect Broadstreet rate limits
- **Error Handling**: Graceful handling of API errors

### MongoDB
- **Connection**: Mongoose ODM
- **Indexing**: Optimized indexes for queries
- **Validation**: Schema validation
- **Backup**: Regular database backups

## 🚀 Deployment

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/broadstreet

# Broadstreet API
BROADSTREET_API_KEY=your_api_key_here
BROADSTREET_API_URL=https://api.broadstreet.com

# Application
NEXT_PUBLIC_APP_NAME=Broadstreet Campaigns
NODE_ENV=production
```

### System Status
- **Monitoring**: System status available through sync endpoints
- **Dependencies**: MongoDB and Broadstreet API connectivity
- **Error Handling**: Comprehensive error responses for all endpoints

---

*For user-facing documentation, see the [User Guide](./user-guide.md) and [Utilities Guide](./utilities-guide.md)*
