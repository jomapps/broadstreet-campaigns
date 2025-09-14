import { test, expect, Page, Browser, Dialog } from '@playwright/test';

const ADVERTISERS_PAGE_URL = '/advertisers';
const LOCAL_PAGE_URL = '/local-only';

const ADVERTISER_NAME = 'Leo Test Advertiser 52';

async function openAdvertiserCreationModal(page: Page) {
  await page.goto(ADVERTISERS_PAGE_URL);
  await expect(page.locator('h1:has-text("Advertisers")')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="advertisers-list"]')).toBeVisible({ timeout: 15000 });
  await page.click('[data-testid="create-button"]');
  await expect(page.locator('[data-testid="advertiser-creation-form"]')).toBeVisible();
}

async function createAdvertiser(page: Page, name: string) {
  await page.locator('[data-testid="advertiser-name-input"]').fill(name);
  const dialogPromise = page
    .waitForEvent('dialog', { timeout: 5000 })
    .then(async (dialog: Dialog) => {
      await dialog.accept();
    })
    .catch(() => {});
  await page.getByRole('button', { name: 'Create Advertiser' }).first().click();
  await dialogPromise;
  await expect(page.locator('[data-testid="advertisers-list"]')).toBeVisible({ timeout: 15000 });
}

async function verifyAdvertiserOnAdvertisersPage(page: Page, name: string) {
  const slug = name.replace(/\s+/g, '-').toLowerCase();
  const specific = page.locator(`[data-advertiser-slug="${slug}"]`);
  if (await specific.count()) {
    await expect(specific.first()).toBeVisible({ timeout: 10000 });
  } else {
    await expect(page.locator('[data-testid="advertiser-name"]', { hasText: name }).first()).toBeVisible({ timeout: 10000 });
  }
}

async function verifyAdvertiserOnLocalOnlyPage(page: Page, name: string) {
  await page.goto(LOCAL_PAGE_URL);
  await expect(page.locator('h1:has-text("Local Only")')).toBeVisible();
  await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 10000 });
}

async function cleanupAdvertiserIfPresent(page: Page, name: string) {
  await page.goto(LOCAL_PAGE_URL);
  const entityCard = page.locator(`[data-testid="entity-card"]:has-text("${name}")`);
  if (await entityCard.count()) {
    const dialogPromise = page.waitForEvent('dialog').then(d => d.accept());
    await entityCard.locator('[data-testid="delete-button"]').click();
    await dialogPromise;
    await expect(page.locator(`text=${name}`)).not.toBeVisible({ timeout: 10000 });
  }
}

test.describe('Advertiser Creation Flow', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await cleanupAdvertiserIfPresent(page, ADVERTISER_NAME);
  });

  test('should create an advertiser via modal and verify across pages', async ({ page }: { page: Page }) => {
    await openAdvertiserCreationModal(page);
    await createAdvertiser(page, ADVERTISER_NAME);
    await verifyAdvertiserOnAdvertisersPage(page, ADVERTISER_NAME);
    await verifyAdvertiserOnLocalOnlyPage(page, ADVERTISER_NAME);
  });

  test.afterAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await cleanupAdvertiserIfPresent(page, ADVERTISER_NAME);
    await context.close();
  });
});


