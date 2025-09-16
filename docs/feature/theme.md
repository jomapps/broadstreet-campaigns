# Theme Feature - Complete Implementation Guide

## Overview
We are building a theme feature for this app - a tool for creating and assisting with the creation of advertising campaigns in Broadstreet.

### Key App Features
- Creating campaigns
- Creating zones
- Creating advertisers
- Creating placements
- Syncing all of the above to and from Broadstreet backend
- We manage and do everything in the local database and sync is the way to push to Broadstreet

## What is a Theme?
A theme is a way to group zones together for easier campaign management.

### Purpose
- Zones belong to different categories and blocks on websites
- We want to group those zones together so we can create campaigns that target those zones
- This is essentially a quality of life feature for campaign management

### Key Characteristics
- **Local-only feature**: Themes have nothing to do with Broadstreet and will never sync
- **Zone grouping**: Themes contain collections of synced zones
- **Campaign targeting**: Themes enable bulk zone selection for campaigns
- **Persistent storage**: Themes are stored in a separate MongoDB collection

## Technical Architecture

### Database Schema
```typescript
interface ITheme extends Document {
  mongo_id: string;
  name: string;
  description?: string;
  zone_ids: number[]; // Array of Broadstreet zone IDs (synced zones only)
  created_at: Date;
  updated_at: Date;
  zone_count: number; // Virtual field for display
}
```

### Zone Eligibility Rules
**CRITICAL**: Only zones that are synced with Broadstreet are supported for themes.
- Must have `broadstreet_id` (not null/undefined)
- Must have `synced_with_api: true`
- Local-only zones (`created_locally: true` && `synced_with_api: false`) are excluded

## Feature Requirements

### Theme Creation
- **Theme Page**: Dedicated page for theme management (`/themes`)
- **Empty Theme Creation**: Create themes with just a name initially
- **Separate Collection**: Themes stored in MongoDB `themes` collection
- **No Broadstreet Sync**: Themes are local-only and never sync

### Theme Display
Two primary display modes:

#### 1. Theme List View (`/themes`)
- Grid of theme cards showing:
  - Theme name
  - Zone count (e.g., "12 zones")
  - Edit/delete actions
- Search and filter capabilities
- Create new theme button

#### 2. Theme Detail View (`/themes/[id]`)
- Display all zones in the theme
- Zone filtering and search
- Add/remove zones functionality
- Theme name editing

#### 3. Zone Badge Display
- **All zone cards** throughout the app show theme badges
- Small badges at bottom of zone cards
- Show theme names the zone belongs to
- Clickable badges navigate to theme detail

### Theme Management Operations

#### Adding Zones to Themes

##### Method 1: Zone Selection (Zones Page)
- **Location**: `/zones` page
- **Prerequisites**:
  - Theme must exist
  - Zones must be synced with Broadstreet
- **Process**:
  1. Use existing filter tools to display desired zones
  2. Select zones using existing selection controls
  3. Click "Add to Theme" button
  4. Modal popup with theme checkboxes
  5. Check themes to add zones to
  6. Supports adding to multiple themes simultaneously
- **Deduplication**: Duplicate requests ignored (no error, no duplicate entries)

##### Method 2: Campaign Zone Copy (Campaigns Page)
- **Location**: `/campaigns` page
- **Process**:
  1. Select a campaign
  2. Click "Copy Zones to Theme" button
  3. Automatically creates theme with campaign name
  4. Adds all campaign zones to the new theme
- **No Modal**: Direct operation since zones are predetermined

##### Method 3: Theme Cloning (Themes Page)
- **Location**: `/themes` page
- **Process**:
  1. Click clone button on theme card
  2. Creates new theme with copied zones
  3. Prompts for new theme name

#### Removing Zones from Themes

##### Single Theme Management
- **Location**: `/themes/[id]` (theme detail page)
- **Process**:
  1. View zones in theme
  2. Use zone filters to narrow selection
  3. Use "Select All Displayed Zones" button
  4. Click "Remove from Theme" button
  5. Removes selected zones from current theme only
- **Limitation**: Cannot remove from multiple themes simultaneously

