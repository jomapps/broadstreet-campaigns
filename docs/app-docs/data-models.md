# Data Models

## 🎯 Overview

This document describes the data models, relationships, and database schema used in the Broadstreet Campaigns application.

## 🗄️ Database Schema

### MongoDB Collections
- **networks**: Network information and configuration
- **advertisers**: Advertiser company details and contacts
- **campaigns**: Campaign information and settings
- **zones**: Ad placement zone definitions
- **advertisements**: Ad creative information
- **placements**: Campaign-zone-advertisement relationships
- **sync_logs**: Data synchronization history

## 📊 Core Data Models

### Network Model

**Collection**: `networks`

**Schema**:
```typescript
interface INetwork extends Document {
  id: number;                    // Unique network ID from Broadstreet
  name: string;                  // Network display name
  group_id?: number | null;      // Network group association
  web_home_url?: string;         // Network website URL
  logo?: {                       // Network logo information
    url: string;
  };
  valet_active: boolean;         // Valet service status
  path: string;                  // Network path/URL
  advertiser_count?: number;     // Count of associated advertisers
  zone_count?: number;          // Count of associated zones
  createdAt: Date;              // Document creation timestamp
  updatedAt: Date;              // Document last update timestamp
}
```

**Indexes**:
- `id` (unique)
- `name` (text search)
- `valet_active`

**Relationships**:
- One-to-many with `zones`
- One-to-many with `advertisers` (via campaigns)

### Advertiser Model

**Collection**: `advertisers`

**Schema**:
```typescript
interface IAdvertiser extends Document {
  id: number;                    // Unique advertiser ID from Broadstreet
  name: string;                  // Advertiser company name
  logo?: {                       // Company logo information
    url: string;
  };
  web_home_url?: string;         // Company website URL
  notes?: string | null;         // Additional notes
  admins?: Array<{               // Admin contacts
    name: string;
    email: string;
  }>;
  createdAt: Date;              // Document creation timestamp
  updatedAt: Date;              // Document last update timestamp
}
```

**Indexes**:
- `id` (unique)
- `name` (text search)

**Relationships**:
- One-to-many with `campaigns`
- One-to-many with `advertisements`

### Campaign Model

**Collection**: `campaigns`

**Schema**:
```typescript
interface ICampaign extends Document {
  id: number;                    // Unique campaign ID from Broadstreet
  name: string;                  // Campaign display name
  advertiser_id: number;         // Associated advertiser ID
  start_date?: string;           // Campaign start date
  end_date?: string;             // Campaign end date
  max_impression_count?: number; // Maximum impressions
  display_type?: 'no_repeat' | 'allow_repeat_campaign' | 
                 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;               // Campaign active status
  weight?: number;               // Campaign weight/priority
  path: string;                  // Campaign path/URL
  archived?: boolean;            // Archive status
  pacing_type?: 'asap' | 'even'; // Pacing strategy
  impression_max_type?: 'cap' | 'goal'; // Impression limit type
  paused?: boolean;              // Pause status
  notes?: string;                // Campaign notes
  // Raw fields for API payload preservation
  weight_raw?: string;
  display_type_raw?: string;
  start_date_raw?: string;
  end_date_raw?: string;
  raw?: any;                     // Complete raw API payload
  createdAt: Date;              // Document creation timestamp
  updatedAt: Date;              // Document last update timestamp
}
```

**Indexes**:
- `id` (unique)
- `advertiser_id`
- `active`
- `start_date`
- `end_date`

**Relationships**:
- Many-to-one with `advertisers`
- One-to-many with `placements`

### Zone Model

**Collection**: `zones`

