import { test, expect } from '@playwright/test';

const NETWORK_ID = 9396;
const ADVERTISER_ID = 199901;
const CAMPAIGN_ID = 842383; // numeric Broadstreet id mirrored into LocalCampaign.original_broadstreet_id
const AD_IDS = [1143797];
const ZONE_IDS = [182864, 175302, 175301];

test.describe('Placement creation with seeded data', () => {
  test('creates placements and verifies visibility across pages', async ({ page, context }) => {
    // Navigate to initialize app
    await page.goto('/');

    // Programmatically seed localStorage selections for FilterContext
    await context.addCookies([
      // no cookies needed; use localStorage via evaluate
    ]);

    await page.addInitScript(({ networkId, advertiserId, campaignId, adIds, zoneIds }) => {
      try {
        localStorage.setItem('broadstreet_selected_network', JSON.stringify({ id: networkId, name: String(networkId) }));
        localStorage.setItem('broadstreet_selected_advertiser', JSON.stringify({ id: advertiserId, name: String(advertiserId) }));
        localStorage.setItem('broadstreet_selected_campaign', JSON.stringify({ id: campaignId, name: String(campaignId) }));
        localStorage.setItem('broadstreet_selected_advertisements', JSON.stringify(adIds.map(String)));
        localStorage.setItem('broadstreet_selected_zones', JSON.stringify(zoneIds.map(String)));
        localStorage.setItem('broadstreet_show_only_selected', JSON.stringify(true));
        localStorage.setItem('broadstreet_show_only_selected_ads', JSON.stringify(true));
      } catch {}
    }, { networkId: NETWORK_ID, advertiserId: ADVERTISER_ID, campaignId: CAMPAIGN_ID, adIds: AD_IDS, zoneIds: ZONE_IDS });

    // Reload to let the app pick up selections
    await page.reload();

    // Go to placements page
    await page.goto('/placements');

    // Utilities section visible
    await expect(page.getByText('Utilities')).toBeVisible();

    const createBtn = page.getByRole('button', { name: 'Create Placements' });
    await expect(createBtn).toBeVisible();

    // Open modal and verify summary
    await createBtn.click();
    await expect(page.getByRole('heading', { name: /Create Placements/i })).toBeVisible();
    await expect(page.getByText(/1 ad.*3 zones.*3 placements/i)).toBeVisible();

    // Submit creation
    const confirm = page.getByRole('button', { name: /^Create Placements$/ });
    await confirm.click();

    // Redirect to /placements
    await page.waitForURL('**/placements');
    await expect(page.getByRole('heading', { name: /Placements/i })).toBeVisible();

    // Basic cards/preview visible
    await expect(page.getByText(/Placement Overview/i)).toBeVisible();
    await expect(page.getByText(/Zone/i)).toBeVisible();

    // Navigate to local-only and verify campaigns exist (may show placement counts after UI enhancement)
    await page.goto('/local-only');
    await expect(page.getByRole('heading', { name: /Local Only/i })).toBeVisible();
  });
});


