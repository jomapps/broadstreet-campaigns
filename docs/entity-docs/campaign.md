# Campaign Entity Documentation

## Overview

Campaigns represent advertising campaigns that run across zones within a network. They define the advertising strategy, timing, and placement rules for advertisements.

## Core Fields

### Required Fields
- **Name** (string, required): The campaign name
- **Network ID** (number, required): The ID of the network this campaign belongs to

### Optional Fields

#### Basic Information
- **Advertiser ID** (number): The ID of the advertiser running this campaign
- **Start Date** (string): Campaign start date (ISO format)
- **End Date** (string): Campaign end date (ISO format)
- **Max Impression Count** (number): Maximum number of impressions for this campaign
- **Weight** (number): Campaign weight for rotation
- **Path** (string): URL path for campaign targeting
- **Notes** (string): Additional notes about the campaign

#### Display Settings
- **Display Type** (enum): How the campaign displays
  - `no_repeat`: No repeat impressions
  - `allow_repeat_campaign`: Allow repeat campaign impressions
  - `allow_repeat_advertisement`: Allow repeat advertisement impressions
  - `force_repeat_campaign`: Force repeat campaign impressions
- **Pacing Type** (enum): How impressions are paced
  - `asap`: As soon as possible
  - `even`: Even distribution over time
- **Impression Max Type** (enum): Type of impression limit
  - `cap`: Hard cap on impressions
  - `goal`: Goal for impressions

#### Status Settings
- **Active** (boolean): Whether the campaign is active (default: true)
- **Archived** (boolean): Whether the campaign is archived (default: false)
- **Paused** (boolean): Whether the campaign is paused (default: false)

#### Placements
- **Placements** (array): List of advertisement-zone placements
  - **Advertisement ID** (number, required): ID of the advertisement
  - **Zone ID** (number, required): ID of the zone
  - **Restrictions** (array): List of placement restrictions

## Broadstreet API Integration

### Creation Process
1. **Local Creation**: Campaign created locally in `local_campaigns` collection
2. **API Sync**: Campaign synced to Broadstreet API via `POST /campaigns`
3. **Entity Movement**: Successfully synced campaign moved to main `campaigns` collection

### API Endpoints
- **Create**: `POST /api/create/campaign`
- **Sync**: `POST /api/sync/campaigns`
- **Delete**: `DELETE /api/delete/campaign/[id]`

### Validation Rules
- Name must be unique within the network
- End date must be after start date (if both provided)
- Weight must be positive number (if provided)
- Max impression count must be positive (if provided)
- Display type must be valid enum value
- Pacing type must be valid enum value

## Database Schema

### Local Campaign Model
```typescript
interface ILocalCampaign {
  // Core fields
  name: string;
  network_id: number;
  advertiser_id?: number;
  start_date?: string;
  end_date?: string;
  max_impression_count?: number;
  display_type?: 'no_repeat' | 'allow_repeat_campaign' | 'allow_repeat_advertisement' | 'force_repeat_campaign';
  active: boolean;
  weight?: number;
  path?: string;
  archived?: boolean;
  pacing_type?: 'asap' | 'even';
  impression_max_type?: 'cap' | 'goal';
  paused?: boolean;
  notes?: string;
  placements?: Array<{
    advertisement_id: number;
    zone_id: number;
    restrictions?: string[];
  }>;
  
  // Local tracking
  created_locally: boolean;
  synced_with_api: boolean;
  created_at: Date;
  synced_at?: Date;
  original_broadstreet_id?: number;
  sync_errors: string[];
}
```

### Indexes
- `{ network_id: 1, name: 1 }` - Unique constraint
- `{ advertiser_id: 1 }` - Advertiser relationship
- `{ created_locally: 1 }` - Local entity queries
- `{ synced_with_api: 1 }` - Sync status queries

## Form Structure

### Required Section
- Campaign Name (text input)
- Network (pre-selected from sidebar filter)

### Collapsible Sections

#### Basic Settings
- Advertiser (dropdown from available advertisers)
- Start Date (date picker)
- End Date (date picker)
- Weight (number input)
- Max Impression Count (number input)

#### Display Settings
- Display Type (dropdown with enum values)
- Pacing Type (dropdown with enum values)
- Impression Max Type (dropdown with enum values)

#### Advanced Settings
- Path (text input)
- Notes (textarea)
- Status toggles (Active, Archived, Paused)

## Best Practices

### Data Entry
- Use descriptive campaign names
- Set appropriate start and end dates
- Configure proper display and pacing types
- Add relevant notes for campaign context

### Campaign Management
- Monitor campaign performance regularly
- Adjust weights based on performance
- Use proper impression limits
- Archive completed campaigns

### Sync Management
- Review local campaigns before syncing
- Handle sync errors gracefully
- Maintain data integrity during sync process
- Use batch sync for multiple campaigns

## Related Entities

### Dependencies
- **Networks**: Campaigns must belong to a network
- **Advertisers**: Campaigns can be associated with advertisers
- **Advertisements**: Campaigns can have multiple advertisements
- **Zones**: Campaigns are placed in zones

### Relationships
- Many-to-One with Networks
- Many-to-One with Advertisers
- One-to-Many with Placements
- Many-to-Many with Advertisements (via Placements)
- Many-to-Many with Zones (via Placements)

---

*For technical implementation details, see the [API Reference](../app-docs/api-reference.md)*
