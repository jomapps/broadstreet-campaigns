# Testing Guide

**Application**: Broadstreet Campaigns  
**Testing Framework**: Playwright  
**Purpose**: Comprehensive testing strategy and implementation guide  

## 🎯 Testing Overview

The Broadstreet Campaigns application uses Playwright for end-to-end testing, covering the complete user workflow from entity creation to API synchronization.

### **Testing Philosophy**
- **Real API Integration**: Tests use actual Broadstreet API (no mocks)
- **Complete Workflows**: Test entire user journeys, not just individual functions
- **Local Entity Focus**: Emphasize local creation and sync workflows
- **Error Scenarios**: Include failure cases and recovery testing

## 🛠️ Test Environment Setup

### **Prerequisites**
```bash
# Install Playwright
npm install @playwright/test

# Install browsers
npx playwright install

# Verify installation
npx playwright --version
```

### **Configuration**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3005',
    reuseExistingServer: !process.env.CI,
  },
});
```

### **Environment Variables**
```bash
# .env.test
MONGODB_URI=mongodb://localhost:27017/broadstreet-campaigns-test
BROADSTREET_API_BASE_URL=https://api.broadstreetads.com/api/1
BROADSTREET_API_TOKEN=test_token_here
NEXT_PUBLIC_APP_NAME=Broadstreet Campaigns (Test)
```

## 📝 Test Structure

### **Test Organization**
```
tests/
├── README.md                      # Test documentation
├── advertiser-creation.spec.ts    # Advertiser creation workflow
├── campaign-creation.spec.ts      # Campaign creation workflow
├── local-page.spec.ts            # Local Only dashboard
├── placement-creation.spec.ts     # Placement creation utility
├── zone-creation.spec.ts          # Zone creation workflow
└── fixtures/                     # Test data and utilities
    ├── test-data.ts              # Sample test data
    └── helpers.ts                # Test helper functions
```

### **Test Naming Convention**
```typescript
// Format: [feature].[workflow].spec.ts
// Examples:
advertiser-creation.spec.ts    // Advertiser creation workflow
sync-operations.spec.ts        // Sync functionality
filter-system.spec.ts          // Filtering and navigation
error-handling.spec.ts         // Error scenarios
```

## 🧪 Core Test Patterns

### **Entity Creation Test Pattern**
```typescript
import { test, expect } from '@playwright/test';

test('advertiser creation workflow', async ({ page }) => {
  // 1. Navigate to entity page
  await page.goto('/advertisers');
  await expect(page.locator('h1')).toContainText('Advertisers');

  // 2. Open creation modal
  await page.click('[data-testid="create-button"]');
  await expect(page.locator('[data-testid="creation-modal"]')).toBeVisible();

  // 3. Fill required fields
  const advertiserName = `Test Advertiser ${Date.now()}`;
  await page.fill('[data-testid="name-input"]', advertiserName);

  // 4. Submit form
  await page.click('[data-testid="submit-button"]');
  
  // 5. Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  
  // 6. Verify entity appears in list
  await expect(page.locator('[data-testid="entity-card"]').filter({ 
    hasText: advertiserName 
  })).toBeVisible();
  
  // 7. Verify local entity styling
  const entityCard = page.locator('[data-testid="entity-card"]').filter({ 
    hasText: advertiserName 
  });
  await expect(entityCard.locator('[data-testid="local-badge"]')).toBeVisible();
});
```

### **Sync Operation Test Pattern**
```typescript
test('local entity sync workflow', async ({ page }) => {
  // 1. Create local entity first
  await createTestAdvertiser(page, 'Sync Test Advertiser');
  
  // 2. Navigate to Local Only dashboard
  await page.goto('/local-only');
  
  // 3. Verify entity appears in local section
  await expect(page.locator('[data-testid="local-advertisers-section"]'))
    .toContainText('Sync Test Advertiser');
  
  // 4. Trigger sync operation
  await page.click('[data-testid="sync-all-button"]');
  
  // 5. Wait for sync completion
  await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
  
  // 6. Verify entity moved to production
  await page.goto('/advertisers');
  
  // 7. Verify synced entity styling (no local badge)
  const syncedCard = page.locator('[data-testid="entity-card"]').filter({ 
    hasText: 'Sync Test Advertiser' 
  });
  await expect(syncedCard).toBeVisible();
  await expect(syncedCard.locator('[data-testid="local-badge"]')).not.toBeVisible();
});
```

### **Filter System Test Pattern**
```typescript
test('hierarchical filtering workflow', async ({ page }) => {
  // 1. Navigate to main page
  await page.goto('/advertisers');
  
  // 2. Select network filter
  await page.selectOption('[data-testid="network-filter"]', '1');
  
  // 3. Verify URL reflects filter
  await expect(page).toHaveURL(/network_id=1/);
  
  // 4. Verify filtered results
  const entityCards = page.locator('[data-testid="entity-card"]');
  await expect(entityCards.first()).toBeVisible();
  
  // 5. Navigate to related page
  await page.goto('/campaigns');
  
  // 6. Verify filter persistence
  await expect(page.locator('[data-testid="network-filter"]')).toHaveValue('1');
  
  // 7. Select advertiser filter
  await page.selectOption('[data-testid="advertiser-filter"]', '2');
  
  // 8. Verify campaigns filtered by advertiser
  await expect(page.locator('[data-testid="campaign-card"]').first()).toBeVisible();
});
```

## 🎭 Test Utilities and Helpers

### **Test Data Generation**
```typescript
// fixtures/test-data.ts
export const generateTestAdvertiser = () => ({
  name: `Test Advertiser ${Date.now()}`,
  web_home_url: 'https://test-advertiser.com',
  notes: 'Generated for testing purposes'
});

