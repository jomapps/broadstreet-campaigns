# Creation Feature

## Overview
This feature enables users to create new entities (advertisers, campaigns, advertisements, zones) directly in the local database with proper validation and sync status tracking. Created items are first stored locally and then synchronized with the Broadstreet API.

## Creation Button Design
- **Location**: Floating Action Button (FAB) positioned in the top-right corner of the content display area
- **Design**: Circular button with a plus (+) icon in the center
- **Styling**: Primary color scheme with hover effects and smooth transitions
- **Context Awareness**: Button behavior changes based on the current page:
  - Networks page: Shows button but directs to Broadstreet backend (requires commercial contracts)
  - Advertisers page: Create new advertiser
  - Campaigns page: Create new campaign
  - Advertisements page: Shows button but directs to Broadstreet backend (complex API requirements)
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

#### 7. Post-Creation Behavior
- **Auto-Refresh**: Always use `router.refresh()` after successful creation to immediately show new entities
- **Success Feedback**: Show success message before refreshing
- **Modal Closure**: Close creation modal after successful creation and refresh

#### 8. Local vs API Entity Styling
- **Local Entities**: Entities created locally (not yet synced to Broadstreet API) should have distinctive styling:
  - **Orange gradient background** (`bg-gradient-to-br from-orange-50 to-orange-100`)
  - **Thick orange border** (`border-2 border-orange-400`)
  - **Orange shadow** (`shadow-orange-200`)
  - **"🏠 Local" badge** with white text on orange background
  - **Hover effects** with scale and enhanced shadows
  - **Orange accent colors** in info sections (e.g., size info background)
- **API Entities**: Standard white background with gray borders
- **Visual Distinction**: Local entities must be immediately recognizable as different from synced entities

#### 9. Local Only Dashboard
- **Purpose**: Centralized view of all locally created entities that haven't been synced to Broadstreet API
- **Page Location**: `/local-only` - accessible from main navigation
- **Layout**: Distinct sections for each entity type (Zones, Advertisers, Campaigns, Networks, Advertisements)
- **Card Features**:
  - **Delete Button**: Cross (×) button on each card to delete local entity
  - **Confirmation**: Simple confirmation dialog before deletion
  - **Entity Details**: Show all relevant information for each local entity
  - **Enhanced Campaign Cards**: Complete campaign information including dates, weight, advertiser name and ID, display settings, and status indicators
  - **Delete All Button**: Red "Delete All Local" button to remove all local entities at once
- **Sync Functionality**:
  - **Sync All Button**: Single button to sync all local entities to Broadstreet API
  - **Progress Indicator**: Show sync progress and results
  - **Status Updates**: Update entity status from "local" to "synced" after successful sync
- **Delete All Functionality**:
  - **Delete All Button**: Red button to permanently delete all local entities
  - **Confirmation Dialog**: Strong warning about permanent deletion
  - **Comprehensive Cleanup**: Removes all local entities across all types
  - **Quality of Life**: Easy cleanup for testing and development
- **Visual Design**:
  - **Section Headers**: Clear entity type labels with counts
  - **Empty States**: Helpful messages when no local entities exist
  - **Consistent Styling**: Follow local entity styling guidelines from Section 8

#### 10. No Mock or Fallback Data Policy
- **Real API Only**: All operations must use real Broadstreet API calls
- **No Mock Data**: No hardcoded IDs, test data, or fallback values
- **Environment Configuration**: All API credentials must be properly configured
- **Validation**: All required fields must be validated before API calls
- **Error Handling**: Proper error handling for API failures without fallbacks

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
- Name (string, required) - Campaign identifier
- Network (pre-selected from sidebar filter) - Network selection required
- Advertiser (pre-selected from sidebar filter) - Advertiser selection required  
- Start Date (date, required) - When campaign goes live (defaults to current date at 12:00 AM)
- Weight (dropdown, required) - Campaign priority with predefined values

**Prominently Featured Fields:**
- End Date (date, optional) - When campaign ends (defaults to 11:59 PM if date selected)

**Weight Options (from API specs):**
- Remnant (0) - Lowest priority
- Low (0.5) - Low priority  
- Default (1) - Standard priority (default)
- High (1.5) - High priority
- Sponsorship (127) - Highest priority

