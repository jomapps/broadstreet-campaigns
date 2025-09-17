# Universal Entity Card Design Reference

This document defines the comprehensive design and implementation specification for a universal entity card component across the Broadstreet Campaigns application. This card will replace all existing entity-specific card implementations to ensure consistency and maintainability.

## Design Goals
- **Unification**: Single card component for all entity types (networks, advertisers, advertisements, campaigns, placements, zones)
- **Flexibility**: Support all current card variations and use cases
- **Consistency**: Standardized styling, behavior, and interaction patterns
- **Accessibility**: Proper ARIA labels, keyboard navigation, and screen reader support
- **Performance**: Optimized rendering with minimal re-renders

## 1. Universal Entity Card Component

### Core Props Interface

```typescript
interface UniversalEntityCardProps {
  // === REQUIRED PROPS ===
  title: string;                          // Primary entity name/title

  // === IDENTIFICATION ===
  broadstreet_id?: number;                // Broadstreet API ID (follows ID naming standards)
  mongo_id?: string;                      // MongoDB ObjectId as string
  entityType?: 'network' | 'advertiser' | 'advertisement' | 'campaign' | 'placement' | 'zone' | 'theme';

  // === VISUAL CONTENT ===
  imageUrl?: string;                      // Primary image/logo URL
  imageFallback?: string;                 // Fallback text when image fails (defaults to first letter of title)
  subtitle?: string;                      // Secondary text below title
  description?: string;                   // Longer description text

  // === NAVIGATION ===
  titleUrl?: string;                      // URL for title link
  onCardClick?: () => void;               // Whole card click handler

  // === STATE MANAGEMENT ===
  isSelected?: boolean;                   // Selection state
  onSelect?: (checked: boolean) => void;  // Selection change handler
  showCheckbox?: boolean;                 // Whether to show selection checkbox

  // === ENTITY STATUS ===
  isLocal?: boolean;                      // Local-only entity flag
  isActive?: boolean;                     // Active/inactive status

  // === TAGS AND BADGES ===
  topTags?: TagConfig[];                  // Tags displayed at top
  bottomTags?: TagConfig[];               // Tags displayed at bottom
  statusBadge?: BadgeConfig;              // Primary status badge

  // === DYNAMIC DATA DISPLAY ===
  displayData?: DisplayDataItem[];        // Key-value pairs for entity details
  parentsBreadcrumb?: ParentCrumb[];      // Parent path displayed under title as breadcrumb

  // === ACTIONS ===
  actionButtons?: ActionButtonConfig[];   // Bottom action buttons
  onDelete?: () => void;                  // Delete handler (shows trash icon)
  onCopyToTheme?: (themeName: string, description?: string) => Promise<void>;

  // === STYLING ===
  className?: string;                     // Additional CSS classes
  variant?: 'default' | 'compact' | 'detailed'; // Card size variant

  // === ACCESSIBILITY ===
  ariaLabel?: string;                     // Custom aria-label
  testId?: string;                        // data-testid for testing
}
```

### Supporting Type Definitions

```typescript
interface TagConfig {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  color?: string;                         // Custom color override
  icon?: React.ComponentType<{ className?: string }>;
}

interface BadgeConfig {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
  icon?: React.ComponentType<{ className?: string }>;
}

interface DisplayDataItem {
  label?: string;                         // Optional label (can be empty for value-only display)
  value: string | number | Date | React.ReactNode;
  type?: 'string' | 'number' | 'date' | 'badge' | 'progress' | 'custom';
  format?: string;                        // Date format string or number format
  className?: string;                     // Custom styling for this item
}

interface ActionButtonConfig {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  loading?: boolean;
}

interface ParentCrumb {
  name: string;                          // Parent entity name (will be truncated to 10 chars)
  broadstreet_id?: number;               // If present, shown in parentheses
  mongo_id?: string;                     // Shown if no broadstreet_id; trimmed to last 8 chars with ellipsis
}
```

## 2. Card Layout and Display Order

### Visual Hierarchy (Top to Bottom)

Each section is conditionally rendered based on available data:

1. **Header Row** (Always present)
   - **Left**: Selection checkbox (if `showCheckbox === true`) + `EntityIdBadge` (Broadstreet then Mongo)
   - **Right**: Local badge (if `isLocal === true`) + Delete icon (if `onDelete` provided)
   - **Spacing**: Minimal vertical spacing to the next row; when no image, use tightened gap

2. **Image Section** (Optional)
   - **Size**: 300px width, auto height, max 200px height
   - **Behavior**: If `imageUrl` missing or fails to load, omit the image block entirely (no icon/placeholder) to save space

3. **Top Tags Row** (Optional)
   - **Layout**: Horizontal flex wrap
   - **Spacing**: 4px gap between tags
   - **Max**: 5 tags (overflow hidden with "+" indicator)
   - **Status Badge**: Merge `statusBadge` here; there is no separate status row

4. **Title Section** (Required)
   - **Primary**: Entity title (clickable if `titleUrl` provided)
   - **Display Rule**: Title must not be cut or shortened. It should attempt to fit on one line by reducing font size down to a minimum threshold; if still too long, it should wrap to the next line(s). No truncation with ellipsis.
   - **Typography**: Start from a larger size (e.g., 20px) and auto-reduce to a minimum (e.g., 14px) before wrapping. Bold weight.

