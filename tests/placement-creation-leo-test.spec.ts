import { test, expect, Page } from '@playwright/test';

// Specific test data provided by user
const NETWORK_ID = 9396;
const ADVERTISER_ID = 199901;
const CAMPAIGN_ID = 842383; // numeric Broadstreet id mirrored into LocalCampaign.original_broadstreet_id
const AD_IDS = [1143797];
const ZONE_IDS = [182864, 175302, 175301];

const URLS = {
  placements: '/placements',
  localOnly: '/local-only',
};

async function setFilterSelections(page: Page) {
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
}

async function openCreatePlacementsModal(page: Page) {
  await page.goto(URLS.placements);
  await expect(page.getByTestId('placements-page')).toBeVisible();
  // Use button role as a fallback for backward compatibility
  const openButton = page.getByRole('button', { name: 'Create Placements' });
  await expect(openButton).toBeVisible();
  await openButton.click();
  await expect(page.getByTestId('create-placements-modal')).toBeVisible();
}

async function createPlacements(page: Page) {
  // Verify summary in modal
  await expect(page.getByTestId('placement-summary')).toContainText('1 advertisements');
  await expect(page.getByTestId('placement-summary')).toContainText('3 zones');
  await expect(page.getByTestId('placement-summary')).toContainText('3 placements');

  // Create
  await page.getByTestId('create-placements-button').click();

  // Redirect/refresh back to placements
  await page.waitForURL('**/placements');
  await expect(page.getByTestId('placements-page')).toBeVisible();
}

async function verifyPlacementsOnPlacementsPage(page: Page) {
  await expect(page.getByTestId('placements-overview')).toBeVisible();
  // Wait for list to render
  await expect(page.getByTestId('placements-list')).toBeVisible({ timeout: 30_000 });

  // Prefer count assertion to avoid per-card flakiness
  await expect(page.locator(`[data-placement-id^="${AD_IDS[0]}-"]`)).toHaveCount(3, { timeout: 30_000 });
  // And still verify per-zone visibility with generous timeouts
  for (const zoneId of ZONE_IDS) {
    const selector = `[data-placement-id="${AD_IDS[0]}-${zoneId}-${CAMPAIGN_ID}"]`;
    await expect(page.locator(selector)).toBeVisible({ timeout: 30_000 });
  }
}

async function verifyPlacementsOnLocalOnlyPage(page: Page) {
  await page.goto(URLS.localOnly);
  await expect(page.getByRole('heading', { name: /Local Only/i })).toBeVisible();
  // Assert campaign card rendered for mirrored campaign and placements count visible
  const campaignTestId = `local-campaign-${CAMPAIGN_ID}`;
  const countTestId = `campaign-placements-count-${CAMPAIGN_ID}`;
  await expect(page.getByTestId(campaignTestId)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId(countTestId)).toBeVisible({ timeout: 30_000 });
}

// Cleanup helper to ensure test isolation
async function cleanupPlacementsIfPresent(page: Page) {
  // Try dedicated cleanup endpoint first
  try {
    const resp = await page.request.post('/api/test-utils/cleanup-placements', {
      data: {
        campaign_id: CAMPAIGN_ID,
        advertisement_ids: AD_IDS,
        zone_ids: ZONE_IDS,
      },
      timeout: 30_000,
    });
    if (resp.ok()) return;
  } catch (e) {
    console.warn('[cleanup] API cleanup failed, falling back to UI:', e);
  }

  // Fallback: navigate to local-only and delete mirrored campaign if shown
  try {
    await page.goto(URLS.localOnly);
    const testId = `local-campaign-${CAMPAIGN_ID}`;
    const campaignCard = page.getByTestId(testId);
    if (await campaignCard.count()) {
      // Accept confirm() via Playwright dialog handler
      page.once('dialog', d => d.accept());
      const deleteBtn = campaignCard.locator('[data-testid="delete-button"]');
      if (await deleteBtn.count()) {
        const deleteReqPromise = page.waitForResponse(r =>
          r.url().includes('/api/delete/campaign/') && r.request().method() === 'DELETE'
        ).catch(() => null);
        await deleteBtn.click();
        // Wait deterministically for card to disappear
        await expect(page.getByTestId(testId)).toHaveCount(0, { timeout: 30_000 });
        await deleteReqPromise;
      }
    }
  } catch (e) {
    console.warn('[cleanup] UI fallback cleanup failed:', e);
  }
}

test.describe('Placement creation - leo test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setFilterSelections(page);
    await page.reload();
  });

  test('creates placements and verifies across placements and local-only pages', async ({ page }) => {
    await openCreatePlacementsModal(page);
    await createPlacements(page);
    await verifyPlacementsOnPlacementsPage(page);
    await verifyPlacementsOnLocalOnlyPage(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupPlacementsIfPresent(page);
  });
});


