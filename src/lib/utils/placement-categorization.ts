import { ZoneSize } from '../types/broadstreet';
import { parseZoneName } from './zone-parser';
import { parseAdvertisementName } from './advertisement-parser';

export interface PlacementCombination {
  zone: {
    id: string | number;
    name: string;
    [key: string]: unknown;
  };
  advertisement: {
    id: string | number;
    name: string;
    [key: string]: unknown;
  };
  sizeType?: ZoneSize;
}

export interface CategorizedPlacements {
  SQ: PlacementCombination[];
  LS: PlacementCombination[];
  PT: PlacementCombination[];
  IGNORED: PlacementCombination[];
}

/**
 * Categorize placement combinations by size type matching
 * Creates all zone × advertisement combinations and categorizes them by matching size types
 */
export function categorizePlacementsBySize(
  zones: Array<{ id?: string | number; name: string; [key: string]: unknown }>,
  advertisements: Array<{ id?: string | number; name: string; [key: string]: unknown }>
): CategorizedPlacements {
  const categories: CategorizedPlacements = {
    SQ: [],
    LS: [],
    PT: [],
    IGNORED: []
  };

  // Create all zone × advertisement combinations
  zones.forEach(zone => {
    advertisements.forEach(advertisement => {
      const zoneParsed = parseZoneName(zone.name);
      const adParsed = parseAdvertisementName(advertisement.name);
      
      const combination: PlacementCombination = {
        zone: {
          id: zone.id || (zone as any).broadstreet_id || (zone as any).mongo_id || (zone as any)._id,
          ...zone
        },
        advertisement: {
          id: advertisement.id || (advertisement as any).broadstreet_id || (advertisement as any).mongo_id || (advertisement as any)._id,
          ...advertisement
        }
      };

      // Match size types between zone and advertisement
      if (zoneParsed.size_type && adParsed.size_type &&
          zoneParsed.size_type === adParsed.size_type &&
          (zoneParsed.size_type === 'SQ' || zoneParsed.size_type === 'LS' || zoneParsed.size_type === 'PT')) {
        combination.sizeType = zoneParsed.size_type;
        categories[zoneParsed.size_type].push(combination);
      } else {
        // Add to IGNORED if no matching size types or if size type is CS
        categories.IGNORED.push(combination);
      }
    });
  });

  return categories;
}

/**
 * Get total count of all placement combinations
 */
export function getTotalPlacementCount(categories: CategorizedPlacements): number {
  return categories.SQ.length + categories.LS.length + categories.PT.length + categories.IGNORED.length;
}

/**
 * Get count of categorized placements (excluding IGNORED)
 */
export function getCategorizedPlacementCount(categories: CategorizedPlacements): number {
  return categories.SQ.length + categories.LS.length + categories.PT.length;
}

/**
 * Get placement combinations for creation (with or without ignored)
 */
export function getPlacementsForCreation(
  categories: CategorizedPlacements, 
  includeIgnored: boolean
): PlacementCombination[] {
  const placements: PlacementCombination[] = [
    ...categories.SQ,
    ...categories.LS,
    ...categories.PT
  ];

  if (includeIgnored) {
    placements.push(...categories.IGNORED);
  }

  return placements;
}

/**
 * Validate that placement categories have at least one combination
 */
export function validatePlacementCategories(categories: CategorizedPlacements): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const totalCount = getTotalPlacementCount(categories);
  const categorizedCount = getCategorizedPlacementCount(categories);
  const ignoredCount = categories.IGNORED.length;

  if (totalCount === 0) {
    errors.push('No placement combinations found. Please select zones and advertisements.');
  }

  if (categorizedCount === 0 && ignoredCount > 0) {
    warnings.push(`All ${ignoredCount} combinations will be in IGNORED category (no matching size types).`);
  }

  if (ignoredCount > 0) {
    warnings.push(`${ignoredCount} combinations have no matching size types and will be categorized as IGNORED.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get size type display information
 */
export function getSizeTypeDisplayInfo(sizeType: ZoneSize): {
  label: string;
  description: string;
  color: string;
} {
  const sizeInfo: Record<ZoneSize, { label: string; description: string; color: string }> = {
    SQ: { 
      label: 'SQ', 
      description: 'Square ads (300x250)', 
      color: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    LS: { 
      label: 'LS', 
      description: 'Leaderboard ads (728x90)', 
      color: 'bg-purple-100 text-purple-800 border-purple-200' 
    },
    PT: { 
      label: 'PT', 
      description: 'Portrait ads (300x600)', 
      color: 'bg-green-100 text-green-800 border-green-200' 
    },
    CS: { 
      label: 'CS', 
      description: 'Custom size ads', 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    }
  };

  return sizeInfo[sizeType];
}

/**
 * Get IGNORED category display information
 */
export function getIgnoredDisplayInfo(): {
  label: string;
  description: string;
  color: string;
} {
  return {
    label: 'IGNORED',
    description: 'No matching size types',
    color: 'bg-red-100 text-red-800 border-red-200'
  };
}
