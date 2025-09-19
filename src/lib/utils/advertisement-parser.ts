import { ZoneSize } from '../types/broadstreet';

export interface ParsedAdvertisementInfo {
  size_type: ZoneSize | null;
  size_number: number | null;
}

/**
 * Parse advertisement name to extract size type information
 * Based on the same patterns as zone parsing:
 * - SQ: Square ads (300px x 250px)
 * - PT: Portrait/vertical banners (300px x 600px)  
 * - LS: Horizontal banners (728px x 90px)
 * - Numbers after size indicate position or variant
 */
export function parseAdvertisementName(advertisementName: string): ParsedAdvertisementInfo {
  const result: ParsedAdvertisementInfo = {
    size_type: null,
    size_number: null,
  };

  // Convert to uppercase for consistent matching
  const upperName = advertisementName.toUpperCase();

  // Check for size types with optional numbers
  const sizeMatches = upperName.match(/\b(SQ|PT|LS)(\d+)?\b/);
  if (sizeMatches) {
    result.size_type = sizeMatches[1] as ZoneSize;
    if (sizeMatches[2]) {
      result.size_number = parseInt(sizeMatches[2], 10);
    }
  }

  return result;
}

/**
 * Get advertisements that match specific size types
 */
interface Advertisement {
  name: string;
  [key: string]: unknown;
}

export function getAdvertisementsBySize(advertisements: Advertisement[], sizeTypes: ZoneSize[]): Advertisement[] {
  return advertisements.filter(advertisement => {
    const parsed = parseAdvertisementName(advertisement.name);
    return parsed.size_type && sizeTypes.includes(parsed.size_type);
  });
}

/**
 * Check if an advertisement name contains multiple size types (conflict detection)
 */
export function hasMultipleSizeTypesInAd(advertisementName: string): boolean {
  const upperName = advertisementName.toUpperCase();
  const sizeMatches = upperName.match(/\b(SQ|PT|LS)\d*\b/g);
  return sizeMatches ? sizeMatches.length > 1 : false;
}

/**
 * Get advertisements that have multiple size types in their names (conflict ads)
 */
export function getConflictAdvertisements(advertisements: Advertisement[]): Advertisement[] {
  return advertisements.filter(advertisement => hasMultipleSizeTypesInAd(advertisement.name));
}

/**
 * Get size information for display (shared with zone parser)
 */
export function getAdvertisementSizeInfo(sizeType: ZoneSize): { dimensions: string; description: string } {
  const sizeMap: Record<ZoneSize, { dimensions: string; description: string }> = {
    SQ: { dimensions: '300x250', description: 'Square ads' },
    PT: { dimensions: '300x600', description: 'Portrait/vertical banners' },
    LS: { dimensions: '728x90', description: 'Horizontal banners' },
    CS: { dimensions: 'Custom', description: 'Custom size ads' },
  };

  return sizeMap[sizeType];
}
