# ThemeSelector Component

## Overview
The ThemeSelector component provides theme filtering functionality in the sidebar. It manages theme loading, selection, and validation with a simplified approach that eliminates problematic auto-detection logic.

## Location
`src/components/themes/ThemeSelector.tsx`

## Key Features

### Loading Strategy
- **Initial Load**: Automatically fetches themes once when component mounts using `useEffect`
- **Manual Refresh**: User-triggered refresh via refresh button only
- **No Auto-Detection**: Removed all automatic syncing on dropdown interactions

### Display States
1. **Loading State**: Shows spinner during initial load or refresh
2. **Error State**: Shows error message with retry button
3. **No Themes State**: Shows "NO THEMES FOUND" message with icon
4. **Normal State**: Shows dropdown selector with available themes

### Selected Theme Validation
- Validates selected theme exists after refresh operations
- Automatically clears selection if theme no longer exists
- Logs selection clearing for debugging purposes

### Zone Selection Integration
- Theme selection automatically updates `selectedZones` in filter store
- Theme `zone_ids` (numbers) are converted to strings for consistency
- Zone cards use `getEntityId()` for proper selection key matching
- Mutual exclusivity: selecting theme replaces current zone selection

## Implementation Details

### Initial Load Logic
```typescript
useEffect(() => {
  const loadInitialThemes = async () => {
    try {
      setLoading('themes', true);
      setError('themes', null);

      const response = await fetch('/api/themes');
      if (!response.ok) {
        throw new Error(`Failed to fetch themes: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const initialThemes = data.themes || [];
      setThemes(initialThemes);
    } catch (error) {
      console.error('Error loading initial themes:', error);
      setError('themes', error instanceof Error ? error.message : 'Failed to load themes');
    }
  };

  loadInitialThemes();
}, []); // Only run once on mount
```

### Manual Refresh Logic
```typescript
const refreshThemes = async () => {
  try {
    setIsRefreshing(true);
    setError('themes', null);

    const response = await fetch('/api/themes');
    if (!response.ok) {
      throw new Error(`Failed to refresh themes: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const refreshedThemes = data.themes || [];
    setThemes(refreshedThemes);

    // Check if currently selected theme still exists
    if (selectedTheme) {
      const themeStillExists = refreshedThemes.some((theme: any) => theme._id === selectedTheme._id);
      if (!themeStillExists) {
        // Clear the selected theme if it no longer exists
        setSelectedTheme(null);
        console.log('Selected theme no longer exists, clearing selection');
      }
    }
  } catch (error) {
    console.error('Error refreshing themes:', error);
    setError('themes', error instanceof Error ? error.message : 'Failed to refresh themes');
  } finally {
    setIsRefreshing(false);
  }
};
```

### Conditional Rendering
- **Error State**: Shows error message with refresh button
- **No Themes**: Shows centered "NO THEMES FOUND" message instead of empty dropdown
- **Has Themes**: Shows normal dropdown selector with theme options

## State Management
- Uses Zustand entity store for theme data management
- Uses filter store for selected theme state
- Local state for refresh loading indicator

## API Integration
- Fetches from `/api/themes` endpoint
- Handles HTTP errors with proper error messages
- Validates response structure

## User Experience
- Fast initial load (themes are typically low in number)
- Clear visual feedback for all states
- Manual control over data refresh
- Automatic cleanup of invalid selections

## Cross-references
- [Sidebar Filters](../frontend/sidebar-filters.md)
- [Zustand Implementation](../implementation/zustand-implementation.md)
- [Entity Store](../implementation/entity-store.md)