**Schema**:
```typescript
interface IZone extends Document {
  id: number;                    // Unique zone ID from Broadstreet
  name: string;                  // Zone display name
  network_id: number;            // Associated network ID
  alias?: string | null;         // Zone alias
  self_serve: boolean;           // Self-serve capability
  // Parsed zone information
  size_type?: 'SQ' | 'PT' | 'LS' | null; // Zone size type
  size_number?: number | null;   // Zone size number
  category?: string | null;      // Zone category
  block?: string | null;         // Zone block/position
  is_home?: boolean;             // Home page zone flag
  createdAt: Date;              // Document creation timestamp
  updatedAt: Date;              // Document last update timestamp
}
```

**Indexes**:
- `id` (unique)
- `network_id`
- `size_type`
- `category`

**Relationships**:
- Many-to-one with `networks`
- One-to-many with `placements`

### Advertisement Model

**Collection**: `advertisements`

**Schema**:
```typescript
interface IAdvertisement extends Document {
  id: number;                    // Unique advertisement ID from Broadstreet
  name: string;                  // Advertisement name
  updated_at: string;            // Last update timestamp
  type: string;                  // Advertisement type
  advertiser: string;            // Advertiser name
  active: {                      // Active advertisement details
    url?: string | null;
  };
  active_placement: boolean;     // Active placement status
  preview_url: string;           // Preview URL
  createdAt: Date;              // Document creation timestamp
  updatedAt: Date;              // Document last update timestamp
}
```

**Indexes**:
- `id` (unique)
- `advertiser`
- `type`
- `active_placement`

**Relationships**:
- Many-to-one with `advertisers`
- One-to-many with `placements`

### Placement Model

**Collection**: `placements`

**Schema**:
```typescript
interface IPlacement extends Document {
  advertisement_id: number;      // Associated advertisement ID
  zone_id: number;              // Associated zone ID
  campaign_id: number;          // Associated campaign ID
  restrictions?: string[];       // Placement restrictions
  createdAt: Date;              // Document creation timestamp
  updatedAt: Date;              // Document last update timestamp
}
```

**Indexes**:
- Compound: `{advertisement_id: 1, zone_id: 1, campaign_id: 1}` (unique)
- `campaign_id`
- `advertisement_id`
- `zone_id`

**Relationships**:
- Many-to-one with `advertisements`
- Many-to-one with `zones`
- Many-to-one with `campaigns`

### Sync Log Model

**Collection**: `sync_logs`

**Schema**:
```typescript
interface ISyncLog extends Document {
  entity: string;                // Entity type (networks, advertisers, etc.)
  lastSync: Date;                // Last sync timestamp
  status: 'success' | 'error' | 'pending'; // Sync status
  recordCount: number;           // Number of records processed
  error?: string;                // Error message if failed
  createdAt: Date;              // Document creation timestamp
  updatedAt: Date;              // Document last update timestamp
}
```

**Indexes**:
- `entity`
- `lastSync`
- `status`

## 🔗 Data Relationships

### Entity Relationship Diagram
```
Networks (1) ──── (M) Zones
    │
    └─── (M) Advertisers (1) ──── (M) Campaigns
                │                        │
                └─── (M) Advertisements ──┘
                                        │
                                    (M) Placements (M)
                                        │
                                    (1) Zones
```

### Relationship Details

#### Network Relationships
- **One-to-Many with Zones**: A network can have multiple zones
- **One-to-Many with Advertisers**: A network can have multiple advertisers (via campaigns)

#### Advertiser Relationships
- **Many-to-One with Network**: An advertiser belongs to a network (via campaigns)
- **One-to-Many with Campaigns**: An advertiser can have multiple campaigns
- **One-to-Many with Advertisements**: An advertiser can have multiple advertisements

#### Campaign Relationships
- **Many-to-One with Advertiser**: A campaign belongs to an advertiser
- **One-to-Many with Placements**: A campaign can have multiple placements

#### Zone Relationships
- **Many-to-One with Network**: A zone belongs to a network
- **One-to-Many with Placements**: A zone can have multiple placements

#### Advertisement Relationships
- **Many-to-One with Advertiser**: An advertisement belongs to an advertiser
- **One-to-Many with Placements**: An advertisement can have multiple placements

