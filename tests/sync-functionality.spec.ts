import { test, expect, request } from '@playwright/test';
import { getCounts } from './utils/getCounts';

function buildUrl(path: string, baseURL?: string | null): string {
  if (baseURL) {
    try {
      return new URL(path, baseURL).toString();
    } catch {}
  }
  return path;
}

test.describe('Sync Functionality Validation', () => {
  test('POST /api/sync/all returns success with entity counts', async ({ request, baseURL }) => {
    const res = await request.post(buildUrl('/api/sync/all', baseURL), {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.ok()).toBeTruthy();

    const bodyText = await res.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    expect(body.success).toBe(true);
    expect(typeof body.results).toBe('object');

    const counts = getCounts(body);
    // Cleanup should be successful (count may be 0 on first run, >0 on subsequent runs)
    expect(body.results.cleanup.success).toBe(true);
    expect(counts.cleanup).toBeGreaterThanOrEqual(0);

    expect(counts.networks).toBe(2);
    expect(counts.advertisers).toBeGreaterThanOrEqual(10);
    expect(counts.zones).toBeGreaterThanOrEqual(10);
    expect(counts.campaigns).toBeGreaterThanOrEqual(10);
    expect(counts.advertisements).toBeGreaterThanOrEqual(10);
    // placements may vary, but should be counted and not negative
    expect(counts.placements).toBeGreaterThanOrEqual(0);
  });

  test('Dashboard reflects synced counts', async ({ page, baseURL }) => {
    // Trigger a sync first to ensure fresh data
    const ctx = await request.newContext();
    const res = await ctx.post(buildUrl('/api/sync/all', baseURL), { headers: { 'Content-Type': 'application/json' } });
    const body = JSON.parse(await res.text());
    const counts = getCounts(body);

    await page.goto(buildUrl('/dashboard', baseURL));

    // Helper to extract the count badge for a given card title
    async function getCardCount(title: string): Promise<number> {
      const card = page.locator('a', { hasText: title }).first();
      await expect(card).toBeVisible();
      const badge = card.getByTestId('stats-count');
      const text = (await badge.textContent())?.trim() || '0';
      return Number(text.replace(/[\,\s]/g, ''));
    }

    await expect.poll(() => getCardCount('Networks')).toBe(counts.networks);
    await expect.poll(() => getCardCount('Advertisers')).toBe(counts.advertisers);
    await expect.poll(() => getCardCount('Zones')).toBe(counts.zones);
    await expect.poll(() => getCardCount('Campaigns')).toBe(counts.campaigns);
    // Placements are aggregated from embedded arrays in campaigns
    await expect.poll(() => getCardCount('Placements')).toBe(counts.placements);
  });

  test('Placements are embedded in campaigns with correct schema', async () => {
    // Import DB helpers dynamically to avoid bundling issues
    const { default: connectDB } = await import('@/lib/mongodb');
    const { default: Campaign } = await import('@/lib/models/campaign');
    const { default: Advertisement } = await import('@/lib/models/advertisement');
    const { default: Zone } = await import('@/lib/models/zone');

    await connectDB();
    const campaigns: any[] = await (Campaign as any).find({}).lean();

    // Ensure placements field exists (empty array allowed)
    for (const c of campaigns) {
      expect(Array.isArray(c.placements) || c.placements === undefined).toBeTruthy();
    }

    const totalEmbedded = campaigns.reduce((sum, c) => sum + (Array.isArray(c.placements) ? c.placements.length : 0), 0);
    // Not asserting a fixed minimum since it depends on remote data; just ensure non-negative
    expect(totalEmbedded).toBeGreaterThanOrEqual(0);

    // Validate a sample of placements for field correctness and referential integrity
    const sample = campaigns.find(c => Array.isArray(c.placements) && c.placements.length > 0);
    if (sample) {
      const p = sample.placements[0];
      expect(typeof p.advertisement_id).toBe('number');
      expect(typeof p.zone_id).toBe('number');
      expect(Array.isArray(p.restrictions || [])).toBeTruthy();

      const ad = await (Advertisement as any).findOne({ broadstreet_id: p.advertisement_id }).lean();
      const zone = await (Zone as any).findOne({ broadstreet_id: p.zone_id }).lean();
      expect(ad).toBeTruthy();
      expect(zone).toBeTruthy();
    }
  });

  test('API response shape includes results.{entity}.count fields', async ({ request, baseURL }) => {
    const res = await request.post(buildUrl('/api/sync/all', baseURL));
    const body = JSON.parse(await res.text());
    expect(body).toHaveProperty('results.cleanup.count');
    expect(body).toHaveProperty('results.networks.count');
    expect(body).toHaveProperty('results.advertisers.count');
    expect(body).toHaveProperty('results.zones.count');
    expect(body).toHaveProperty('results.campaigns.count');
    expect(body).toHaveProperty('results.advertisements.count');
    expect(body).toHaveProperty('results.placements.count');
  });

  test('Error handling: non-POST request is rejected', async ({ request, baseURL }) => {
    const res = await request.get(buildUrl('/api/sync/all', baseURL));
    expect(res.status()).toBe(405);
  });
});


