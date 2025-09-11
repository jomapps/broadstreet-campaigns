# Advertiser Entity Documentation

## Overview

Advertisers represent companies or organizations that run advertising campaigns on Broadstreet networks. They are the primary clients who purchase ad space and manage their advertising presence.

## Core Fields

### Required Fields
- **Name** (string, required): The advertiser's company or organization name
- **Network ID** (number, required): The ID of the network this advertiser belongs to

### Optional Fields

#### Basic Information
- **Website URL** (string): The advertiser's main website URL
- **Notes** (string): Additional notes or comments about the advertiser

#### Logo
- **Logo URL** (string): URL to the advertiser's logo image

#### Admin Contacts
- **Admins** (array): List of administrator contacts
  - **Name** (string, required): Contact person's name
  - **Email** (string, required): Contact person's email address

## Broadstreet API Integration

### Creation Process
1. **Local Creation**: Advertiser created locally in `local_advertisers` collection
2. **API Sync**: Advertiser synced to Broadstreet API via `POST /advertisers`
3. **Entity Movement**: Successfully synced advertiser moved to main `advertisers` collection

### API Endpoints
- **Create**: `POST /api/create/advertiser`
- **Sync**: `POST /api/sync/advertisers`
- **Delete**: `DELETE /api/delete/advertiser/[id]`

### Validation Rules
- Name must be unique within the network
- Website URL must be valid format (if provided)
- Email addresses must be valid format (if provided)
- Network ID must exist in the system

## Database Schema

### Local Advertiser Model
```typescript
interface ILocalAdvertiser {
  // Core fields
  name: string;
  network_id: number;
  logo?: { url: string };
  web_home_url?: string;
  notes?: string;
  admins?: Array<{ name: string; email: string }>;
  
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
- `{ created_locally: 1 }` - Local entity queries
- `{ synced_with_api: 1 }` - Sync status queries

## Form Structure

### Required Section
- Advertiser Name (text input)
- Network (pre-selected from sidebar filter)

### Collapsible Sections

#### Basic Settings
- Website URL (text input with URL validation)
- Notes (textarea)

#### Advanced Settings
- Admin Contacts (dynamic list)
  - Add/Remove admin contacts
  - Name and email validation for each contact

## Best Practices

### Data Entry
- Use clear, descriptive company names
- Ensure website URLs are complete and valid
- Add relevant admin contacts for communication
- Include helpful notes for internal reference

### Sync Management
- Review local advertisers before syncing
- Handle sync errors gracefully
- Maintain data integrity during sync process
- Use batch sync for multiple advertisers

### Error Handling
- Validate all required fields before submission
- Check for duplicate names within network
- Verify email format for admin contacts
- Handle API errors with user-friendly messages

## Related Entities

### Dependencies
- **Networks**: Advertisers must belong to a network
- **Campaigns**: Advertisers can have multiple campaigns
- **Advertisements**: Advertisers can have multiple advertisements

### Relationships
- One-to-Many with Campaigns
- One-to-Many with Advertisements
- Many-to-One with Networks

---

*For technical implementation details, see the [API Reference](../app-docs/api-reference.md)*
