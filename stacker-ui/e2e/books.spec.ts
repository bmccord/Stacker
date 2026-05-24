import { test, expect } from '@playwright/test';
import { signIn } from './auth';

test.describe('Books', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.click('a:has-text("Books")');
    await expect(page).toHaveURL(/\/app\/books/);
  });

  test('displays books list with seeded data', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('The Hobbit')).toBeVisible();
    await expect(main.getByText('1984')).toBeVisible();
    await expect(main.getByText('Dune')).toBeVisible();
  });

  test('shows author names in table', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('J.R.R. Tolkien').first()).toBeVisible();
    await expect(main.getByText('George Orwell').first()).toBeVisible();
  });

  test('search filters books by title', async ({ page }) => {
    const main = page.locator('main');
    await page.fill('input[placeholder*="Search"]', 'Hobbit');
    await expect(main.getByText('The Hobbit')).toBeVisible();
    await expect(main.getByText('1984')).not.toBeVisible();
  });

  test('search filters books by author', async ({ page }) => {
    const main = page.locator('main');
    await page.fill('input[placeholder*="Search"]', 'Orwell');
    await expect(main.getByText('1984')).toBeVisible();
    await expect(main.getByText('Animal Farm')).toBeVisible();
    await expect(main.getByText('The Hobbit')).not.toBeVisible();
  });

  test('Add Book button navigates to new book form', async ({ page }) => {
    await page.click('button:has-text("Add Book")');
    await expect(page).toHaveURL(/\/app\/books\/new/);
    await expect(page.locator('main').getByText('New Book')).toBeVisible();
  });

  test('book title link navigates to edit form', async ({ page }) => {
    await page.locator('main').locator('a:has-text("The Hobbit")').click();
    await expect(page).toHaveURL(/\/app\/books\/.+/);
    await expect(page.locator('main').getByText('Edit Book')).toBeVisible();
  });

  test('creates, edits, and deletes a book', async ({ page }) => {
    // Create
    await page.click('button:has-text("Add Book")');
    await page.fill('#title', 'E2E Test Book');
    // Select author (first combobox on the page)
    await page.locator('button[role="combobox"]').first().click();
    await page.click('[role="option"]:has-text("J.R.R. Tolkien")');
    await page.fill('#description', 'A book created by E2E tests.');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/books$/);
    await expect(page.locator('main').getByText('E2E Test Book')).toBeVisible();

    // Edit
    await page.locator('main').locator('a:has-text("E2E Test Book")').click();
    await expect(page.locator('main').getByText('Edit Book')).toBeVisible();
    await page.fill('#title', 'E2E Test Book (Updated)');
    // Re-select author (form may not pre-populate the select on load)
    await page.locator('button[role="combobox"]').first().click();
    await page.click('[role="option"]:has-text("J.R.R. Tolkien")');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/books', { timeout: 10000 });
    await expect(page.locator('main').getByText('E2E Test Book (Updated)')).toBeVisible();

    // Delete
    const row = page.locator('tr', { hasText: 'E2E Test Book (Updated)' });
    await row.locator('button:has-text("Delete")').click();
    await page.locator('[role="dialog"] button:has-text("Delete")').click();
    await expect(page.locator('main').getByText('E2E Test Book (Updated)')).not.toBeVisible();
  });
});