export const generateTestCampaign = () => ({
  name: `Test Campaign ${Date.now()}`,
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  weight: 1
});

export const generateTestZone = () => ({
  name: `Test SQ Zone ${Date.now()}`,
  width: 300,
  height: 250,
  advertisement_count: 1
});
```

### **Helper Functions**
```typescript
// fixtures/helpers.ts
export async function createTestAdvertiser(page: Page, name?: string) {
  const advertiserName = name || `Test Advertiser ${Date.now()}`;
  
  await page.goto('/advertisers');
  await page.click('[data-testid="create-button"]');
  await page.fill('[data-testid="name-input"]', advertiserName);
  await page.click('[data-testid="submit-button"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  
  return advertiserName;
}

export async function cleanupTestData(page: Page, entityName: string) {
  await page.goto('/local-only');
  
  const deleteButton = page.locator('[data-testid="entity-card"]')
    .filter({ hasText: entityName })
    .locator('[data-testid="delete-button"]');
  
  if (await deleteButton.isVisible()) {
    await deleteButton.click();
    await page.click('[data-testid="confirm-delete"]');
  }
}

export async function setNetworkFilter(page: Page, networkId: string) {
  await page.selectOption('[data-testid="network-filter"]', networkId);
  await page.waitForURL(/network_id=/);
}
```

### **Page Object Model**
```typescript
// fixtures/pages/AdvertiserPage.ts
export class AdvertiserPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/advertisers');
    await expect(this.page.locator('h1')).toContainText('Advertisers');
  }

  async openCreateModal() {
    await this.page.click('[data-testid="create-button"]');
    await expect(this.page.locator('[data-testid="creation-modal"]')).toBeVisible();
  }

  async fillAdvertiserForm(data: { name: string; website?: string; notes?: string }) {
    await this.page.fill('[data-testid="name-input"]', data.name);
    
    if (data.website) {
      await this.page.fill('[data-testid="website-input"]', data.website);
    }
    
    if (data.notes) {
      await this.page.fill('[data-testid="notes-input"]', data.notes);
    }
  }

  async submitForm() {
    await this.page.click('[data-testid="submit-button"]');
    await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
  }

  async verifyAdvertiserExists(name: string) {
    await expect(this.page.locator('[data-testid="entity-card"]').filter({ 
      hasText: name 
    })).toBeVisible();
  }
}
```

## 🧩 Specific Test Scenarios

### **Entity Creation Tests**
```typescript
// Test all entity types
test.describe('Entity Creation', () => {
  test('create advertiser with minimal data', async ({ page }) => {
    const advertiserPage = new AdvertiserPage(page);
    const testData = generateTestAdvertiser();
    
    await advertiserPage.navigate();
    await advertiserPage.openCreateModal();
    await advertiserPage.fillAdvertiserForm({ name: testData.name });
    await advertiserPage.submitForm();
    await advertiserPage.verifyAdvertiserExists(testData.name);
  });

  test('create campaign with all optional fields', async ({ page }) => {
    // Create prerequisite advertiser first
    const advertiserName = await createTestAdvertiser(page);
    
    // Create campaign
    await page.goto('/campaigns');
    await page.click('[data-testid="create-button"]');
    
    const campaignName = `Test Campaign ${Date.now()}`;
    await page.fill('[data-testid="name-input"]', campaignName);
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    await page.selectOption('[data-testid="weight-select"]', '1');
    
    await page.click('[data-testid="submit-button"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="entity-card"]').filter({ 
      hasText: campaignName 
    })).toBeVisible();
  });
});
```

### **Sync Operation Tests**
```typescript
test.describe('Sync Operations', () => {
  test('sync individual entity type', async ({ page }) => {
    // Create test data
    const advertiserName = await createTestAdvertiser(page);
    
    // Navigate to Local Only
    await page.goto('/local-only');
    
    // Sync advertisers only
    await page.click('[data-testid="sync-advertisers-button"]');
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
    
    // Verify entity moved
    await expect(page.locator('[data-testid="local-advertisers-section"]'))
      .not.toContainText(advertiserName);
    
    // Verify in main list
    await page.goto('/advertisers');
    await expect(page.locator('[data-testid="entity-card"]').filter({ 
      hasText: advertiserName 
    })).toBeVisible();
  });

  test('handle sync conflicts gracefully', async ({ page }) => {
    // Create entity with potentially conflicting name
    const conflictName = 'Common Advertiser Name';
    await createTestAdvertiser(page, conflictName);
    
    // Attempt sync
    await page.goto('/local-only');
    await page.click('[data-testid="sync-all-button"]');
    
    // Should handle conflicts automatically
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
    
    // Verify conflict resolution (name modified)
    await page.goto('/advertisers');
    await expect(page.locator('[data-testid="entity-card"]').filter({ 
      hasText: 'Common Advertiser Name' 
    })).toBeVisible();
  });
});
```

### **Error Handling Tests**
```typescript
test.describe('Error Handling', () => {
  test('handle invalid form data', async ({ page }) => {
    await page.goto('/advertisers');
    await page.click('[data-testid="create-button"]');
    
    // Submit without required name
    await page.click('[data-testid="submit-button"]');
    
    // Verify validation error
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Name is required');
    
    // Verify modal stays open
    await expect(page.locator('[data-testid="creation-modal"]')).toBeVisible();
  });

  test('handle API connectivity issues', async ({ page }) => {
    // This would require mocking API failures
    // Implementation depends on specific error scenarios
  });
});
```

## 🎯 Test Data Management

### **Test Isolation**
```typescript
test.beforeEach(async ({ page }) => {
  // Clear any existing test data
  await cleanupTestData(page);
  
  // Set up fresh test environment
  await setDefaultFilters(page);
});