#### Theme Deletion
- **Location**: `/themes` page
- **Process**:
  1. Click delete button on theme card
  2. Confirmation dialog appears
  3. Confirm deletion
- **Effect**: Removes theme from collection, zones remain unchanged

#### Theme Editing
- **Name Editing**: Click pencil icon on theme cards
- **Inline Editing**: Direct name modification
- **Auto-save**: Changes saved immediately

## Implementation Phases

### Phase 1: Database & Core Models (Foundation)
**Testable Outcome**: Theme CRUD operations work via API endpoints

#### Tasks:
1. **Create Theme Model** (`src/lib/models/theme.ts`)
   - Define ITheme interface
   - Create Mongoose schema
   - Add indexes for performance
   - Virtual fields for zone_count

2. **Create Theme API Routes**
   - `POST /api/themes` - Create theme
   - `GET /api/themes` - List themes with zone counts
   - `GET /api/themes/[id]` - Get theme with zones
   - `PUT /api/themes/[id]` - Update theme name
   - `DELETE /api/themes/[id]` - Delete theme
   - `POST /api/themes/[id]/zones` - Add zones to theme
   - `DELETE /api/themes/[id]/zones` - Remove zones from theme

3. **Zone-Theme Relationship Queries**
   - Add theme lookup functions
   - Modify zone queries to include theme data
   - Ensure only synced zones are eligible

#### Testing:
- Unit tests for theme model validation
- API endpoint tests with Postman/curl
- Database queries return correct zone counts
- Zone eligibility filtering works correctly

### Phase 2: Theme Management UI (Core Pages)
**Testable Outcome**: Basic theme management works in browser

#### Tasks:
1. **Create Theme List Page** (`src/app/themes/page.tsx`)
   - Theme cards grid layout
   - Search and filter functionality
   - Create theme button and modal
   - Delete confirmation dialogs
   - Theme name inline editing

2. **Create Theme Detail Page** (`src/app/themes/[id]/page.tsx`)
   - Display theme zones
   - Reuse existing zone filtering components
   - Zone selection controls
   - Add/remove zones functionality

3. **Theme Components**
   - `ThemeCard` component
   - `ThemeCreateModal` component
   - `ThemeDeleteConfirmation` component
   - `ThemeZoneManager` component

4. **Navigation Integration**
   - Add themes link to sidebar
   - Update routing structure

#### Testing:
- Navigate to `/themes` page loads correctly
- Create new themes via UI
- Edit theme names inline
- Delete themes with confirmation
- Theme detail pages show correct zones
- All UI interactions work without errors

### Phase 3: Zone Integration (Badge System)
**Testable Outcome**: Zone cards show theme badges throughout app

#### Tasks:
1. **Modify Zone Card Components**
   - Add theme badges to existing zone cards
   - Update `ZoneCard` component in zones list
   - Ensure badges appear on all zone displays

2. **Theme Badge Component**
   - `ThemeBadge` component with click navigation
   - Styling consistent with existing badge system
   - Responsive design for multiple badges

3. **Zone Data Enhancement**
   - Modify zone API responses to include theme data
   - Update zone queries to join theme information
   - Ensure performance with proper indexing

#### Testing:
- Zone cards display theme badges correctly
- Badges are clickable and navigate to theme detail
- Badge styling matches app design system
- Performance remains acceptable with theme data

### Phase 4: Advanced Operations (Zone Management)
**Testable Outcome**: All zone addition/removal methods work

#### Tasks:
1. **Zones Page Integration**
   - Add "Add to Theme" button to zones page
   - Create theme selection modal
   - Integrate with existing zone selection system
   - Handle bulk zone operations

2. **Campaign Zone Copy Feature**
   - Add "Copy Zones to Theme" button to campaigns page
   - Implement automatic theme creation
   - Handle campaign-to-theme zone copying

3. **Theme Cloning Feature**
   - Add clone button to theme cards
   - Implement theme duplication logic
   - Handle name conflicts and validation

4. **Advanced Zone Management**
   - "Select All Displayed Zones" functionality
   - Bulk zone removal from themes
   - Enhanced filtering and search

