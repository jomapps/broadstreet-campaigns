# Entity Documentation

This directory contains detailed documentation for each entity type in the Broadstreet Campaigns application, based on the official [Broadstreet Information Center](https://information.broadstreetads.com/).

## Entity Types

### [Advertiser](./advertiser.md)
Companies or organizations that run advertising campaigns on Broadstreet networks.

**Key Features**:
- Company information and branding
- Admin contact management
- Network association
- Campaign and advertisement relationships

**Broadstreet Documentation**: [Advertisers Section](https://information.broadstreetads.com/)

### [Campaign](./campaign.md)
Advertising campaigns that define strategy, timing, and placement rules for advertisements.

**Key Features**:
- Campaign scheduling and duration
- Impression limits and pacing
- Display type configuration
- Placement management

**Broadstreet Documentation**: [Campaigns Section](https://information.broadstreetads.com/)

### [Advertisement](./advertisement.md)
Ad creatives that contain visual content, links, and metadata for display in zones.

**Key Features**:
- Multiple ad types (image, text, video, native)
- Content management
- URL configuration
- Performance tracking

**Broadstreet Documentation**: [Advertisements Section](https://information.broadstreetads.com/)

### [Zone](./zone.md)
Ad placement locations within networks where advertisements are displayed.

**Key Features**:
- Zone configuration and sizing
- Display type settings
- Advertisement management
- Network association

**Broadstreet Documentation**: [Zones Section](https://information.broadstreetads.com/)

## Implementation Status

### ✅ Completed
- **Zone Creation**: Fully implemented with comprehensive form and sync functionality
- **Documentation**: Complete entity documentation for all types
- **Sync System**: Proper validation and entity lifecycle management

### 🔄 In Progress
- **Advertiser Creation**: Enhanced form with collapsible sections
- **Campaign Creation**: Enhanced form with collapsible sections
- **Advertisement Creation**: Enhanced form with collapsible sections

### 📋 Planned
- **Network Creation**: Enhanced form with collapsible sections
- **Bulk Operations**: Multi-entity creation and management
- **Advanced Features**: Templates, import/export, audit trails

## Common Patterns

All entity creation forms follow the same proven pattern established with Zone creation:

### Form Structure
1. **Required Fields**: Only essential fields at the top
2. **Collapsible Sections**: Optional fields organized in expandable sections
3. **Dual Submit Buttons**: Quick submission at top and bottom
4. **Auto-adjusting Height**: Modal resizes based on content
5. **Clean Payload**: Only sends fields with actual values

### Validation
- Real-time validation with user-friendly error messages
- Required field validation
- Format validation (URLs, emails, dates)
- Unique constraint validation within network

### Sync Process
1. **Local Creation**: Entities created in local collections
2. **API Validation**: Real Broadstreet API calls with response validation
3. **Entity Movement**: Successfully synced entities moved to main collections
4. **Error Handling**: Graceful handling of sync failures

## Best Practices

### Development
- Follow the established Zone creation pattern
- Implement proper validation and error handling
- Test all functionality thoroughly
- Maintain consistent UI/UX across all forms

### Data Management
- Use descriptive names for all entities
- Validate all required fields before submission
- Handle sync errors gracefully
- Maintain data integrity during operations

### User Experience
- Provide clear feedback for all actions
- Use intuitive form layouts
- Implement proper loading states
- Handle errors with helpful messages

---

*For technical implementation details, see the [API Reference](../app-docs/api-reference.md)*
