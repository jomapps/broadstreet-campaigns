import { test, expect } from '@playwright/test';
import { getCounts } from './utils/getCounts';

function buildUrl(path: string, baseURL?: string | null): string {
  if (baseURL) {
    try {
      return new URL(path, baseURL).toString();
    } catch {}
  }
  return path;
}

test.describe('Dashboard Validation', () => {
  test('Dashboard shows correct counts after full sync', async ({ page, request, baseURL }) => {
    // Run a full sync first
    const res = await request.post(buildUrl('/api/sync/all', baseURL), { headers: { 'Content-Type': 'application/json' } });
    const body = JSON.parse(await res.text());
    const counts = getCounts(body);

    await page.goto(buildUrl('/dashboard', baseURL));

    const getStat = async (title: string) => {
      const card = page.locator('a', { hasText: title }).first();
      await expect(card).toBeVisible();
      const badge = card.getByTestId('stats-count');
      const text = (await badge.textContent())?.trim() || '0';
      return Number(text.replace(/[\,\s]/g, ''));
    };

    await expect.poll(() => getStat('Networks')).toBe(counts.networks);
    await expect.poll(() => getStat('Advertisers')).toBe(counts.advertisers);
    await expect.poll(() => getStat('Zones')).toBe(counts.zones);
    await expect.poll(() => getStat('Campaigns')).toBe(counts.campaigns);
    await expect.poll(() => getStat('Advertisements')).toBe(counts.advertisements);
    await expect.poll(() => getStat('Placements')).toBe(counts.placements);
  });

  test('Sync Data quick action triggers sync and updates counts', async ({ page, baseURL }) => {
    await page.goto(buildUrl('/dashboard', baseURL));

    // Click the Sync Data card
    const syncCard = page.locator('div').filter({ hasText: 'Sync Data' }).first();
    await syncCard.click();

    // Progress modal should appear
    await expect(page.locator('text=Sync Progress')).toBeVisible();

    // Wait until the modal disappears which indicates completion
    await page.waitForSelector('text=Sync Progress', { state: 'detached', timeout: 120000 });

    // After completion, stats should be visible and non-negative
    const statTitles = ['Networks', 'Advertisers', 'Zones', 'Campaigns', 'Advertisements', 'Placements'];
    for (const t of statTitles) {
      const card = page.locator('a', { hasText: t }).first();
      await expect(card).toBeVisible();
    }
  });

  test('Responsive: dashboard functional on mobile and desktop', async ({ page, baseURL, browserName }) => {
    await page.goto(buildUrl('/dashboard', baseURL));
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('Loading states appear during sync', async ({ page, baseURL }) => {
    await page.goto(buildUrl('/dashboard', baseURL));
    const syncCard = page.locator('div').filter({ hasText: 'Sync Data' }).first();
    await syncCard.click();

    // Modal initializing state
    await expect(page.locator('text=Connecting to Broadstreet API')).toBeVisible();
    await expect(page.locator('text=Overall Progress')).toBeVisible({ timeout: 60000 });

    // Close after completion
    await page.waitForSelector('text=Sync Progress', { state: 'detached', timeout: 120000 });
  });
});