4a. **Parents Breadcrumb Row** (Optional)
   - **Data**: `parentsBreadcrumb: ParentCrumb[]`
   - **Format**: `Name (ID) > Name (ID) > Name`
   - **Name Truncation**: Max 10 characters with ellipsis (except special network rule below)
   - **ID Rule**: Show one ID per crumb: `broadstreet_id` if present, else `mongo_id` (trim to last 8 chars with leading ellipsis)
   - **Typography**: very small text, muted color; minimal spacing under the title; allow wrapping to next line as needed
   - **Network Shortening Rule**: For network crumbs, derive the display name by taking the last segment after `-`, stripping spaces, and uppercasing (e.g., `FASH Medien Verlag GmbH - SCHWULISSIMO` → `SCHWULISSIMO`; `... - Travel M` → `TRAVELM`). This is applied at render time and does not require changing source data.

5. **Subtitle Section** (Optional)
   - **Typography**: text-sm text-gray-600
   - **Truncation**: Single line with ellipsis

6. **ID Badges Row** (Conditional)
   - **Uses**: Existing `EntityIdBadge` component
   - **Display**: Broadstreet ID + MongoDB ID (if available)
   - **Styling**: Follows current badge patterns

7. **Status Badge** (Optional)
   - **Position**: Below ID badges
   - **Purpose**: Primary status indicator (Active, Inactive, etc.)

8. **Description Section** (Optional)
   - **Typography**: text-sm text-gray-700
   - **Truncation**: 3 lines with "Show more" expansion
   - **Max Height**: 4.5rem (3 lines)

9. **Display Data Section** (Optional)
   - **Layout**: Compact mini-cards in a 4-column responsive grid (2 on small, 3 on medium, 4 on large)
   - **Formatting**:
     - Dates: dd/mm/yy (en-GB); any date-like values are normalized
     - Numbers: localized formatting; currency uses Euro symbol (string values replace `$` with `€`; numeric with `format: 'currency'|'eur'|'€'` render via Intl EUR)
     - Progress: numeric 0–100 renders as a progress bar with percentage
   - **Value Fitting**: Values auto-shrink text between 14px and 10px to avoid overflow; otherwise wrap if needed
   - **Spacing**: Tight padding; labels small text; values bold

10. **Action Buttons Row** (Optional)
    - **Layout**: Horizontal flex, left-aligned
    - **Spacing**: 8px gap between buttons
    - **Max**: 3 primary buttons (overflow to dropdown menu)

11. **Bottom Tags Row** (Optional)
    - **Layout**: Same as top tags
    - **Purpose**: Secondary categorization

12. **Copy to Theme Button** (Optional)
    - **Condition**: Only if `onCopyToTheme` provided
    - **Style**: Ghost button, full width
    - **Icon**: Copy icon with text
## 3. Interaction Patterns and Click Hierarchy

### Click Event Priority (Highest to Lowest)

1. **Delete Button** (Highest Priority)
   - **Trigger**: Trash icon click
   - **Behavior**: Stops all event propagation
   - **Confirmation**: Shows confirmation dialog
   - **Styling**: Red hover state

2. **Action Buttons** (High Priority)
   - **Trigger**: Individual button clicks
   - **Behavior**: Stops event propagation to card
   - **States**: Normal, hover, disabled, loading

3. **Selection Checkbox** (Medium Priority)
   - **Trigger**: Checkbox click or label click
   - **Behavior**: Toggles selection, stops propagation
   - **Visual**: Updates card border/background

4. **Title Link** (Medium Priority)
   - **Trigger**: Title text click (if `titleUrl` provided)
   - **Behavior**: Navigation, stops propagation
   - **Styling**: Underline on hover

5. **Card Click** (Lowest Priority)
   - **Trigger**: Click anywhere else on card
   - **Behavior**: Executes `onCardClick` if provided
   - **Fallback**: Toggles selection if `onSelect` provided
   - **Visual**: Subtle hover effect on entire card

### Keyboard Navigation

- **Tab Order**: Checkbox → Title Link → Action Buttons → Delete Button
- **Enter/Space**: Activates focused element
- **Arrow Keys**: Navigate between cards in grid (future enhancement)

## 4. Styling and State Management

### Card State Classes (Using Existing `cardStateClasses`)

```typescript
// Existing utility function integration
const cardClasses = cardStateClasses({
  isLocal: !!isLocal,
  isSelected: !!isSelected
});

// State combinations:
// - Default: border-gray-200 bg-white
// - Selected: border-blue-400 bg-blue-50
// - Local: border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100
// - Local + Selected: border-blue-400 bg-blue-100
```

### Local Entity Indicators

- **Local Badge**: Small "LOCAL" badge in top-left corner
- **Card Styling**: Orange-tinted background gradient
- **ID Display**: Shows MongoDB ID with "DB" prefix
- **Delete Button**: Only visible for local entities

### Responsive Behavior

