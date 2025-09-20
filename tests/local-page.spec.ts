import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3005';
const LOCAL_PAGE_URL = `${BASE_URL}/local-only`;

// Test data for entity creation
const testEntities = {
  network: {
    name: 'Test Network',
    group_id: 1,
    web_home_url: 'https://testnetwork.com',
    valet_active: true,
    path: '/test-network',
    notes: 'Test network for automated testing'
  },
  advertiser: {
    name: 'Test Advertiser',
    network_id: 1,
    web_home_url: 'https://testadvertiser.com',
    notes: 'Test advertiser for automated testing'
  },
  zone: {
    name: 'Test Zone',
    network_id: 1,
    alias: 'test-zone',
    width: 300,
    height: 250,
    self_serve: true
  },
  campaign: {
    name: 'Test Campaign',
    advertiser_id: 1,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    weight: 1,
    active: true
  },
  advertisement: {
    name: 'Test Advertisement',
    network_id: 1,
    type: 'image',
    advertiser_id: 1,
    active: true,
    preview_url: 'https://example.com/preview.jpg'
  }
};

// Helper functions
async function createEntity(page: Page, entityType: string, data: any) {
  // Navigate to the appropriate creation page
  const creationPages = {
    network: '/networks',
    advertiser: '/advertisers', 
    zone: '/zones',
    campaign: '/campaigns',
    advertisement: '/advertisements'
  };
  
  await page.goto(`${BASE_URL}${creationPages[entityType as keyof typeof creationPages]}`);
  
  // Click the creation button
  await page.click('[data-testid="create-button"]');
  
  // Fill in the form fields
  for (const [key, value] of Object.entries(data)) {
    const field = page.locator(`[name="${key}"]`);
    if (await field.count() > 0) {
      if ((await field.getAttribute('type')) === 'checkbox') {
        if (value) await field.check();
      } else {
        await field.fill(String(value));
      }
    }
  }
  
  // Submit the form
  await page.click('[data-testid="submit-button"]');
  
  // Wait for success message or redirect
  await page.waitForTimeout(1000);
}

async function waitForEntityToAppear(page: Page, entityName: string, entityType: string) {
  await page.goto(LOCAL_PAGE_URL);
  await expect(page.locator(`text=${entityName}`)).toBeVisible();
  await expect(page.locator(`text=${entityType}`)).toBeVisible();
}

async function deleteEntity(page: Page, entityName: string) {
  // Find the entity card and click the delete button
  const entityCard = page.locator(`[data-testid="entity-card"]:has-text("${entityName}")`);
  await entityCard.locator('[data-testid="delete-button"]').click();
  
  // Confirm deletion
  await page.click('button:has-text("OK")');
  
  // Wait for entity to disappear
  await expect(page.locator(`text=${entityName}`)).not.toBeVisible();
}