**Collapsible Sections:**
- **Basic Settings**: Max impression count
- **Display Settings**: Display type, Pacing type, Impression max type
- **Advanced Settings**: Path, Notes

**Validation Rules:**
- Name must be unique within the advertiser
- Start date is required (date format with smart time defaults)
- Weight must be one of predefined values
- End date must be after start date (if provided)
- Network and Advertiser must be selected from sidebar filters

**Smart Time Defaults:**
- Start Date: Automatically defaults to 12:00 AM (00:00) when date is selected
- End Date: Automatically defaults to 11:59 PM (23:59) when date is selected
- These defaults ensure campaigns run for the full day when only dates are specified

### Advertisement Creation
**Status**: 🔄 **BACKEND REDIRECT** - Advertisements are complex and require features not available through the API.

**Modal Behavior**: When users click the creation button, they see a message directing them to log into the Broadstreet backend to create advertisements. They are reminded to sync afterwards.

**Reason**: Advertisement creation is complex and has features that cannot be done over API, requiring the full Broadstreet backend interface.

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
**Status**: 🔄 **BACKEND REDIRECT** - Networks require commercial contracts and must be created through Broadstreet backend.

**Modal Behavior**: When users click the creation button, they see a message directing them to log into the Broadstreet backend to create networks. They are reminded to sync afterwards.

**Reason**: Network creation requires commercial contracts and special business processes that cannot be handled through the API.

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

### ✅ Enhanced Entity Types - COMPLETED
- [x] Advertiser Creation (enhanced with new UI pattern)
- [x] Campaign Creation (enhanced with new UI pattern)
- [x] Zone Creation (enhanced with new UI pattern)

### 🔄 Backend Redirect Entity Types - IMPLEMENTED
- [x] Advertisement Creation (redirects to Broadstreet backend)
- [x] Network Creation (redirects to Broadstreet backend)

**Backend Redirect Pattern**: For entities that cannot be created through the API due to complexity or business requirements, the creation button is still shown but displays a modal with instructions to use the Broadstreet backend. This provides a consistent user experience while acknowledging the limitations.

### ✅ Implementation Pattern Applied
The enhanced UI pattern has been successfully applied to all entity creation forms:

1. **✅ Form Structure Updated**:
   - Only essential fields in required section (typically just name)
   - Optional fields organized into logical collapsible sections
   - Dual submit buttons implemented (top and bottom)

2. **✅ Collapsible Sections Added**:
   - `CollapsibleSection` component implemented across all forms
   - `expandedSections` state management added
   - Fields organized into: Basic Settings, Display/Behavior, Advanced Settings

3. **✅ Payload Construction Updated**:
   - Clean payload construction with only non-empty fields
   - Proper validation and error handling
   - Auto-refresh functionality after successful creation

4. **✅ Modal Layout Updated**:
   - Flexbox layout for auto-adjusting height
   - Proper overflow handling for scrollable content
   - Consistent spacing and visual hierarchy

5. **✅ Database Models Updated**:
   - Optional fields are truly optional in schema
   - Proper validation rules implemented
   - Clean API payload construction

### ✅ Sync Functionality - COMPLETE
**Status**: Fully implemented and working with proper API payload patterns

**Implemented Features**:
1. **Hierarchical Sync Order** - Proper dependency-based sync:
   - Step 1: Networks (no dependencies)
   - Step 2: Advertisers (depend on networks) ✅ **WORKING**
   - Step 3: Zones (depend on networks) ✅ **WORKING**
   - Step 4: Advertisements (depend on networks, advertisers)
   - Step 5: Campaigns (depend on advertisers) ✅ **WORKING**

2. **Dependency Resolution** - ID mapping for local to synced entities:
   - `advertiserIdMap` tracks local advertiser ID → synced advertiser ID
   - `networkIdMap` tracks local network ID → synced network ID
   - Entities reference mapped IDs when syncing dependent entities