test.afterEach(async ({ page }) => {
  // Clean up created test data
  await cleanupTestData(page);
});
```

### **Data Cleanup Utilities**
```typescript
// Cleanup specific entity types
export async function cleanupTestAdvertisers(page: Page) {
  await page.goto('/local-only');
  
  const testCards = page.locator('[data-testid="entity-card"]')
    .filter({ hasText: /Test Advertiser/ });
  
  const count = await testCards.count();
  for (let i = 0; i < count; i++) {
    await testCards.nth(0).locator('[data-testid="delete-button"]').click();
    await page.click('[data-testid="confirm-delete"]');
  }
}

// Bulk cleanup via API
export async function cleanupViaAPI() {
  const response = await fetch('http://localhost:3005/api/test-utils/cleanup', {
    method: 'DELETE'
  });
  return response.json();
}
```

## 📊 Test Reporting

### **Running Tests**
```bash
# Run all tests
npm run test

# Run specific test file
npx playwright test tests/advertiser-creation.spec.ts

# Run tests with UI
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests with specific tag
npx playwright test --grep "@smoke"
```

### **Test Reports**
```bash
# Generate HTML report
npx playwright show-report

# Generate JSON report
npx playwright test --reporter=json

# Generate JUnit report
npx playwright test --reporter=junit
```

### **Debugging Tests**
```typescript
// Add debug points
test('debug example', async ({ page }) => {
  await page.pause(); // Pauses execution for manual inspection
  
  // Step through test
  await page.step('Navigate to page', async () => {
    await page.goto('/advertisers');
  });
  
  await page.step('Create advertiser', async () => {
    await page.click('[data-testid="create-button"]');
  });
});
```

## 🚨 Common Testing Patterns

### **Test Organization Tips**
1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the scenario
3. **Keep tests independent** - no test should depend on another
4. **Use data-testid attributes** for reliable element selection
5. **Mock external dependencies** when necessary

### **Performance Considerations**
1. **Parallelize tests** when possible
2. **Use page.waitFor* methods** for reliable waits
3. **Minimize test data creation** - use minimal viable data
4. **Clean up efficiently** - bulk operations when possible
5. **Reuse browser contexts** for related tests

### **Maintenance Best Practices**
1. **Update test data generators** when models change
2. **Review test failures** regularly for flakiness
3. **Keep test utilities** up to date with application changes
4. **Document complex test scenarios** for future maintainers
5. **Use version control** for test configuration changes

---

**Next Steps**: Review existing test files in the `tests/` directory and run the test suite to verify your development environment is properly configured.
