# Creation Feature

## Overview
This feature enables users to create new entities (advertisers, campaigns, advertisements, zones) directly in the local database with proper validation and sync status tracking. Created items are first stored locally and then synchronized with the Broadstreet API.

## Creation Button Design
- **Location**: Floating Action Button (FAB) positioned in the top-right corner of the content display area
- **Design**: Circular button with a plus (+) icon in the center
- **Styling**: Primary color scheme with hover effects and smooth transitions
- **Context Awareness**: Button behavior changes based on the current page:
  - Networks page: Create new network (if permissions allow)
  - Advertisers page: Create new advertiser
  - Campaigns page: Create new campaign
  - Advertisements page: Create new advertisement
  - Zones page: Create new zone

## Creation Modal System
- **Modal Design**: Centered modal with backdrop overlay
- **Form Validation**: Real-time validation with error messages
- **Loading States**: Spinner and disabled states during creation
- **Responsive**: Works on all screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Modal UI Design Pattern

### Core Principles
- **Minimal required fields**: Only essential fields (like name) are required, everything else is optional
- **Required fields at the top**: Move all required fields to the top of the modal for immediate visibility
- **Empty optional fields**: Optional fields should be empty by default, no pre-filled values
- **Collapsible sections**: Group optional fields into collapsible sections to reduce visual overwhelm
- **Clean payload**: Only send fields that have actual values - exclude empty optional fields from API requests
- **Auto-adjusting height**: Modal should resize based on content and available space
- **Dual submit buttons**: Submit buttons at both top and bottom for quick submission without opening optional sections

### Implementation Guidelines

#### 1. Form Structure
```typescript
// Required fields at the top
<div className="mb-6">
  <Label htmlFor="name">Entity Name *</Label>
  <Input id="name" required />
</div>

// Collapsible sections for optional fields
<CollapsibleSection title="Basic Settings" sectionKey="basicSettings">
  {/* Optional fields */}
</CollapsibleSection>
```

#### 2. Collapsible Section Component
```typescript
const CollapsibleSection = ({ title, sectionKey, children, description }) => {
  const isExpanded = expandedSections[sectionKey];
  
  return (
    <div className="border border-gray-200 rounded-lg">
      <button type="button" onClick={() => toggleSection(sectionKey)}>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {isExpanded ? <ChevronDown /> : <ChevronRight />}
      </button>
      {isExpanded && <div>{children}</div>}
    </div>
  );
};
```

#### 3. Payload Construction
```typescript
// Start with required fields only
const payload = {
  name: formData.name.trim(),
  // other required fields
};

// Only add optional fields if they have values
if (formData.optional_field && formData.optional_field.trim()) {
  payload.optional_field = formData.optional_field.trim();
}
```

#### 4. Modal Layout
```typescript
// Flexbox layout for auto-adjusting height
<form className="flex flex-col h-full">
  {/* Top submit button */}
  <div className="flex justify-end space-x-3 mb-6">
    <Button type="submit">Create</Button>
  </div>
  
  {/* Required fields */}
  <div className="mb-6">{/* required fields */}</div>
  
  {/* Collapsible sections */}
  <div className="flex-1 space-y-4 overflow-y-auto">
    {/* collapsible sections */}
  </div>
  
  {/* Bottom submit button */}
  <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
    <Button type="submit">Create</Button>
  </div>
</form>
```

#### 5. Section Organization
- **Basic Settings**: Core optional fields (counts, labels, basic toggles)
- **Display/Behavior**: How the entity behaves (display types, intervals, etc.)
- **Sizing/Dimensions**: Physical dimensions (width, height, etc.)
- **Advanced Settings**: Advanced options (aliases, custom CSS, special flags)

#### 6. Visual Design
- **Section Headers**: Clear titles with helpful descriptions
- **Chevron Icons**: Right arrow (collapsed) / Down arrow (expanded)
- **Hover Effects**: Subtle background changes on section headers
- **Consistent Spacing**: 4-unit spacing between sections and fields
- **Error States**: Red borders and error messages below fields

## Entity-Specific Creation Forms

### Advertiser Creation
**Required Fields:**
- Name (string, required)
- Network (pre-selected from sidebar filter)

**Collapsible Sections:**
- **Basic Settings**: Website URL, Notes
- **Advanced Settings**: Admin contacts (name, email pairs)

