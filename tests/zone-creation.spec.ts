import { test, expect, Page, Browser, Dialog } from '@playwright/test';

const ZONES_PAGE_URL = '/zones';
const LOCAL_PAGE_URL = '/local-only';

const ZONE_NAME = 'Leo Test Zone 52';

async function openZoneCreationModal(page: Page) {
  await page.goto(ZONES_PAGE_URL);
  await expect(page.locator('h1:has-text("Zones")')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="zones-list"]')).toBeVisible({ timeout: 15000 });
  await page.click('[data-testid="create-button"]');
  await expect(page.locator('[data-testid="zone-creation-form"]')).toBeVisible();
}

async function createZone(page: Page, name: string) {
  await page.locator('[data-testid="zone-name-input"]').fill(name);
  const dialogPromise = page
    .waitForEvent('dialog', { timeout: 5000 })
    .then(async (dialog: Dialog) => {
      await dialog.accept();
    })
    .catch(() => {});
  await page.getByRole('button', { name: 'Create Zone' }).first().click();
  await dialogPromise;
  await expect(page.locator('[data-testid="zones-list"]')).toBeVisible({ timeout: 15000 });
}

async function verifyZoneOnZonesPage(page: Page, name: string) {
  const slug = name.replace(/\s+/g, '-').toLowerCase();
  const specific = page.locator(`[data-testid="zone-${slug}"]`);
  if (await specific.count()) {
    await expect(specific.first()).toBeVisible({ timeout: 10000 });
  } else {
    await expect(page.locator('[data-testid="zone-name"]', { hasText: name }).first()).toBeVisible({ timeout: 10000 });
  }
}

async function verifyZoneOnLocalOnlyPage(page: Page, name: string) {
  await page.goto(LOCAL_PAGE_URL);
  await expect(page.locator('h1:has-text("Local Only")')).toBeVisible();
  await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 10000 });
}

async function cleanupZoneIfPresent(page: Page, name: string) {
  await page.goto(LOCAL_PAGE_URL);
  const entityCard = page.locator(`[data-testid="entity-card"]:has-text("${name}")`);
  if (await entityCard.count()) {
    const dialogPromise = page.waitForEvent('dialog').then((d: Dialog) => d.accept());
    await entityCard.locator('[data-testid="delete-button"]').click();
    await dialogPromise;
    await expect(page.locator(`text=${name}`)).not.toBeVisible({ timeout: 10000 });
  }
}

test.describe('Zone Creation Flow', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await cleanupZoneIfPresent(page, ZONE_NAME);
  });

  test('should create a zone via modal and verify across pages', async ({ page }: { page: Page }) => {
    await openZoneCreationModal(page);
    await createZone(page, ZONE_NAME);
    await verifyZoneOnZonesPage(page, ZONE_NAME);
    await verifyZoneOnLocalOnlyPage(page, ZONE_NAME);
  });

  test.afterAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await cleanupZoneIfPresent(page, ZONE_NAME);
    await context.close();
  });
});


