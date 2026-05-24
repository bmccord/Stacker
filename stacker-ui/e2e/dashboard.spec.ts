import { test, expect } from '@playwright/test';
import { signIn } from './auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('displays stat cards', async ({ page }) => {
    await expect(page.getByText('Books')).toBeVisible();
    await expect(page.getByText('Authors')).toBeVisible();
    await expect(page.getByText('Reviews')).toBeVisible();
    await expect(page.getByText('Users')).toBeVisible();
  });

  test('shows non-zero counts after seeding', async ({ page }) => {
    // Seed data includes 5 authors and 8 books
    const booksCard = page.locator('text=Books').locator('..');
    await expect(booksCard).toContainText(/[1-9]/);
  });
});
