/**
 * Zone Selection Helper Functions
 * 
 * These functions handle clearing zone selections when syncing with Broadstreet API.
 * According to the requirements, zone selections should be reset whenever we sync
 * with Broadstreet (download or upload).
 */

/**
 * Clear zone selections from localStorage
 * This function removes all stored zone selection data
 */
export function clearZoneSelectionsFromStorage(): void {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      // Server environment: nothing to clear
      return;
    }
    window.localStorage.removeItem('broadstreet_selected_zones');
    window.localStorage.removeItem('broadstreet_show_only_selected');
    console.log('Zone selections cleared from localStorage');
  } catch (error) {
    console.error('Error clearing zone selections from localStorage:', error);
  }
}

/**
 * Clear zone selections from sessionStorage (if used)
 * This function removes all stored zone selection data from sessionStorage
 */
export function clearZoneSelectionsFromSession(): void {
  try {
    if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
      // Server environment: nothing to clear
      return;
    }
    window.sessionStorage.removeItem('broadstreet_selected_zones');
    window.sessionStorage.removeItem('broadstreet_show_only_selected');
    console.log('Zone selections cleared from sessionStorage');
  } catch (error) {
    console.error('Error clearing zone selections from sessionStorage:', error);
  }
}

/**
 * Clear all zone selection data
 * This function clears both localStorage and sessionStorage
 */
export function clearAllZoneSelections(): void {
  clearZoneSelectionsFromStorage();
  clearZoneSelectionsFromSession();
}

/**
 * Check if zone selections exist in storage
 * @returns true if zone selections exist, false otherwise
 */
export function hasZoneSelections(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return false;
    }
    const selectedZones = window.localStorage.getItem('broadstreet_selected_zones');
    const showOnlySelected = window.localStorage.getItem('broadstreet_show_only_selected');
    
    return !!(selectedZones || showOnlySelected);
  } catch (error) {
    console.error('Error checking zone selections:', error);
    return false;
  }
}

/**
 * Get current zone selections from storage
 * @returns object with selectedZones array and showOnlySelected boolean
 */
export function getZoneSelectionsFromStorage(): {
  selectedZones: string[];
  showOnlySelected: boolean;
} {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return { selectedZones: [], showOnlySelected: false };
    }
    const selectedZonesStr = window.localStorage.getItem('broadstreet_selected_zones');
    const showOnlySelectedStr = window.localStorage.getItem('broadstreet_show_only_selected');
    
    const selectedZones = selectedZonesStr ? JSON.parse(selectedZonesStr) : [];
    const showOnlySelected = showOnlySelectedStr ? JSON.parse(showOnlySelectedStr) : false;
    
    return { selectedZones, showOnlySelected };
  } catch (error) {
    console.error('Error getting zone selections from storage:', error);
    return { selectedZones: [], showOnlySelected: false };
  }
}