// Test suite
test.describe('Local Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local page before each test
    await page.goto(LOCAL_PAGE_URL);
  });

  test('should display local page correctly', async ({ page }) => {
    // Check page title and description
    await expect(page.locator('h1:has-text("Local Only")')).toBeVisible();
    await expect(page.locator('text=Manage locally created entities')).toBeVisible();
    
    // Check for action buttons
    await expect(page.locator('button:has-text("Sync All to Broadstreet")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete All Local")')).toBeVisible();
  });

  test('should show empty state when no local entities exist', async ({ page }) => {
    // If no entities exist, should show empty state
    const emptyState = page.locator('text=No Local Entities');
    if (await emptyState.count() > 0) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('text=You haven\'t created any local entities yet')).toBeVisible();
    }
  });

  test('should create and display local entities', async ({ page }) => {
    // Create a test network
    await createEntity(page, 'network', testEntities.network);
    await waitForEntityToAppear(page, testEntities.network.name, 'network');
    
    // Create a test advertiser
    await createEntity(page, 'advertiser', testEntities.advertiser);
    await waitForEntityToAppear(page, testEntities.advertiser.name, 'advertiser');
    
    // Create a test zone
    await createEntity(page, 'zone', testEntities.zone);
    await waitForEntityToAppear(page, testEntities.zone.name, 'zone');
    
    // Verify entities appear in correct sections
    await expect(page.locator('h2:has-text("Networks")')).toBeVisible();
    await expect(page.locator('h2:has-text("Advertisers")')).toBeVisible();
    await expect(page.locator('h2:has-text("Zones")')).toBeVisible();
  });

  test('should display entity details correctly', async ({ page }) => {
    // Create a test zone with specific properties
    await createEntity(page, 'zone', testEntities.zone);
    await page.goto(LOCAL_PAGE_URL);
    
    // Check that zone details are displayed
    const zoneCard = page.locator(`[data-testid="entity-card"]:has-text("${testEntities.zone.name}")`);
    await expect(zoneCard).toBeVisible();
    await expect(zoneCard.locator(`text=${testEntities.zone.alias}`)).toBeVisible();
    await expect(zoneCard.locator(`text=${testEntities.zone.width}x${testEntities.zone.height}px`)).toBeVisible();
    await expect(zoneCard.locator('text=Self Serve')).toBeVisible();
  });

  test('should delete individual entities', async ({ page }) => {
    // Create a test entity
    await createEntity(page, 'network', testEntities.network);
    await waitForEntityToAppear(page, testEntities.network.name, 'network');
    
    // Delete the entity
    await deleteEntity(page, testEntities.network.name);
    
    // Verify entity is removed
    await expect(page.locator(`text=${testEntities.network.name}`)).not.toBeVisible();
  });

  test('should show sync progress modal', async ({ page }) => {
    // Create some test entities first
    await createEntity(page, 'network', testEntities.network);
    await createEntity(page, 'advertiser', testEntities.advertiser);
    
    await page.goto(LOCAL_PAGE_URL);
    
    // Click sync all button
    await page.click('button:has-text("Sync All to Broadstreet")');
    
    // Confirm sync
    await page.click('button:has-text("OK")');
    
    // Check that progress modal appears
    await expect(page.locator('text=Syncing to Broadstreet')).toBeVisible();
    await expect(page.locator('text=Dry Run Validation')).toBeVisible();
    await expect(page.locator('text=Overall Progress')).toBeVisible();
    
    // Wait for modal to complete or show results
    await page.waitForTimeout(5000);
  });

  test('should handle sync errors gracefully', async ({ page }) => {
    // Create entities with potential conflicts
    await createEntity(page, 'network', testEntities.network);
    await createEntity(page, 'advertiser', testEntities.advertiser);
    
    await page.goto(LOCAL_PAGE_URL);
    
    // Click sync all button
    await page.click('button:has-text("Sync All to Broadstreet")');
    await page.click('button:has-text("OK")');
    
    // Wait for sync to complete
    await page.waitForTimeout(10000);
    
    // Check for error handling (modal should show results)
    const modal = page.locator('[data-testid="progress-modal"]');
    if (await modal.count() > 0) {
      // Modal should show completion status
      await expect(modal.locator('button:has-text("Complete"), button:has-text("Retry"), button:has-text("Close")')).toBeVisible();
    }
  });

  test('should delete all local entities', async ({ page }) => {
    // Create multiple test entities
    await createEntity(page, 'network', testEntities.network);
    await createEntity(page, 'advertiser', testEntities.advertiser);
    await createEntity(page, 'zone', testEntities.zone);
    
    await page.goto(LOCAL_PAGE_URL);
    
    // Click delete all button
    await page.click('button:has-text("Delete All Local")');
    
    // Confirm deletion
    await page.click('button:has-text("OK")');
    
    // Wait for deletion to complete
    await page.waitForTimeout(2000);
    
    // Verify all entities are removed
    await expect(page.locator(`text=${testEntities.network.name}`)).not.toBeVisible();
    await expect(page.locator(`text=${testEntities.advertiser.name}`)).not.toBeVisible();
    await expect(page.locator(`text=${testEntities.zone.name}`)).not.toBeVisible();
  });

  test('should show entity counts in summary', async ({ page }) => {
    // Create entities of different types
    await createEntity(page, 'network', testEntities.network);
    await createEntity(page, 'advertiser', testEntities.advertiser);
    await createEntity(page, 'zone', testEntities.zone);
    
    await page.goto(LOCAL_PAGE_URL);
    
    // Check summary shows correct count
    const summary = page.locator('text=3 local entities ready to sync');
    await expect(summary).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that page is still functional
    await expect(page.locator('h1:has-text("Local Only")')).toBeVisible();
    await expect(page.locator('button:has-text("Sync All to Broadstreet")')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1:has-text("Local Only")')).toBeVisible();
  });

  test('should show loading states correctly', async ({ page }) => {
    // Create an entity to test loading
    await createEntity(page, 'network', testEntities.network);
    await page.goto(LOCAL_PAGE_URL);
    
    // Click sync button and check loading state
    await page.click('button:has-text("Sync All to Broadstreet")');
    await page.click('button:has-text("OK")');
    
    // Check that button is disabled during sync
    const syncButton = page.locator('button:has-text("Sync All to Broadstreet")');
    await expect(syncButton).toBeDisabled();
  });
});

// Cleanup test - runs after all tests
test.afterAll(async ({ page }) => {
  // Clean up any test entities that might have been created
  await page.goto(LOCAL_PAGE_URL);
  
  // Delete all local entities to clean up
  const deleteAllButton = page.locator('button:has-text("Delete All Local")');
  if (await deleteAllButton.count() > 0) {
    await deleteAllButton.click();
    await page.click('button:has-text("OK")');
    await page.waitForTimeout(2000);
  }
});