3. **Clean API Payload Pattern** - Critical fix for API success:
   - **Only send defined values**: No undefined/null fields in payload
   - **Minimal required fields**: Start with essential fields only
   - **Conditional optional fields**: Only add fields with actual values
   - **Proper data types**: Ensure numeric fields are numbers, not strings

4. **Dry Run Validation** - Prevents name conflicts before sync:
   - **Name Conflict Detection**: Checks all existing entities for duplicate names
   - **Automatic Resolution**: Generates unique names by appending "(1)", "(2)", etc.
   - **Hierarchical Validation**: Respects entity dependencies during conflict checking
   - **Comprehensive Logging**: Reports all name conflicts and resolutions

5. **Real API Integration** - No mock or fallback data:
   - All sync operations use real Broadstreet API calls
   - Proper error handling for API failures
   - Environment configuration with real API credentials

6. **Testing Infrastructure** - Tools for development and testing:
   - `delete-zone-by-name.js` script for easy cleanup
   - npm script `delete:zone-by-name` for convenient access
   - Comprehensive testing of sync workflow

**API Payload Pattern**:
```typescript
// ✅ WORKING PATTERN (Clean Payload)
const payload = {
  name: entity.name,
  network_id: entity.network_id, // Always include
  // ... other required fields
};

// Only add optional fields if they have actual values
if (entity.optional_field) payload.optional_field = entity.optional_field;
if (entity.numeric_field !== undefined && entity.numeric_field !== null) {
  payload.numeric_field = entity.numeric_field;
}

// ❌ BROKEN PATTERN (Sends undefined values)
const payload = {
  name: entity.name,
  optional_field: entity.optional_field, // undefined = API rejection
  numeric_field: entity.numeric_field,   // undefined = API rejection
};
```

**Dry Run Validation Process**:
```typescript
// 1. Check for existing entities by name
const exists = await broadstreetAPI.checkExistingAdvertiser(name, networkId);

// 2. Generate unique name if conflict exists
const generateUniqueName = async (originalName, entityType, networkId, advertiserId?) => {
  let baseName = originalName;
  let counter = 1;
  
  while (await checkExists(baseName)) {
    baseName = `${originalName} (${counter})`;
    counter++;
  }
  return baseName;
};

// 3. Use resolved name in sync payload
const resolvedName = resolvedNames.get(originalName) || originalName;
const payload = { name: resolvedName, ... };
```

**Dry Run Validation Features**:
- **Pre-sync Validation**: Checks all entity names before starting sync process
- **Conflict Detection**: Identifies duplicate names across all entity types
- **Automatic Resolution**: Generates unique names with "(1)", "(2)" suffixes
- **Dependency Awareness**: Respects hierarchical relationships during validation
- **Comprehensive Reporting**: Logs all conflicts and resolutions
- **Zero Conflicts Guarantee**: Ensures no duplicate names in final sync

**Verified Success**:
- ✅ **Advertiser Sync**: "Leo API Advertisers" successfully created in Broadstreet backend
- ✅ **Zone Sync**: Zone creation working perfectly
- ✅ **Campaign Sync**: Campaign creation working with proper payload pattern

**Technical Implementation**:
- **API**: `POST /api/sync/local-all` with hierarchical dependency order and clean payloads
- **Database**: Proper entity movement between collections after successful API response
- **Validation**: API response validation before status updates
- **Error Handling**: Graceful handling of sync failures with detailed logging

### 📋 Next Steps
- [x] Test zone creation functionality in browser
- [x] Implement sync status indicators in UI
- [x] Add batch sync functionality
- [x] Create sync error handling and retry mechanisms
- [ ] Add creation audit trail and logging
- [x] Apply comprehensive approach to other entity types

## Phase 2: Enhanced Entity Creation Forms - COMPLETED

### 🎯 Implementation Plan

Based on the successful Zone creation pattern, we will now enhance Advertiser, Advertisement, and Campaign creation forms with the same comprehensive approach.

### 📋 Implementation Strategy

#### 1. Documentation Research & Analysis
- [x] Research Broadstreet documentation for each entity type
- [x] Create individual documentation files:
  - [x] `docs/entity-docs/advertiser.md` - Advertiser creation requirements and fields
  - [x] `docs/entity-docs/advertisement.md` - Advertisement creation requirements and fields  
  - [x] `docs/entity-docs/campaign.md` - Campaign creation requirements and fields

