# Sidebar Filters

## Theme Filter Rules
- Mutual exclusivity: selecting a theme replaces currently selected zones with the theme’s zones
- Cannot select a theme without displaying its zones
- Network selection should not reset when clearing other filters

## Theme Filter Loading Behavior
- **Initial Load**: Automatically fetches themes once when component mounts
- **Manual Refresh**: User clicks refresh button to reload theme data
- **No Auto-Detection**: Removed all automatic syncing/fetching on dropdown interactions
- **Error Handling**: Shows error state with retry option when API calls fail

## Display States
- **Loading**: Shows loading spinner during initial load
- **No Themes**: Shows "NO THEMES FOUND" message with icon when 0 themes available
- **Error**: Shows error message with refresh button when API calls fail
- **Normal**: Shows dropdown selector when themes are available

## Selected Theme Validation
- When refreshing themes, checks if currently selected theme still exists
- Automatically clears selected theme if it no longer exists in refreshed data
- Logs theme selection clearing for debugging

## Implementation notes
- Follow Zustand patterns: ../implementation/zustand-implementation.md
- Use dropdowns when there are many options
- Initial load uses `useEffect` with empty dependency array (runs once on mount)
- Manual refresh only triggered by user clicking refresh button

## Cross-links
- UI preferences: ../conventions/ui-preferences.md
- State management: ./state-management.md