**Validation Rules:**
- Name must be unique within the network
- Website URL must be valid format
- Email addresses must be valid format

### Campaign Creation
**Required Fields:**
- Name (string, required)
- Advertiser (pre-selected from sidebar filter)

**Collapsible Sections:**
- **Basic Settings**: Start date, End date, Weight, Max impression count
- **Display Settings**: Display type, Pacing type
- **Advanced Settings**: Notes

**Validation Rules:**
- Name must be unique within the advertiser
- End date must be after start date
- Weight must be positive number

### Advertisement Creation
**Required Fields:**
- Name (string, required)
- Type (dropdown: image, text, video, native)

**Collapsible Sections:**
- **Basic Settings**: Preview URL, Target URL
- **Advanced Settings**: Notes

**Validation Rules:**
- Name must be unique
- URLs must be valid format
- Type must be one of the predefined options

### Zone Creation
**Required Fields:**
- Name (string, required) - Zone identifier
- Network (pre-selected from sidebar filter)

**Note**: Only the zone name is required. All other fields are optional and organized in collapsible sections.

**Basic Settings:**
- Advertisement Count (number, default: 1) - Max ads in zone
- Allow Duplicate Ads (boolean, default: false) - Allow same ad multiple times
- Concurrent Campaigns (number) - Max concurrent campaigns (informational)
- Advertisement Label (string) - Text label above zone on website
- Archived (boolean, default: false) - Whether zone appears on webpage

**Display Type:**
- Display Type (dropdown: standard, rotation)
- Rotation Interval (number, required if rotation) - Interval in milliseconds
- Animation Type (dropdown: none, fade, slide, etc.) - For rotation transitions

**Sizing (Optional):**
- Width (number) - Zone width in pixels
- Height (number) - Zone height in pixels

**Advanced Settings:**
- Alias (string) - Shorthand name for ad tags
- RSS Shuffle (boolean) - For newsletters with RSS enabled
- Style (text) - Custom CSS styles for zone
- Self Serve (boolean, default: false) - Whether zone is self-serve

**Validation Rules:**
- Name must be unique within the network
- Alias must be unique within network if provided
- Rotation interval required if display type is "rotation"
- Numeric fields must be positive integers

### Network Creation
**Required Fields:**
- Name (string, required)

**Collapsible Sections:**
- **Basic Settings**: Description, Website URL
- **Advanced Settings**: Admin contacts, Custom settings

**Validation Rules:**
- Name must be unique
- Website URL must be valid format

## Data Entry Process
1. **Button Click**: User clicks the creation button
2. **Modal Opens**: Modal appears with appropriate form fields
3. **Pre-population**: Default values are taken from sidebar filters
4. **Form Filling**: User fills in required and optional fields
5. **Validation**: Real-time validation provides immediate feedback
6. **Submission**: Form submits to local database
7. **Confirmation**: Success message with created item details
8. **UI Update**: New item appears in the list with sync status indicator

## Sync Status Identification
Items created locally but not yet synchronized with the Broadstreet API are visually distinguished:

### Visual Indicators
- **Warning Icon**: Orange/yellow warning triangle icon
- **Background Color**: Light red/orange background tint
- **Border**: Dashed border to indicate temporary status
- **Badge**: "Not Synced" badge with sync button

### Sync Process
1. **Batch Sync**: Multiple unsynced items can be synced together
2. **Individual Sync**: Each item can be synced individually
3. **Error Handling**: Failed syncs show error messages with retry options
4. **Status Updates**: Real-time status updates during sync process

## Database Schema Updates

### Separate Collections Strategy
Create dedicated collections for locally created items to prevent sync operations from overwriting user-created content:

- `local_zones` - Locally created zones with all Broadstreet fields
- `local_advertisers` - Locally created advertisers with all Broadstreet fields  
- `local_campaigns` - Locally created campaigns with all Broadstreet fields
- `local_advertisements` - Locally created advertisements with all Broadstreet fields
- `local_networks` - Locally created networks with all Broadstreet fields

### Field Tracking
Each local collection includes:
- All required and optional fields from Broadstreet API
- `created_locally: boolean` (default: true)
- `synced_with_api: boolean` (default: false)
- `created_at: Date` and `synced_at: Date` timestamps
- `original_broadstreet_id: number` (set when synced to API)
- `sync_errors: string[]` (track sync failures)

