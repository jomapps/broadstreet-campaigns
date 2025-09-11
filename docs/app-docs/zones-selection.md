# Zones Selection Feature

## Overview
The Zones Selection feature allows users to select specific zones for placement operations. This feature provides bulk selection controls and filtering capabilities to manage zone selections efficiently.

## Feature Requirements

### Core Functionality
- **Individual Zone Selection**: Users can click on zone cards to select/deselect them individually
- **Bulk Selection Controls**: "Select All Visible" and "Deselect All Visible" buttons that operate on currently displayed zones
- **Filter Integration**: Zone selection works with existing filters (network, size, search)
- **Visual Indicators**: Selected zones are visually distinguished with blue styling and "✓ Selected" badge

### UI Components

#### Zone Selection Controls Card
- **Location**: `/zones` page, between size filters and zone list
- **Components**:
  - "Select All Visible" button - selects all zones currently displayed after filtering
  - "Deselect All Visible" button - deselects all zones currently displayed after filtering
  - "Show only selected zones" checkbox - filters to show only selected zones
- **State Management**: Buttons are disabled when no zones are visible or no zones are selected

#### Zone Cards
- **Selection State**: Clickable cards with visual feedback for selected state
- **Styling**: Selected zones have blue border, blue background, and "✓ Selected" badge
- **Interaction**: Click to toggle selection state

#### Sidebar Indicator
- **Location**: Bottom of sidebar "Filters" card
- **Display**: Shows count of selected zones and "Filtered" badge when "Show only selected" is active
- **Actions**: Clear selection button (X) to reset all zone selections

### Filtering Logic Priority
The filtering system follows this hierarchy (highest to lowest priority):
1. **Only Selected Filter** - Shows only selected zones when enabled
2. **Zone Guide Filters** - Size type filters (SQ, PT, LS, CS)
3. **Search Filter** - Text-based search across zone properties

### Data Management

#### State Storage
- **Selected Zones**: Array of zone IDs stored in `localStorage`
- **Show Only Selected**: Boolean flag stored in `localStorage`
- **Persistence**: State persists across browser sessions

#### Sync Reset Behavior
- **Trigger**: Any sync operation with Broadstreet (download or upload)
- **Action**: All zone selections are cleared automatically
- **Implementation**: `clearAllZoneSelections()` utility function called in sync API routes

### Technical Implementation

#### Context Integration
- **FilterContext**: Extended with zone selection state management
- **Actions**: `selectZones`, `deselectZones`, `toggleZoneSelection`, `clearZoneSelection`
- **Storage Keys**: `SELECTED_ZONES`, `SHOW_ONLY_SELECTED`

#### Component Architecture
- **ZoneFiltersWrapper**: Manages filtering logic and passes filtered zones to child components
- **ZoneSelectionControls**: Handles bulk selection controls and "show only selected" toggle
- **ZonesList**: Displays filtered zones with individual selection capability
- **FiltersCard**: Shows selection indicator in sidebar

#### API Integration
- **Sync Routes**: All sync endpoints clear zone selections before processing
- **Affected Routes**: `/api/sync/all`, `/api/sync/local-all`, `/api/sync/zones`, `/api/sync/campaigns`

## Implementation Status

### ✅ Completed
- [x] FilterContext extension with zone selection state
- [x] ZoneSelectionControls component with bulk selection buttons
- [x] Zone card selection UI with visual indicators
- [x] Sidebar indicator for selected zones count
- [x] Filtering logic with proper priority hierarchy
- [x] localStorage persistence for selection state
- [x] Sync reset functionality in API routes
- [x] ZoneFiltersWrapper refactoring for proper filtering

### 🔧 In Progress
- [ ] Testing and validation of selection functionality
- [ ] Bug fixes for "Select All Visible" behavior

### 🐛 Known Issues
- **Issue**: "Select All Visible" and "Deselect All Visible" buttons select all zones in database instead of only visible zones
- **Root Cause**: ZoneSelectionControls receives unfiltered zones instead of filtered zones
- **Status**: Being fixed by refactoring ZoneFiltersWrapper to handle filtering logic

### 📋 Pending Tasks
- [ ] Fix "Select All Visible" to work with filtered zones only
- [ ] Test partial deselect functionality
- [ ] Validate sync reset behavior
- [ ] End-to-end testing with Playwright MCP

## Testing Checklist

### Manual Testing
- [ ] Individual zone selection/deselection
- [ ] "Select All Visible" with various filter combinations
- [ ] "Deselect All Visible" with partial selections
- [ ] "Show only selected zones" toggle functionality
- [ ] Sidebar indicator updates correctly
- [ ] Selection persistence across page refreshes
- [ ] Sync operations clear selections
- [ ] Filter priority hierarchy works correctly

### Automated Testing
- [ ] Playwright MCP tests for selection functionality
- [ ] Filter integration tests
- [ ] State persistence tests

