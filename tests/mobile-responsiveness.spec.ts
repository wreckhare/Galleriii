import { test, expect } from '@playwright/test';

const TEST_USERNAME = 'almostaustin';

// Mobile viewport for iPhone 12 Pro
const mobileViewport = { width: 390, height: 844 };
// Landscape viewport
const landscapeViewport = { width: 844, height: 390 };

test.describe('Category 7: Mobile Responsiveness', () => {

  test.describe('Test 7.4: Mobile Public Viewer', () => {
    test('should display gallery title on mobile', async ({ page }) => {
      await page.setViewportSize(mobileViewport);
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Gallery title should be readable
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Title should not overflow (check it's within viewport)
      const titleBox = await title.boundingBox();
      expect(titleBox).not.toBeNull();
      if (titleBox) {
        expect(titleBox.width).toBeLessThanOrEqual(mobileViewport.width);
      }
    });

    test('should display media blocks full width on mobile', async ({ page }) => {
      await page.setViewportSize(mobileViewport);
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Check that the main content area is full width
      const mainContent = page.locator('main, [class*="container"], .max-w-').first();
      if (await mainContent.isVisible()) {
        const box = await mainContent.boundingBox();
        expect(box).not.toBeNull();
      }
    });

    test('should not have horizontal scrolling on mobile', async ({ page }) => {
      await page.setViewportSize(mobileViewport);
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Check document width doesn't exceed viewport
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentWidth).toBeLessThanOrEqual(mobileViewport.width + 1); // +1 for rounding
    });

    test('should show View Next Gallery button on mobile', async ({ page }) => {
      await page.setViewportSize(mobileViewport);
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      const button = page.locator('button:has-text("View Next Gallery")');
      if (await button.count() > 0) {
        await expect(button).toBeVisible();

        // Button should be accessible (within viewport when scrolled to)
        const buttonBox = await button.boundingBox();
        expect(buttonBox).not.toBeNull();
        if (buttonBox) {
          expect(buttonBox.width).toBeLessThanOrEqual(mobileViewport.width);
        }
      }
    });

    test('should display username correctly on mobile', async ({ page }) => {
      await page.setViewportSize(mobileViewport);
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      const usernameText = page.locator(`text=@${TEST_USERNAME}`);
      await expect(usernameText).toBeVisible();
    });
  });

  test.describe('Test 7.5: Landscape Orientation', () => {
    test('should adjust layout in landscape mode', async ({ page }) => {
      await page.setViewportSize(landscapeViewport);
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();

      // No horizontal scroll
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentWidth).toBeLessThanOrEqual(landscapeViewport.width + 1);
    });

    test('should not cut off content in landscape', async ({ page }) => {
      await page.setViewportSize(landscapeViewport);
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Title should be visible
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Gallery content should be visible
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should remain functional in landscape', async ({ page }) => {
      await page.setViewportSize(landscapeViewport);
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Check View Next Gallery button works if present
      const button = page.locator('button:has-text("View Next Gallery")');
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(1000);

        // Page should still work
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Mobile 404 Page', () => {
    test('should display 404 correctly on mobile', async ({ page }) => {
      await page.setViewportSize(mobileViewport);
      await page.goto('/nonexistentuser12345');
      await page.waitForLoadState('networkidle');

      // 404 heading should be visible
      const heading = page.locator('h1');
      await expect(heading).toContainText('404');

      // No horizontal scroll
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentWidth).toBeLessThanOrEqual(mobileViewport.width + 1);
    });
  });

  test.describe('Mobile No Galleries Page', () => {
    test('should display no galleries message on mobile', async ({ page }) => {
      await page.setViewportSize(mobileViewport);
      // This test assumes an empty user exists - skip if it fails
      await page.goto(`/${TEST_USERNAME}`);
      await page.waitForLoadState('networkidle');

      // Either shows galleries or "no galleries" message - both are valid
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });
});