#### Testing:
- Add zones to themes from zones page
- Copy campaign zones to new themes
- Clone existing themes successfully
- Bulk operations work correctly
- All edge cases handled properly

### Phase 5: Polish & Optimization (Production Ready)
**Testable Outcome**: Feature is production-ready with good UX

#### Tasks:
1. **Performance Optimization**
   - Database query optimization
   - Implement proper caching
   - Lazy loading for large theme lists
   - Pagination if needed

2. **Error Handling & Validation**
   - Comprehensive error messages
   - Input validation and sanitization
   - Graceful failure handling
   - Loading states and feedback

3. **UI/UX Polish**
   - Consistent styling with app theme
   - Responsive design testing
   - Accessibility improvements
   - Animation and transitions

4. **Documentation & Testing**
   - Update API documentation
   - Add comprehensive test coverage
   - User guide documentation
   - Performance benchmarking

#### Testing:
- Load testing with large datasets
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance
- User acceptance testing

## Technical Implementation Details

### Database Schema Implementation
```typescript
// src/lib/models/theme.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITheme extends Document {
  mongo_id: string;
  name: string;
  description?: string;
  zone_ids: number[]; // Broadstreet zone IDs only
  created_at: Date;
  updated_at: Date;
  zone_count: number; // Virtual field
}

const ThemeSchema = new Schema<ITheme>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  zone_ids: [{
    type: Number,
    required: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for zone count
ThemeSchema.virtual('zone_count').get(function() {
  return this.zone_ids?.length || 0;
});

// Indexes for performance
ThemeSchema.index({ name: 1 });
ThemeSchema.index({ zone_ids: 1 });
ThemeSchema.index({ created_at: -1 });
```

### API Route Structure
```
/api/themes/
├── route.ts (GET, POST)
├── [id]/
│   ├── route.ts (GET, PUT, DELETE)
│   └── zones/
│       └── route.ts (POST, DELETE)
└── search/
    └── route.ts (GET with query params)
```

### Component Architecture
```
src/app/themes/
├── page.tsx (Theme list)
├── [id]/
│   └── page.tsx (Theme detail)
├── components/
│   ├── ThemeCard.tsx
│   ├── ThemeCreateModal.tsx
│   ├── ThemeDeleteConfirmation.tsx
│   ├── ThemeZoneManager.tsx
│   └── ThemeBadge.tsx
└── hooks/
    ├── useThemes.ts
    └── useThemeZones.ts
```

### Zone Eligibility Query
```typescript
// Only synced zones are eligible for themes
const eligibleZones = await Zone.find({
  broadstreet_id: { $exists: true, $ne: null },
  synced_with_api: true,
  network_id: networkId
}).lean();
```

## Development Guidelines

### Code Standards
- **No mockups**: Production code only
- **No fallbacks**: Either it works or it fails clearly
- **Clean implementation**: Remove any legacy/redundant code
- **Next.js 15**: `params` and `searchParams` must be awaited
- **Server-side pages**: Client components wrapped in Suspense
- **Design consistency**: Maintain existing app design patterns
- **Component reuse**: Leverage existing UI components

### Database Management
- **No migrations required**: Can drop database and resync for major changes
- **Clean start preferred**: For structural changes, prefer fresh database
- **Sync preservation**: Ensure Broadstreet sync data integrity

### Testing Strategy
Each phase must be fully testable before proceeding:
1. **Unit tests**: Model validation and business logic
2. **Integration tests**: API endpoints and database operations
3. **UI tests**: Component rendering and user interactions
4. **E2E tests**: Complete user workflows
5. **Performance tests**: Load testing with realistic data

### Success Criteria
- ✅ Themes can be created, edited, and deleted
- ✅ Only synced zones can be added to themes
- ✅ Zone cards show theme badges throughout the app
- ✅ All three zone addition methods work correctly
- ✅ Zone removal from themes works as specified
- ✅ Campaign zone copying creates themes automatically
- ✅ Theme cloning duplicates zones correctly
- ✅ Search and filtering work on themes page
- ✅ Performance is acceptable with large datasets
- ✅ UI is consistent with existing app design
- ✅ All error cases are handled gracefully