- **Mobile (< 640px)**: Single column, compact spacing
- **Tablet (640px - 1024px)**: 2-column grid
- **Desktop (> 1024px)**: 3-4 column grid based on container
- **Image**: Scales proportionally, maintains aspect ratio
## 5. Integration with Existing Components

### Required Dependencies

```typescript
// Existing UI components to reuse
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EntityIdBadge } from '@/components/ui/entity-id-badge';
import { cardStateClasses } from '@/lib/ui/cardStateClasses';
import { getEntityId } from '@/lib/utils/entity-helpers';
```

### Entity Type Icons (Optional Enhancement)

```typescript
const entityIcons = {
  network: Globe,
  advertiser: Users,
  advertisement: Image,
  campaign: Calendar,
  placement: Target,
  zone: Target,
  theme: Folder
};
```

## 6. Implementation Feasibility Analysis

### ✅ **FEASIBLE ASPECTS**

1. **Props Structure**: Well-designed, covers all current use cases
2. **Existing Integration**: Leverages current `cardStateClasses`, `EntityIdBadge`
3. **ID Management**: Follows established `broadstreet_id`/`mongo_id` patterns
4. **State Management**: Compatible with existing selection patterns
5. **Styling**: Builds on current Tailwind/shadcn patterns

### ⚠️ **POTENTIAL CHALLENGES**

1. **Migration Complexity**: 6+ existing card implementations to replace
2. **Performance**: Large prop interface may cause unnecessary re-renders
3. **Bundle Size**: Single component handling all cases might be large
4. **Testing**: Comprehensive testing needed for all combinations

### 🔧 **RECOMMENDED ENHANCEMENTS**

1. **Memoization Strategy**
   ```typescript
   const UniversalEntityCard = React.memo(({ ...props }) => {
     // Implementation
   }, (prevProps, nextProps) => {
     // Custom comparison for performance
   });
   ```

2. **Prop Validation**
   ```typescript
   // Runtime prop validation for development
   if (process.env.NODE_ENV === 'development') {
     validateProps(props);
   }
   ```

3. **Accessibility Improvements**
   - ARIA landmarks for card sections
   - Screen reader announcements for state changes
   - High contrast mode support
   - Focus management for keyboard users

4. **Performance Optimizations**
   - Lazy loading for images
   - Virtual scrolling for large lists
   - Intersection Observer for animations

## 7. Logical Issues and Corrections

### ❌ **IDENTIFIED ISSUES**

1. **Missing Error Handling**
   - No image loading error states
   - No action button error states
   - No network error handling

2. **Incomplete Click Hierarchy**
   - Missing preventDefault/stopPropagation details
   - No handling for disabled states
   - Unclear behavior when multiple handlers exist

3. **Accessibility Gaps**
   - Missing ARIA labels for complex interactions
   - No keyboard navigation between cards
   - No screen reader announcements

4. **Type Safety Issues**
   - `displayData.value` too broad (any React node)
   - Missing validation for required prop combinations
   - No runtime type checking

### ✅ **CORRECTIONS APPLIED**

1. **Enhanced Type Safety**
   ```typescript
   interface DisplayDataItem {
     label?: string;
     value: string | number | Date | React.ReactNode;
     type?: 'string' | 'number' | 'date' | 'badge' | 'progress' | 'custom';
     format?: string;
     className?: string;
     ariaLabel?: string; // Added for accessibility
   }
   ```

2. **Improved Click Handling**
   ```typescript
   const handleCardClick = (e: React.MouseEvent) => {
     // Only trigger if not clicking on interactive elements
     if (e.target === e.currentTarget || !isInteractiveElement(e.target)) {
       onCardClick?.();
     }
   };
   ```

3. **Error Boundaries**
   - Wrap component in error boundary
   - Graceful degradation for missing data
   - Fallback UI for failed image loads

## 8. Migration Strategy

### Phase 1: Core Component (Week 1)
- Implement basic UniversalEntityCard
- Support title, image, IDs, basic styling
- Replace NetworkCard as proof of concept

### Phase 2: Feature Parity (Week 2)
- Add all props and display options
- Implement click hierarchy
- Replace AdvertiserCard and CampaignCard

### Phase 3: Advanced Features (Week 3)
- Add accessibility features
- Implement performance optimizations
- Replace remaining cards (PlacementCard, ZoneCard, etc.)

### Phase 4: Polish and Testing (Week 4)
- Comprehensive testing suite
- Performance benchmarking
- Documentation and examples

## 9. Testing Requirements

### Unit Tests
- All prop combinations
- Click event handling
- State management
- Accessibility features

### Integration Tests
- Card in different contexts
- Performance with large datasets
- Keyboard navigation
- Screen reader compatibility

### Visual Regression Tests
- All entity types
- All state combinations
- Responsive breakpoints
- Dark/light mode support

## 10. Success Metrics

- **Code Reduction**: 70%+ reduction in card-related code
- **Consistency**: 100% visual consistency across entity types
- **Performance**: No degradation in render times
- **Accessibility**: WCAG 2.1 AA compliance
- **Developer Experience**: Reduced implementation time for new entity cards


