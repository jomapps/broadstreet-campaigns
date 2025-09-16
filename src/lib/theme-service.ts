import connectDB from '@/lib/mongodb';
import Theme from '@/lib/models/theme';
import Zone from '@/lib/models/zone';

/**
 * Get all themes that contain a specific zone
 */
export async function getThemesByZoneId(zoneId: number): Promise<any[]> {
  await connectDB();
  
  const themes = await Theme.find({
    zone_ids: zoneId
  }).lean();
  
  return themes;
}

/**
 * Get themes for multiple zones (returns map of zoneId -> themes[])
 */
export async function getThemesByZoneIds(zoneIds: number[]): Promise<Map<number, any[]>> {
  await connectDB();
  
  const themes = await Theme.find({
    zone_ids: { $in: zoneIds }
  }).lean();
  
  const themesByZone = new Map<number, any[]>();
  
  // Initialize map with empty arrays
  zoneIds.forEach(zoneId => {
    themesByZone.set(zoneId, []);
  });
  
  // Populate themes for each zone
  themes.forEach(theme => {
    theme.zone_ids.forEach((zoneId: number) => {
      if (zoneIds.includes(zoneId)) {
        const existingThemes = themesByZone.get(zoneId) || [];
        existingThemes.push(theme);
        themesByZone.set(zoneId, existingThemes);
      }
    });
  });
  
  return themesByZone;
}

/**
 * Get all zones that are eligible for themes (synced with Broadstreet)
 */
export async function getEligibleZones(networkId?: number): Promise<any[]> {
  await connectDB();
  
  const query: any = {
    broadstreet_id: { $exists: true, $ne: null },
    synced_with_api: true
  };
  
  if (networkId) {
    query.network_id = networkId;
  }
  
  const zones = await Zone.find(query)
    .sort({ name: 1 })
    .lean();
  
  return zones;
}

/**
 * Validate that zone IDs are eligible for themes
 */
export async function validateZoneEligibility(zoneIds: number[]): Promise<{
  valid: number[];
  invalid: number[];
}> {
  await connectDB();
  
  const validZones = await Zone.find({
    broadstreet_id: { $in: zoneIds, $exists: true, $ne: null },
    synced_with_api: true
  }).lean();
  
  const validZoneIds = validZones.map(z => z.broadstreet_id);
  const invalidZoneIds = zoneIds.filter(id => !validZoneIds.includes(id));
  
  return {
    valid: validZoneIds,
    invalid: invalidZoneIds
  };
}

/**
 * Get theme statistics
 */
export async function getThemeStats(): Promise<{
  totalThemes: number;
  totalZonesInThemes: number;
  averageZonesPerTheme: number;
  themesWithMostZones: any;
}> {
  await connectDB();
  
  const themes = await Theme.find({}).lean();
  
  const totalThemes = themes.length;
  const allZoneIds = new Set<number>();
  
  themes.forEach(theme => {
    theme.zone_ids.forEach((zoneId: number) => allZoneIds.add(zoneId));
  });
  
  const totalZonesInThemes = allZoneIds.size;
  const averageZonesPerTheme = totalThemes > 0 ? 
    themes.reduce((sum, theme) => sum + theme.zone_ids.length, 0) / totalThemes : 0;
  
  const themesWithMostZones = themes
    .sort((a, b) => b.zone_ids.length - a.zone_ids.length)
    .slice(0, 5);
  
  return {
    totalThemes,
    totalZonesInThemes,
    averageZonesPerTheme: Math.round(averageZonesPerTheme * 100) / 100,
    themesWithMostZones
  };
}

/**
 * Clone a theme with a new name
 */
export async function cloneTheme(themeId: string, newName: string): Promise<any> {
  await connectDB();
  
  const originalTheme = await Theme.findById(themeId);
  
  if (!originalTheme) {
    throw new Error('Theme not found');
  }
  
  // Check if new name already exists
  const existingTheme = await Theme.findOne({ name: newName.trim() });
  if (existingTheme) {
    throw new Error('A theme with this name already exists');
  }
  
  const clonedTheme = new Theme({
    name: newName.trim(),
    description: originalTheme.description ? `Copy of ${originalTheme.description}` : undefined,
    zone_ids: [...originalTheme.zone_ids]
  });
  
  await clonedTheme.save();
  
  return clonedTheme.toJSON();
}