#### Placement Relationships
- **Many-to-One with Campaign**: A placement belongs to a campaign
- **Many-to-One with Zone**: A placement belongs to a zone
- **Many-to-One with Advertisement**: A placement belongs to an advertisement

## 📊 Data Validation

### Schema Validation Rules

#### Network Validation
- `id`: Required, unique, number
- `name`: Required, string, max 255 characters
- `valet_active`: Required, boolean
- `path`: Required, string, valid URL path

#### Advertiser Validation
- `id`: Required, unique, number
- `name`: Required, string, max 255 characters
- `web_home_url`: Optional, string, valid URL format
- `admins`: Optional, array of objects with name and email

#### Campaign Validation
- `id`: Required, unique, number
- `name`: Required, string, max 255 characters
- `advertiser_id`: Required, number, must reference existing advertiser
- `active`: Required, boolean
- `display_type`: Optional, enum with specific values
- `start_date`: Optional, string, valid date format
- `end_date`: Optional, string, valid date format

#### Zone Validation
- `id`: Required, unique, number
- `name`: Required, string, max 255 characters
- `network_id`: Required, number, must reference existing network
- `self_serve`: Required, boolean
- `size_type`: Optional, enum with specific values

#### Advertisement Validation
- `id`: Required, unique, number
- `name`: Required, string, max 255 characters
- `type`: Required, string, max 100 characters
- `advertiser`: Required, string, max 255 characters
- `preview_url`: Required, string, valid URL format

#### Placement Validation
- `advertisement_id`: Required, number, must reference existing advertisement
- `zone_id`: Required, number, must reference existing zone
- `campaign_id`: Required, number, must reference existing campaign
- Unique constraint on combination of all three IDs

## 🔄 Data Synchronization

### Sync Process
1. **Fetch from API**: Retrieve data from Broadstreet API
2. **Validate Data**: Check data format and required fields
3. **Transform Data**: Convert API format to internal format
4. **Update Database**: Insert, update, or delete records
5. **Log Results**: Record sync status and statistics

### Sync Strategies
- **Full Sync**: Replace all data with fresh API data
- **Incremental Sync**: Only update changed records
- **Delta Sync**: Track and apply only differences

### Data Consistency
- **Referential Integrity**: Maintain foreign key relationships
- **Atomic Operations**: Use transactions for multi-record updates
- **Rollback Capability**: Ability to revert failed syncs
- **Conflict Resolution**: Handle data conflicts during sync

## 📈 Performance Optimization

### Database Indexes
- **Primary Keys**: Unique indexes on all `id` fields
- **Foreign Keys**: Indexes on relationship fields
- **Query Optimization**: Indexes on frequently queried fields
- **Compound Indexes**: Multi-field indexes for complex queries

### Query Optimization
- **Lean Queries**: Use `.lean()` for read-only operations
- **Selective Fields**: Only fetch required fields
- **Pagination**: Limit result sets for large datasets
- **Aggregation**: Use MongoDB aggregation for complex queries

### Caching Strategy
- **Application Cache**: Cache frequently accessed data
- **Query Cache**: Cache expensive query results
- **API Cache**: Cache external API responses
- **Session Cache**: Cache user session data

## 🔒 Data Security

### Access Control
- **Authentication**: Require valid API keys
- **Authorization**: Role-based access control
- **Data Isolation**: Separate data by user/organization
- **Audit Logging**: Track all data access and modifications

### Data Protection
- **Encryption**: Encrypt sensitive data at rest
- **Transmission**: Use HTTPS for all data transmission
- **Validation**: Strict input validation and sanitization
- **Backup**: Regular encrypted backups

### Privacy Compliance
- **Data Minimization**: Only collect necessary data
- **Retention Policies**: Automatic data cleanup
- **User Rights**: Data access and deletion rights
- **Consent Management**: Track user consent for data processing

---

*For API usage details, see the [API Reference](./api-reference.md)*
