import { test, expect } from '@playwright/test';
import { signIn } from './auth';

test.describe('Books', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.click('a:has-text("Books")');
    await expect(page).toHaveURL(/\/app\/books/);
  });

  test('displays books list with seeded data', async ({ page }) => {
    await expect(page.getByText('The Hobbit')).toBeVisible();
    await expect(page.getByText('1984')).toBeVisible();
    await expect(page.getByText('Dune')).toBeVisible();
  });

  test('shows author names in table', async ({ page }) => {
    await expect(page.getByText('J.R.R. Tolkien')).toBeVisible();
    await expect(page.getByText('George Orwell')).toBeVisible();
  });

  test('search filters books by title', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Hobbit');
    await expect(page.getByText('The Hobbit')).toBeVisible();
    await expect(page.getByText('1984')).not.toBeVisible();
  });

  test('search filters books by author', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Orwell');
    await expect(page.getByText('1984')).toBeVisible();
    await expect(page.getByText('Animal Farm')).toBeVisible();
    await expect(page.getByText('The Hobbit')).not.toBeVisible();
  });

  test('Add Book button navigates to new book form', async ({ page }) => {
    await page.click('button:has-text("Add Book")');
    await expect(page).toHaveURL(/\/app\/books\/new/);
    await expect(page.getByText('New Book')).toBeVisible();
  });

  test('book title link navigates to edit form', async ({ page }) => {
    await page.click('a:has-text("The Hobbit")');
    await expect(page).toHaveURL(/\/app\/books\/.+/);
    await expect(page.getByText('Edit Book')).toBeVisible();
  });
});

test.describe('Book CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  let bookId: string;

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('creates a new book', async ({ page }) => {
    await page.goto('/app/books/new');
    await page.fill('#title', 'E2E Test Book');

    // Select author
    await page.click('[role="combobox"]:near(:text("Author"))');
    await page.click('[role="option"]:has-text("J.R.R. Tolkien")');

    // Select genre
    await page.locator('button[role="combobox"]').filter({ hasText: /Select a genre|Genre/ }).click();
    await page.click('[role="option"]:has-text("Fantasy")');

    await page.fill('#description', 'A book created by E2E tests.');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/app\/books$/);
    await expect(page.getByText('E2E Test Book')).toBeVisible();

    // Capture the book ID from the link for later tests
    const link = page.locator('a:has-text("E2E Test Book")');
    const href = await link.getAttribute('href');
    bookId = href!.replace('/app/books/', '');
  });

  test('edits the book', async ({ page }) => {
    await page.goto(`/app/books/${bookId}`);
    await expect(page.getByText('Edit Book')).toBeVisible();

    await page.fill('#title', 'E2E Test Book (Updated)');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/app\/books$/);
    await expect(page.getByText('E2E Test Book (Updated)')).toBeVisible();
  });

  test('deletes the book', async ({ page }) => {
    await page.goto('/app/books');
    // Find the delete button in the row with our test book
    const row = page.locator('tr', { hasText: 'E2E Test Book (Updated)' });
    await row.locator('button:has-text("Delete")').click();

    // Confirm deletion dialog
    await expect(page.getByText('Delete Book')).toBeVisible();
    await page.click('button:has-text("Delete"):not(:has-text("Delete Book"))');

    await expect(page.getByText('E2E Test Book (Updated)')).not.toBeVisible();
  });
});
