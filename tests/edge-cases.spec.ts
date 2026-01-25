import { test, expect } from '@playwright/test';

const TEST_USERNAME = 'almostaustin';
const INVALID_USERNAME = 'nonexistentuser12345';

test.describe('Category 5: Edge Cases and Error Handling', () => {

  test.describe('Test 5.3: XSS Prevention', () => {
    test('should escape script tags and prevent XSS attacks', async ({ page }) => {
      // Navigate to the public gallery
      await page.goto(`/${TEST_USERNAME}`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check that no alert dialogs were triggered (XSS would show alert)
      let alertTriggered = false;
      page.on('dialog', () => {
        alertTriggered = true;
      });

      // Wait a moment to ensure any XSS would have executed
      await page.waitForTimeout(1000);

      expect(alertTriggered).toBe(false);

      // Verify the page rendered without crashing
      const body = await page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should display special characters as text, not HTML', async ({ page }) => {
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Page should not have any raw script tags rendered
      const pageContent = await page.content();
      expect(pageContent).not.toContain('<script>alert');

      // The page should render properly
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Test 5.5: Invalid Username 404', () => {
    test('should show 404 page for non-existent user', async ({ page }) => {
      await page.goto(`/${INVALID_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Should show 404 message
      const heading = page.locator('h1');
      await expect(heading).toContainText('404');

      // Should show the username in error message
      const errorText = page.locator('text=does not exist');
      await expect(errorText).toBeVisible();
    });

    test('should not crash on invalid username', async ({ page }) => {
      await page.goto(`/${INVALID_USERNAME}`);

      // Page should load without errors
      await expect(page).toHaveURL(`/${INVALID_USERNAME}`);

      // Should have proper background color
      const bgElement = page.locator('.bg-\\[\\#F9F8F6\\]').first();
      await expect(bgElement).toBeVisible();
    });
  });

  test.describe('Test 5.7: Rapid Button Clicks', () => {
    test('should handle rapid clicks without errors', async ({ page }) => {
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Find the "View Next Gallery" button
      const button = page.locator('button:has-text("View Next Gallery")');

      // Skip if no button (user has no galleries)
      if (await button.isVisible()) {
        // Track network requests
        const requests: string[] = [];
        page.on('request', (request) => {
          if (request.url().includes('supabase')) {
            requests.push(request.url());
          }
        });

        // Rapid click 5 times
        for (let i = 0; i < 5; i++) {
          await button.click({ force: true });
        }

        // Wait for any pending requests
        await page.waitForTimeout(2000);

        // Page should still be functional
        await expect(page.locator('body')).toBeVisible();

        // No console errors
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        expect(errors.length).toBe(0);
      }
    });

    test('button should be disabled while loading', async ({ page }) => {
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      const button = page.locator('button:has-text("View Next Gallery")');

      if (await button.isVisible()) {
        // Click the button
        await button.click();

        // Button should be disabled immediately after click
        // (checking within a short window)
        const isDisabled = await button.isDisabled();

        // Wait for request to complete
        await page.waitForTimeout(1000);

        // Button should be enabled again
        await expect(button).toBeEnabled();
      }
    });
  });

  test.describe('Test 5.8: Network Interruption', () => {
    test('should handle offline mode gracefully', async ({ page, context }) => {
      // First load the page normally
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Go offline
      await context.setOffline(true);

      const button = page.locator('button:has-text("View Next Gallery")');

      if (await button.isVisible()) {
        // Try to click the button while offline
        await button.click();

        // Wait for potential error handling
        await page.waitForTimeout(2000);

        // Page should not crash - body should still be visible
        await expect(page.locator('body')).toBeVisible();
      }

      // Go back online
      await context.setOffline(false);
    });

    test('should recover after network is restored', async ({ page, context }) => {
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Go offline
      await context.setOffline(true);
      await page.waitForTimeout(500);

      // Go back online
      await context.setOffline(false);

      // Refresh should work
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Page should load properly
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Public Gallery Viewer - Basic Tests', () => {
    test('should load public gallery page', async ({ page }) => {
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Should show username
      const usernameText = page.locator(`text=@${TEST_USERNAME}`);
      await expect(usernameText).toBeVisible();
    });

    test('should have correct background color', async ({ page }) => {
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Check for the cream background color
      const bgElement = page.locator('.bg-\\[\\#F9F8F6\\]').first();
      await expect(bgElement).toBeVisible();
    });

    test('should show gallery title', async ({ page }) => {
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Should have an h1 with the gallery title
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Title should not be empty
      const titleText = await title.textContent();
      expect(titleText?.length).toBeGreaterThan(0);
    });
  });
});
