import { ZoneSize } from '../types/broadstreet';

export interface ParsedZoneInfo {
  size_type: ZoneSize | null;
  size_number: number | null;
  category: string | null;
  block: string | null;
  is_home: boolean;
}

/**
 * Parse zone name to extract size type, category, and other information
 * Based on the patterns described in the documentation:
 * - SQ: Square ads (300px x 250px)
 * - PT: Portrait/vertical banners (300px x 600px)  
 * - LS: Horizontal banners (728px x 90px)
 * - Numbers after size indicate position (lower = closer to top)
 * - Rubrik [NAME]: Category
 * - RUBRIK [NAME] - Block [BLOCKNAME]: Category with block
 * - Home: Home page
 */
export function parseZoneName(zoneName: string): ParsedZoneInfo {
  const result: ParsedZoneInfo = {
    size_type: null,
    size_number: null,
    category: null,
    block: null,
    is_home: false,
  };

  // Convert to uppercase for consistent matching
  const upperName = zoneName.toUpperCase();

  // Check for home page
  if (upperName.includes('HOME')) {
    result.is_home = true;
  }

  // Check for size types with optional numbers
  const sizeMatches = upperName.match(/\b(SQ|PT|LS)(\d+)?\b/);
  if (sizeMatches) {
    result.size_type = sizeMatches[1] as ZoneSize;
    if (sizeMatches[2]) {
      result.size_number = parseInt(sizeMatches[2], 10);
    }
  }

  // Check for category patterns
  // Pattern: RUBRIK [NAME] - Block [BLOCKNAME]
  const blockMatch = upperName.match(/RUBRIK\s+\[([^\]]+)\]\s*-\s*BLOCK\s+\[([^\]]+)\]/);
  if (blockMatch) {
    result.category = blockMatch[1].trim();
    result.block = blockMatch[2].trim();
    return result;
  }

  // Pattern: Rubrik [NAME] or RUBRIK [NAME]
  const categoryMatch = upperName.match(/RUBRIK\s+\[([^\]]+)\]/);
  if (categoryMatch) {
    result.category = categoryMatch[1].trim();
    return result;
  }

  return result;
}

/**
 * Get zones that match specific size types
 */
interface Zone {
  name: string;
  [key: string]: unknown;
}

export function getZonesBySize(zones: Zone[], sizeTypes: ZoneSize[]): Zone[] {
  return zones.filter(zone => {
    const parsed = parseZoneName(zone.name);
    return parsed.size_type && sizeTypes.includes(parsed.size_type);
  });
}

/**
 * Get size information for display
 */
export function getSizeInfo(sizeType: ZoneSize): { dimensions: string; description: string } {
  const sizeMap = {
    SQ: { dimensions: '300x250', description: 'Square ads' },
    PT: { dimensions: '300x600', description: 'Portrait/vertical banners' },
    LS: { dimensions: '728x90', description: 'Horizontal banners' },
  };
  
  return sizeMap[sizeType];
}

/**
 * Group zones by category
 */
export function groupZonesByCategory(zones: Zone[]): Record<string, Zone[]> {
  const grouped: Record<string, Zone[]> = {
    'Home': [],
    'Uncategorized': [],
  };

  zones.forEach(zone => {
    const parsed = parseZoneName(zone.name);
    
    if (parsed.is_home) {
      grouped['Home'].push(zone);
    } else if (parsed.category) {
      if (!grouped[parsed.category]) {
        grouped[parsed.category] = [];
      }
      grouped[parsed.category].push(zone);
    } else {
      grouped['Uncategorized'].push(zone);
    }
  });

  return grouped;
}

/**
 * Sort zones by size number (lower numbers first, then no numbers)
 */
export function sortZonesByPosition(zones: Zone[]): Zone[] {
  return zones.sort((a, b) => {
    const parsedA = parseZoneName(a.name);
    const parsedB = parseZoneName(b.name);

    // If both have numbers, sort by number
    if (parsedA.size_number !== null && parsedB.size_number !== null) {
      return parsedA.size_number - parsedB.size_number;
    }

    // If only one has a number, prioritize it
    if (parsedA.size_number !== null) return -1;
    if (parsedB.size_number !== null) return 1;

    // If neither has a number, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}
