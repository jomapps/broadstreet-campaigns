import { test, expect, request } from '@playwright/test';

function buildUrl(path: string, baseURL?: string | null): string {
  if (baseURL) {
    try {
      return new URL(path, baseURL).toString();
    } catch {}
  }
  return path;
}

test.describe('Placement Embedding Validation', () => {
  test.beforeAll(async ({ request, baseURL }) => {
    // Ensure a full sync has run
    const res = await request.post(buildUrl('/api/sync/all', baseURL), { headers: { 'Content-Type': 'application/json' } });
    expect(res.ok()).toBeTruthy();
  });

  test('Campaigns have placements arrays with correct fields', async () => {
    const { default: connectDB } = await import('@/lib/mongodb');
    const { default: Campaign } = await import('@/lib/models/campaign');
    await connectDB();

    const docs: any[] = await (Campaign as any).find({}).lean();
    for (const c of docs) {
      if (c.placements === undefined) continue; // allowed if API returned none
      expect(Array.isArray(c.placements)).toBeTruthy();
      for (const p of c.placements) {
        expect(typeof p.advertisement_id).toBe('number');
        expect(typeof p.zone_id).toBe('number');
        expect(Array.isArray(p.restrictions || [])).toBeTruthy();
      }
    }
  });

  test('Placement IDs correspond to existing ads and zones', async () => {
    const { default: connectDB } = await import('@/lib/mongodb');
    const { default: Campaign } = await import('@/lib/models/campaign');
    const { default: Advertisement } = await import('@/lib/models/advertisement');
    const { default: Zone } = await import('@/lib/models/zone');
    await connectDB();

    const sample: any = await (Campaign as any).findOne({ placements: { $exists: true, $not: { $size: 0 } } }).lean();
    if (!sample) {
      test.info().annotations.push({ type: 'note', description: 'No campaign with placements found; skipping referential integrity check.' });
      return;
    }

    const p = sample.placements[0];
    const ad = await (Advertisement as any).findOne({ broadstreet_id: p.advertisement_id }).lean();
    const zone = await (Zone as any).findOne({ broadstreet_id: p.zone_id }).lean();
    expect(ad).toBeTruthy();
    expect(zone).toBeTruthy();
  });

  test('Dashboard placement count equals sum of embedded placements', async ({ page, baseURL }) => {
    // Compute total placements from DB
    const { default: connectDB } = await import('@/lib/mongodb');
    const { default: Campaign } = await import('@/lib/models/campaign');
    await connectDB();
    const campaigns: any[] = await (Campaign as any).find({}).lean();
    const total = campaigns.reduce((sum, c) => sum + (Array.isArray(c.placements) ? c.placements.length : 0), 0);

    await page.goto(buildUrl('/dashboard', baseURL));
    const card = page.locator('a', { hasText: 'Placements' }).first();
    await expect(card).toBeVisible();
    const badge = card.getByTestId('stats-count');
    const text = (await badge.textContent())?.trim() || '0';
    const displayed = Number(text.replace(/[\,\s]/g, ''));
    expect(displayed).toBe(total);
  });
});


