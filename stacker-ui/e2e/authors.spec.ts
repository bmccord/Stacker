import { test, expect } from '@playwright/test';
import { signIn } from './auth';

test.describe('Authors', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.click('a:has-text("Authors")');
    await expect(page).toHaveURL(/\/app\/authors/);
  });

  test('displays authors list with seeded data', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('J.R.R. Tolkien')).toBeVisible();
    await expect(main.getByText('George Orwell')).toBeVisible();
    await expect(main.getByText('Jane Austen')).toBeVisible();
  });

  test('shows book counts', async ({ page }) => {
    const tolkienRow = page.locator('tr', { hasText: 'J.R.R. Tolkien' });
    await expect(tolkienRow).toContainText('2');
  });

  test('search filters authors', async ({ page }) => {
    const main = page.locator('main');
    await page.fill('input[placeholder*="Search"]', 'Tolkien');
    await expect(main.getByText('J.R.R. Tolkien')).toBeVisible();
    await expect(main.getByText('George Orwell')).not.toBeVisible();
  });

  test('Add Author button navigates to new form', async ({ page }) => {
    await page.click('button:has-text("Add Author")');
    await expect(page).toHaveURL(/\/app\/authors\/new/);
    await expect(page.locator('main').getByText('New Author')).toBeVisible();
  });

  test('author name link navigates to edit form', async ({ page }) => {
    await page.locator('main').locator('a:has-text("Jane Austen")').click();
    await expect(page).toHaveURL(/\/app\/authors\/.+/);
    await expect(page.locator('main').getByText('Edit Author')).toBeVisible();
  });

  test('validates name is required', async ({ page }) => {
    await page.goto('/app/authors/new');
    await page.fill('#name', '');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Name is required')).toBeVisible();
  });

  test('cancel returns to authors list', async ({ page }) => {
    await page.goto('/app/authors/new');
    await page.click('button:has-text("Cancel")');
    await expect(page).toHaveURL(/\/app\/authors$/);
  });

  test('creates, edits, and deletes an author', async ({ page }) => {
    // Create
    await page.click('button:has-text("Add Author")');
    await page.fill('#name', 'E2E Test Author');
    await page.fill('#bio', 'An author created by E2E tests.');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/authors$/);
    await expect(page.locator('main').getByText('E2E Test Author')).toBeVisible();

    // Edit
    await page.locator('main').locator('a:has-text("E2E Test Author")').click();
    await page.fill('#name', 'E2E Test Author (Updated)');
    await page.fill('#bio', 'Updated bio.');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/authors$/);
    await expect(page.locator('main').getByText('E2E Test Author (Updated)')).toBeVisible();

    // Delete
    const row = page.locator('tr', { hasText: 'E2E Test Author (Updated)' });
    await row.locator('button:has-text("Delete")').click();
    await page.locator('[role="dialog"] button:has-text("Delete")').click();
    await expect(page.locator('main').getByText('E2E Test Author (Updated)')).not.toBeVisible();
  });
});