#### 2. Form Enhancement Pattern
Apply the proven Zone creation pattern to all entity types:

**Core Principles**:
- **Minimal required fields**: Only essential fields (like name) are required
- **Required fields at the top**: Move all required fields to the top of the modal
- **Empty optional fields**: Optional fields should be empty by default
- **Collapsible sections**: Group optional fields into collapsible sections
- **Clean payload**: Only send fields that have actual values
- **Auto-adjusting height**: Modal should resize based on content
- **Dual submit buttons**: Submit buttons at both top and bottom

#### 3. Entity-Specific Enhancements

##### Advertiser Creation Form
**Current Status**: Basic form exists, needs enhancement
**Required Fields**:
- Name (string, required)
- Network (pre-selected from sidebar filter)

**Collapsible Sections**:
- **Basic Settings**: Website URL, Notes
- **Advanced Settings**: Admin contacts (name, email pairs)

**Implementation Tasks**:
- [x] Update `AdvertiserCreationForm.tsx` with collapsible sections
- [x] Implement proper validation for admin contacts
- [x] Add dual submit buttons
- [x] Implement clean payload construction
- [x] Add auto-refresh functionality
- [ ] Test creation and sync functionality

##### Campaign Creation Form  
**Current Status**: Basic form exists, needs enhancement
**Required Fields**:
- Name (string, required)
- Advertiser (pre-selected from sidebar filter)

**Collapsible Sections**:
- **Basic Settings**: Start date, End date, Weight, Max impression count
- **Display Settings**: Display type, Pacing type
- **Advanced Settings**: Notes

**Implementation Tasks**:
- [x] Update `CampaignCreationForm.tsx` with collapsible sections
- [x] Implement date validation and formatting
- [x] Add proper enum validation for display_type and pacing_type
- [x] Implement clean payload construction
- [x] Add auto-refresh functionality
- [ ] Test creation and sync functionality

##### Advertisement Creation Form
**Current Status**: Basic form exists, needs enhancement
**Required Fields**:
- Name (string, required)
- Type (dropdown: image, text, video, native)

**Collapsible Sections**:
- **Basic Settings**: Preview URL, Target URL
- **Advanced Settings**: Notes

**Implementation Tasks**:
- [x] Update `AdvertisementCreationForm.tsx` with collapsible sections
- [x] Implement proper type validation
- [x] Add URL validation for preview and target URLs
- [x] Implement clean payload construction
- [x] Add auto-refresh functionality
- [ ] Test creation and sync functionality

#### 4. Testing & Validation
- [ ] Test all creation forms in browser
- [ ] Verify sync functionality for each entity type
- [ ] Test error handling and validation
- [ ] Verify Local Only dashboard integration
- [ ] Test delete functionality for each entity type

#### 5. Documentation Updates
- [ ] Update creation.md with implementation progress
- [ ] Document any new patterns or best practices
- [ ] Update API documentation
- [ ] Create user guides for each entity type

### 🔄 Implementation Timeline

**Week 1**: Documentation research and form structure updates
**Week 2**: Advertiser form enhancement and testing
**Week 3**: Campaign form enhancement and testing  
**Week 4**: Advertisement form enhancement and testing
**Week 5**: Integration testing and documentation updates

### 📊 Success Criteria

- [x] All entity creation forms follow the same pattern as Zone creation
- [x] Forms have proper validation and error handling
- [x] All entities can be created locally and synced to Broadstreet API
- [x] Local Only dashboard properly displays all entity types
- [x] Delete functionality works for all entity types
- [x] Documentation is comprehensive and up-to-date

### 🛠️ Technical Requirements

- **Consistent UI Pattern**: All forms must follow the same collapsible section pattern
- **Proper Validation**: Real-time validation with user-friendly error messages
- **API Integration**: All forms must work with existing API endpoints
- **Sync Functionality**: All entities must properly sync to Broadstreet API
- **Error Handling**: Graceful error handling with retry mechanisms
- **Testing**: Comprehensive testing of all functionality

---

*This implementation plan will be updated as we progress through each phase*