# Advertisement Entity Documentation

## Overview

Advertisements represent the actual ad creatives that are displayed in zones. They contain the visual content, links, and metadata needed to display ads to users.

## Core Fields

### Required Fields
- **Name** (string, required): The advertisement name
- **Network ID** (number, required): The ID of the network this advertisement belongs to
- **Type** (string, required): The type of advertisement
  - `image`: Image-based advertisement
  - `text`: Text-based advertisement
  - `video`: Video-based advertisement
  - `native`: Native advertisement

### Optional Fields

#### Basic Information
- **Advertiser** (string): The advertiser name (for reference)
- **Advertiser ID** (number): The ID of the advertiser
- **Preview URL** (string): URL to preview the advertisement
- **Notes** (string): Additional notes about the advertisement

#### Active Content
- **Active URL** (string): The active URL for the advertisement
- **Active Placement** (boolean): Whether the advertisement has active placements (default: true)

## Broadstreet API Integration

### Creation Process
1. **Local Creation**: Advertisement created locally in `local_advertisements` collection
2. **API Sync**: Advertisement synced to Broadstreet API via `POST /advertisements`
3. **Entity Movement**: Successfully synced advertisement moved to main `advertisements` collection

### API Endpoints
- **Create**: `POST /api/create/advertisement`
- **Sync**: `POST /api/sync/advertisements`
- **Delete**: `DELETE /api/delete/advertisement/[id]`

### Validation Rules
- Name must be unique within the network
- Type must be one of the predefined options
- URLs must be valid format (if provided)
- Advertiser ID must exist in the system (if provided)

## Database Schema

### Local Advertisement Model
```typescript
interface ILocalAdvertisement {
  // Core fields
  name: string;
  network_id: number;
  type: string;
  advertiser?: string;
  advertiser_id?: number;
  active?: { url?: string | null };
  active_placement?: boolean;
  preview_url?: string;
  notes?: string;
  
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
- `{ type: 1 }` - Type-based queries
- `{ created_locally: 1 }` - Local entity queries
- `{ synced_with_api: 1 }` - Sync status queries

## Form Structure

### Required Section
- Advertisement Name (text input)
- Network (pre-selected from sidebar filter)
- Type (dropdown with predefined options)

### Collapsible Sections

#### Basic Settings
- Advertiser (dropdown from available advertisers)
- Preview URL (text input with URL validation)
- Active URL (text input with URL validation)

#### Advanced Settings
- Notes (textarea)
- Active Placement (toggle)

## Advertisement Types

### Image Advertisements
- Display static or animated images
- Require image URL or upload
- Can include click-through URLs
- Support various image formats (JPG, PNG, GIF)

### Text Advertisements
- Display text-based content
- Can include headlines, descriptions, and call-to-action text
- Support HTML formatting
- Lightweight and fast loading

### Video Advertisements
- Display video content
- Support various video formats
- Can include pre-roll, mid-roll, or post-roll placement
- Require video URL or upload

### Native Advertisements
- Blend with website content
- Match website design and layout
- Provide seamless user experience
- Support various content formats

## Best Practices

### Data Entry
- Use descriptive advertisement names
- Select appropriate advertisement type
- Provide valid preview and active URLs
- Include relevant notes for context

### Content Management
- Ensure all URLs are accessible and valid
- Test advertisements before deployment
- Monitor advertisement performance
- Keep content fresh and relevant

### Sync Management
- Review local advertisements before syncing
- Handle sync errors gracefully
- Maintain data integrity during sync process
- Use batch sync for multiple advertisements

## Related Entities

### Dependencies
- **Networks**: Advertisements must belong to a network
- **Advertisers**: Advertisements can be associated with advertisers
- **Campaigns**: Advertisements are used in campaigns
- **Zones**: Advertisements are displayed in zones

### Relationships
- Many-to-One with Networks
- Many-to-One with Advertisers
- Many-to-Many with Campaigns (via Placements)
- Many-to-Many with Zones (via Placements)

## Content Guidelines

### Image Advertisements
- Use high-quality images
- Optimize file sizes for web
- Ensure proper aspect ratios
- Include alt text for accessibility

### Text Advertisements
- Use clear, compelling copy
- Keep text concise and readable
- Include strong call-to-action
- Test readability across devices

### Video Advertisements
- Use appropriate video lengths
- Ensure good audio quality
- Include captions for accessibility
- Optimize for various devices

### Native Advertisements
- Match website design language
- Provide valuable content
- Maintain transparency
- Follow platform guidelines

---

*For technical implementation details, see the [API Reference](../app-docs/api-reference.md)*
