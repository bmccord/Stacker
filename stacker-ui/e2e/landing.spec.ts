import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Stacker', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('production-ready GraphQL + React starter kit')).toBeVisible();
  });

  test('has Sign In button that navigates to sign-in', async ({ page }) => {
    await page.goto('/');
    await page.locator('main').locator('a:has-text("Sign In")').click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('has GitHub link', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a:has-text("View on GitHub")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://github.com/bmccord/Stacker');
  });

  test('displays feature cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('GraphQL + React')).toBeVisible();
    await expect(page.getByText('Auth & Permissions')).toBeVisible();
    await expect(page.getByText('Production-Ready')).toBeVisible();
    await expect(page.getByText('Developer Experience')).toBeVisible();
    await expect(page.getByText('Full Test Suite')).toBeVisible();
  });

  test('displays quick start code block', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Get started in 3 commands')).toBeVisible();
    await expect(page.getByText('yarn init-env')).toBeVisible();
  });

  test('displays bookshelf section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Included: Bookshelf App')).toBeVisible();
  });

  test('header shows Sign In button on landing page', async ({ page }) => {
    await page.goto('/');
    const headerSignIn = page.locator('header, [class*="bg-primary"]').locator('a:has-text("Sign In")');
    await expect(headerSignIn).toBeVisible();
  });

  test('header hides Sign In button on sign-in page', async ({ page }) => {
    await page.goto('/sign-in');
    // The header should not have a Sign In link when already on sign-in
    const headerLinks = page.locator('[class*="bg-primary"]').first().locator('a:has-text("Sign In")');
    await expect(headerLinks).not.toBeVisible();
  });
});
