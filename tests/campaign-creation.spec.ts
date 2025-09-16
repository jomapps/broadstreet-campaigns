import { test, expect, Page, Browser } from '@playwright/test';

const CAMPAIGNS_PAGE_URL = '/campaigns';
const LOCAL_PAGE_URL = '/local-only';

const CAMPAIGN_NAME = 'Leo Test Campaign 52';

async function ensureFiltersSelected(page: Page) {
  // Select an advertiser via advertisers page (network auto-selects first by default)
  await page.goto('/advertisers');
  await expect(page.locator('h1:has-text("Advertisers")')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('[data-testid="advertisers-list"]').first()).toBeVisible({ timeout: 30000 });
  const firstAdvertiser = page.locator('[data-testid="advertiser-card"]').first();
  await expect(firstAdvertiser).toBeVisible({ timeout: 30000 });
  await firstAdvertiser.click();
}

async function openCampaignCreationModal(page: Page) {
  await page.goto(CAMPAIGNS_PAGE_URL);
  await expect(page.locator('h1:has-text("Campaigns")')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="create-button"]').first()).toBeVisible({ timeout: 15000 });
  await page.locator('[data-testid="create-button"]').first().click();
  await expect(page.locator('[data-testid="campaign-creation-form"]')).toBeVisible();
}

async function createCampaign(page: Page, name: string) {
  await page.locator('[data-testid="campaign-name-input"]').fill(name);

  // Ensure submit is enabled before clicking
  await expect(page.locator('[data-testid="submit-button"]').first()).toBeEnabled();

  // Accept success alert dialog proactively
  page.once('dialog', async (d) => { await d.accept(); });

  // Prefer a stable test id if available; otherwise fallback to role by text
  const submitByTestId = page.locator('[data-testid="submit-button"]').first();
  if (await submitByTestId.count()) {
    await submitByTestId.click();
  } else {
    await page.getByRole('button', { name: 'Create Campaign' }).first().click();
  }

  // Ensure we are back on the campaigns page and the list has refreshed
  await page.waitForURL('**/campaigns', { timeout: 30000 });
  await expect(page.locator('[data-testid="campaigns-list"]')).toBeVisible({ timeout: 30000 });
}

async function verifyCampaignOnCampaignsPage(page: Page, name: string) {
  // Ensure the campaigns list is rendered before verifying specific card
  await expect(page.locator('[data-testid="campaigns-list"]')).toBeVisible({ timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  const slug = name.replace(/\s+/g, '-').toLowerCase();
  const card = page.locator(`[data-campaign-slug="${slug}"]`).first();
  await expect(card).toBeVisible({ timeout: 10000 });
  // Local badge may only appear for created-local campaigns; ensure core identifiers are present instead
  await expect(card.getByTestId('campaign-name')).toHaveText(name);
}

async function verifyCampaignOnLocalOnlyPage(page: Page, name: string) {
  await page.goto(LOCAL_PAGE_URL);
  await expect(page.locator('h1:has-text("Local Only")')).toBeVisible();
  await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 10000 });
}

async function cleanupCampaignIfPresent(page: Page, name: string) {
  await page.goto(LOCAL_PAGE_URL);
  const entityCard = page.locator(`[data-testid="entity-card"]:has-text("${name}")`);
  if (await entityCard.count()) {
    const dialogPromise = page.waitForEvent('dialog').then(d => d.accept());
    await entityCard.locator('[data-testid="delete-button"]').click();
    await dialogPromise;
    await expect(page.locator(`text=${name}`)).not.toBeVisible({ timeout: 10000 });
  }
}

test.describe('Campaign Creation Flow', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await cleanupCampaignIfPresent(page, CAMPAIGN_NAME);
    await ensureFiltersSelected(page);
  });

  test('should create a campaign via modal and verify across pages', async ({ page }: { page: Page }) => {
    await ensureFiltersSelected(page);
    await openCampaignCreationModal(page);
    await createCampaign(page, CAMPAIGN_NAME);
    await verifyCampaignOnCampaignsPage(page, CAMPAIGN_NAME);
    await verifyCampaignOnLocalOnlyPage(page, CAMPAIGN_NAME);
  });

  test.afterAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await cleanupCampaignIfPresent(page, CAMPAIGN_NAME);
    await context.close();
  });
});


