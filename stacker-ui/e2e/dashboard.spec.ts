import { test, expect } from '@playwright/test';
import { signIn } from './auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('displays stat cards', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('Books')).toBeVisible();
    await expect(main.getByText('Authors')).toBeVisible();
    await expect(main.getByText('Reviews')).toBeVisible();
    await expect(main.getByText('Users')).toBeVisible();
  });

  test('shows non-zero counts after seeding', async ({ page }) => {
    const main = page.locator('main');
    // Seed data includes 5 authors and 8 books
    const booksCard = main.locator('text=Books').locator('..');
    await expect(booksCard).toContainText(/[1-9]/);
  });
});
