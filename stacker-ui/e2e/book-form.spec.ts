import { test, expect } from '@playwright/test';
import { signIn } from './auth';

test.describe('Book Form', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('create form shows correct title and empty fields', async ({ page }) => {
    await page.goto('/app/books/new');
    await expect(page.getByText('New Book', { exact: true })).toBeVisible();
    await expect(page.locator('#title')).toHaveValue('');
    await expect(page.locator('#description')).toHaveValue('');
  });

  test('edit form loads existing data', async ({ page }) => {
    // Navigate to a seeded book
    await page.goto('/app/books');
    await page.click('a:has-text("The Hobbit")');
    await expect(page.getByText('Edit Book')).toBeVisible();
    await expect(page.locator('#title')).toHaveValue('The Hobbit');
  });

  test('validates title is required', async ({ page }) => {
    await page.goto('/app/books/new');
    await page.fill('#title', '');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Title is required')).toBeVisible();
  });

  test('validates author is required', async ({ page }) => {
    await page.goto('/app/books/new');
    await page.fill('#title', 'Some Book');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Author is required')).toBeVisible();
  });

  test('author dropdown shows available authors', async ({ page }) => {
    await page.goto('/app/books/new');
    await page.click('[role="combobox"]:near(:text("Author"))');
    await expect(page.getByRole('option', { name: 'J.R.R. Tolkien' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'George Orwell' })).toBeVisible();
  });

  test('genre dropdown shows options', async ({ page }) => {
    await page.goto('/app/books/new');
    await page.locator('button[role="combobox"]').filter({ hasText: /Select a genre|Genre/ }).click();
    await expect(page.getByRole('option', { name: 'Fantasy' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Science Fiction' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Mystery' })).toBeVisible();
  });

  test('cancel returns to books list', async ({ page }) => {
    await page.goto('/app/books/new');
    await page.click('button:has-text("Cancel")');
    await expect(page).toHaveURL(/\/app\/books$/);
  });

  test('description and cover URL are optional', async ({ page }) => {
    await page.goto('/app/books/new');
    await page.fill('#title', 'Optional Fields Test');
    await page.click('[role="combobox"]:near(:text("Author"))');
    await page.click('[role="option"]:has-text("George Orwell")');
    // Don't fill description or cover URL
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/books$/);
    await expect(page.getByText('Optional Fields Test')).toBeVisible();

    // Clean up
    const row = page.locator('tr', { hasText: 'Optional Fields Test' });
    await row.locator('button:has-text("Delete")').click();
    await page.locator('[role="dialog"] button:has-text("Delete")').click();
  });
});
