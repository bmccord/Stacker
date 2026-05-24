import { test, expect } from '@playwright/test';
import { signIn } from './auth';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('shows Content section links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Books' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Authors' })).toBeVisible();
  });

  test('shows Administration section links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Permission Groups' })).toBeVisible();
  });

  test('navigates to Books page', async ({ page }) => {
    await page.click('a:has-text("Books")');
    await expect(page).toHaveURL(/\/app\/books/);
  });

  test('navigates to Authors page', async ({ page }) => {
    await page.click('a:has-text("Authors")');
    await expect(page).toHaveURL(/\/app\/authors/);
  });

  test('navigates to Users page', async ({ page }) => {
    await page.click('a:has-text("Users")');
    await expect(page).toHaveURL(/\/app\/users/);
  });

  test('navigates to Permission Groups page', async ({ page }) => {
    await page.click('a:has-text("Permission Groups")');
    await expect(page).toHaveURL(/\/app\/groups/);
  });

  test('Stacker logo navigates to dashboard', async ({ page }) => {
    await page.click('a:has-text("Books")');
    await expect(page).toHaveURL(/\/app\/books/);
    await page.click('button:has-text("Stacker")');
    await expect(page).toHaveURL(/\/app$/);
  });

  test('shows user info in sidebar', async ({ page }) => {
    await expect(page.getByText('E2E Admin')).toBeVisible();
    await expect(page.getByText('e2e@test.com')).toBeVisible();
  });

  test('sign out button works', async ({ page }) => {
    await page.click('[title="Sign out"]');
    await expect(page).toHaveURL(/\/sign-in|\/$/);
  });
});
