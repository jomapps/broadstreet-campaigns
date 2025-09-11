# Local Page Testing Guide

This directory contains comprehensive Playwright tests for the Local Page functionality.

## Test Overview

The `local-page.spec.ts` file contains tests that cover:

### ✅ Entity Creation and Display
- Creating entities of each type (Networks, Advertisers, Zones, Campaigns, Advertisements)
- Verifying entities appear on the local page
- Checking entity-specific details and formatting

### ✅ Sync Functionality
- Testing the "Sync All to Broadstreet" workflow
- Verifying progress modal displays correctly
- Testing dry run validation and name conflict resolution
- Error handling during sync operations

### ✅ Delete Functionality
- Individual entity deletion
- "Delete All Local" functionality
- Confirmation dialogs and cleanup

### ✅ UI/UX Testing
- Responsive design across different viewport sizes
- Loading states and button interactions
- Progress modal functionality
- Error message display

## Running Tests

### Prerequisites
1. Install Playwright: `pnpm install`
2. Install Playwright browsers: `npx playwright install`
3. Ensure the development server is running: `pnpm dev`

### Test Commands

```bash
# Run all tests
pnpm test

# Run tests with UI (interactive mode)
pnpm test:ui

# Run tests in headed mode (see browser)
pnpm test:headed

# Run only local page tests
pnpm test:local-page

# Run specific test file
npx playwright test tests/local-page.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

### Test Configuration

The tests are configured to:
- Run against `http://localhost:3005`
- Automatically start the dev server before tests
- Take screenshots and videos on failure
- Retry failed tests on CI
- Test across multiple browsers (Chrome, Firefox, Safari)
- Test mobile and desktop viewports

## Test Data

Tests use predefined test entities to ensure consistency:

```typescript
const testEntities = {
  network: {
    name: 'Test Network',
    group_id: 1,
    web_home_url: 'https://testnetwork.com',
    // ... other properties
  },
  // ... other entity types
};
```

## Test Environment Setup

### Environment Variables
Ensure these are set in your `.env.local`:
```env
BROADSTREET_API_KEY=your_test_api_key
MONGODB_URI=your_test_mongodb_connection
```

### Database Cleanup
Tests automatically clean up created entities after completion to maintain a clean test environment.

## Test Results

### Success Criteria
- All entity creation tests pass
- Sync workflow completes successfully
- Progress modal displays correctly
- Delete operations work as expected
- No console errors during tests
- Responsive design works across viewports

### Failure Investigation
When tests fail:
1. Check the HTML report: `npx playwright show-report`
2. Review screenshots in `test-results/`
3. Check browser console for JavaScript errors
4. Verify API endpoints are responding correctly
5. Ensure database connection is working

## Continuous Integration

Tests are configured to run in CI environments with:
- Reduced parallelism for stability
- Automatic retries on failure
- HTML report generation
- Screenshot and video capture on failure

## Debugging Tests

### Debug Mode
```bash
# Run tests in debug mode
npx playwright test --debug

# Debug specific test
npx playwright test tests/local-page.spec.ts --debug
```

### Test Isolation
Each test is designed to be independent and can be run in isolation. Tests clean up after themselves to avoid interference.

### Common Issues
1. **Timeout errors**: Increase timeout in test configuration
2. **Element not found**: Check if test data attributes are properly set
3. **API errors**: Verify environment variables and API connectivity
4. **Database issues**: Ensure MongoDB connection is working

## Adding New Tests

When adding new tests:
1. Follow the existing test structure
2. Use descriptive test names
3. Add appropriate test data attributes to components
4. Include cleanup in test teardown
5. Test both success and failure scenarios
6. Consider responsive design testing

## Test Maintenance

- Update test data when entity models change
- Add new test cases for new features
- Review and update selectors when UI changes
- Keep test data realistic and representative
- Monitor test performance and optimize as needed
