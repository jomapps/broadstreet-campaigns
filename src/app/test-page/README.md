# Universal Entity Card Test Page

This test page demonstrates the Universal Entity Card component with sample data from all entity types in the Broadstreet Campaigns application.

## Purpose

- **Component Testing**: Validate the Universal Entity Card implementation
- **Visual Verification**: Ensure consistent styling across all entity types
- **Functionality Testing**: Test interactions, selections, and click handlers
- **Design Validation**: Verify the card design matches specifications

## Features

### Entity Type Filter
- Dropdown to filter cards by entity type
- "All Entity Types" option to show all cards
- Real-time filtering without page reload

### Sample Data
The page includes realistic sample data for:
- **Networks**: Premium ad networks with logos and statistics
- **Advertisers**: Companies with branding and campaign data
- **Advertisements**: Creative assets with performance metrics
- **Campaigns**: Marketing campaigns with budgets and timelines
- **Placements**: Ad placements with relationship data
- **Zones**: Ad zones with size and performance info
- **Themes**: Zone collections with metadata

### Interactive Features
- **Card Selection**: Checkbox selection with visual feedback
- **Click Handlers**: Alert dialogs for testing click events
- **State Management**: Selection counter and clear functionality
- **Local Entity Simulation**: Some cards marked as local-only
- **Delete Functionality**: Delete buttons for local entities

## Card Variations Tested

### Visual States
- ✅ Default state (synced entities)
- ✅ Selected state (blue border/background)
- ✅ Local state (orange gradient background)
- ✅ Local + Selected state (combined styling)

### Content Variations
- ✅ With images (network, advertiser, advertisement)
- ✅ Without images (fallback icons/initials)
- ✅ With all optional fields populated
- ✅ With minimal required fields only
- ✅ With various tag combinations
- ✅ With different action button sets

### Interaction Patterns
- ✅ Card click handlers
- ✅ Checkbox selection
- ✅ Action button clicks
- ✅ Delete button functionality
- ✅ Title link navigation
- ✅ Copy to theme functionality

## Usage

1. Navigate to `/test-page` (not in main navigation)
2. Use the entity type filter to focus on specific types
3. Click cards to test interaction handlers
4. Select checkboxes to test selection state
5. Try action buttons and delete functionality

## Implementation Notes

### Component Props
The test page demonstrates all major prop combinations:
- Required props (title)
- Optional visual content (images, descriptions)
- State management (selection, local status)
- Interactive elements (buttons, handlers)
- Accessibility features (ARIA labels, test IDs)

### Styling Integration
- Uses existing `cardStateClasses` utility
- Integrates with `EntityIdBadge` component
- Follows established color schemes
- Responsive grid layout

### Data Structure
Sample data follows the same patterns as real entity data:
- Proper ID field naming (`broadstreet_id`, `mongo_id`)
- Realistic field values and relationships
- Appropriate entity type indicators
- Consistent date formatting

## Testing Checklist

- [ ] All entity types render correctly
- [ ] Filter dropdown works properly
- [ ] Card selection updates counter
- [ ] Click handlers trigger alerts
- [ ] Local badges appear for local entities
- [ ] Delete buttons only show for local entities
- [ ] Images load with proper fallbacks
- [ ] Responsive layout works on mobile
- [ ] Accessibility features function
- [ ] No console errors or warnings

## Future Enhancements

- Add keyboard navigation testing
- Include error state demonstrations
- Add loading state simulations
- Test with very long content
- Add dark mode variations
- Include performance benchmarking
