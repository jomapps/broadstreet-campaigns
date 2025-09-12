export type IdMapEntity = { _id: string; id: number; name?: string };

export type PlacementPair = { advertisement_id: number; zone_id: number; restrictions?: string[] };

export function generatePlacementCombinations(advertisementIds: number[], zoneIds: number[]): PlacementPair[] {
  const combinations: PlacementPair[] = [];
  for (const adId of advertisementIds) {
    for (const zoneId of zoneIds) {
      combinations.push({ advertisement_id: adId, zone_id: zoneId });
    }
  }
  return combinations;
}

export function convertSelectionIdsToNumbers(selectedIds: string[], entities: IdMapEntity[]): number[] {
  const idSet = new Set<number>();
  const map = new Map<string, number>();
  for (const e of entities) {
    map.set(e._id, e.id);
  }
  for (const sel of selectedIds) {
    const num = map.get(sel);
    if (typeof num === 'number') {
      idSet.add(num);
    }
  }
  return Array.from(idSet);
}

export function validatePlacementPrerequisites(
  campaign: { id?: number; name?: string } | null,
  zones: IdMapEntity[],
  advertisements: IdMapEntity[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!campaign || typeof campaign.id !== 'number') {
    errors.push('Campaign is required');
  }
  if (!zones || zones.length === 0) {
    errors.push('At least one zone must be selected');
  }
  if (!advertisements || advertisements.length === 0) {
    errors.push('At least one advertisement must be selected');
  }
  return { valid: errors.length === 0, errors };
}

// Placeholder duplicate checker – server uses $addToSet to prevent duplicates
export async function checkDuplicatePlacements(
  _campaignId: number,
  placements: PlacementPair[]
): Promise<PlacementPair[]> {
  return placements;
}