### Sync Protection
- Sync operations only affect items with `created_locally: false`
- Locally created items are preserved during sync operations
- Manual sync option for locally created items
- Clear visual indicators for sync status

## API Endpoints
- `POST /api/create/advertiser` - Create new advertiser
- `POST /api/create/campaign` - Create new campaign  
- `POST /api/create/advertisement` - Create new advertisement
- `POST /api/create/zone` - Create new zone
- `POST /api/sync/created-items` - Sync created items with API
- `GET /api/sync-status` - Get sync status for all items

## Error Handling
- **Validation Errors**: Clear error messages for each field
- **Network Errors**: Retry mechanisms for API failures
- **Duplicate Errors**: Suggestions for resolving conflicts
- **Permission Errors**: Clear messaging about access restrictions

## User Experience Enhancements
- **Auto-save**: Draft saving for long forms
- **Keyboard Shortcuts**: Quick access to creation modal
- **Bulk Creation**: Support for creating multiple similar items
- **Templates**: Pre-defined templates for common item types
- **Import/Export**: CSV import for bulk creation

## Implementation Status

### ✅ Zone Creation Feature - COMPLETE
**Status**: Ready for production use

**Implemented Features**:
1. **Comprehensive Zone Form** - All Broadstreet dashboard fields:
   - Required: Name, Network (pre-selected from sidebar)
   - Basic Settings: Advertisement Count, Allow Duplicates, Concurrent Campaigns, Label, Archived
   - Display Type: Standard/Rotation with interval and animation options
   - Sizing: Width/Height (optional, for AMP customers)
   - Advanced: Alias, RSS Shuffle, Custom CSS, Self Serve

2. **Local Database Storage** - Separate `local_zones` collection:
   - All Broadstreet API fields included
   - Creation tracking with timestamps
   - Sync status management
   - Unique constraints for name and alias within network

3. **Form Validation** - Real-time validation:
   - Required field validation
   - Rotation interval validation for rotation display type
   - Numeric field validation
   - Unique name/alias checking within network

4. **User Experience** - Intuitive interface:
   - Network pre-selection from sidebar filters
   - **Minimal required fields**: Only zone name is required
   - **Collapsible sections**: All optional fields organized in expandable sections
   - **Dual submit buttons**: Quick submission at top and bottom
   - **Auto-adjusting height**: Modal resizes based on content
   - Optional fields empty by default (no pre-filled values)
   - Clean API payload (only sends fields with actual values)
   - Helpful descriptions and examples
   - Error handling with user-friendly messages

**Technical Implementation**:
- **Model**: `LocalZone` with comprehensive field definitions
- **API**: `POST /api/create/zone` with full validation
- **Form**: React component with controlled inputs and validation
- **Database**: MongoDB with proper indexing and constraints

### 🔄 Other Entity Types - PENDING
- [ ] Advertiser Creation (basic form exists, needs enhancement with new UI pattern)
- [ ] Campaign Creation (basic form exists, needs enhancement with new UI pattern)
- [ ] Advertisement Creation (basic form exists, needs enhancement with new UI pattern)
- [ ] Network Creation (basic form exists, needs enhancement with new UI pattern)

### 📋 Implementation Pattern for Other Forms
To apply the enhanced UI pattern to other entity creation forms:

1. **Update Form Structure**:
   - Move only essential fields to required section (typically just name)
   - Group optional fields into logical collapsible sections
   - Implement dual submit buttons (top and bottom)

2. **Add Collapsible Sections**:
   - Copy the `CollapsibleSection` component from `ZoneCreationForm`
   - Add `expandedSections` state management
   - Organize fields into: Basic Settings, Display/Behavior, Advanced Settings

3. **Update Payload Construction**:
   - Start with required fields only
   - Add optional fields only if they have values
   - Remove empty/undefined fields from API payload

4. **Update Modal Layout**:
   - Use flexbox layout for auto-adjusting height
   - Add proper overflow handling for scrollable content
   - Ensure consistent spacing and visual hierarchy

5. **Update Database Models**:
   - Remove default values for optional fields
   - Ensure all optional fields are truly optional in schema
   - Add proper validation rules

### 📋 Next Steps
- [ ] Test zone creation functionality in browser
- [ ] Implement sync status indicators in UI
- [ ] Add batch sync functionality
- [ ] Create sync error handling and retry mechanisms
- [ ] Add creation audit trail and logging
- [ ] Apply comprehensive approach to other entity types