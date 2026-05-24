import { test, expect } from '@playwright/test';
import { signIn } from './auth';

test.describe('Groups Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.click('a:has-text("Permission Groups")');
    await expect(page).toHaveURL(/\/app\/groups/);
  });

  test('displays default system groups', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('Administrators')).toBeVisible();
    await expect(main.getByText('Editors')).toBeVisible();
    await expect(main.getByText('Members').first()).toBeVisible();
  });

  test('system groups show System badge', async ({ page }) => {
    const adminRow = page.locator('tr', { hasText: 'Administrators' });
    await expect(adminRow.getByText('System')).toBeVisible();
  });

  test('system groups do not show Delete button', async ({ page }) => {
    const adminRow = page.locator('tr', { hasText: 'Administrators' });
    await expect(adminRow.getByText('Delete')).not.toBeVisible();
  });

  test('New Group button navigates to form', async ({ page }) => {
    await page.click('button:has-text("New Group")');
    await expect(page).toHaveURL(/\/app\/groups\/new/);
    await expect(page.getByText('New Group')).toBeVisible();
  });

  test('group name link navigates to edit form', async ({ page }) => {
    await page.click('a:has-text("Editors")');
    await expect(page).toHaveURL(/\/app\/groups\/.+/);
    await expect(page.getByText('Edit Group')).toBeVisible();
  });

  test('system group form is read-only', async ({ page }) => {
    await page.click('a:has-text("Administrators")');
    await expect(page).toHaveURL(/\/app\/groups\/.+/);
    // Name should be disabled for system groups
    const nameInput = page.locator('#name');
    await expect(nameInput).toBeDisabled();
    // No submit button for system groups
    await expect(page.getByText('Update Group')).not.toBeVisible();
  });
});

test.describe('Group CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('validates name is required', async ({ page }) => {
    await page.goto('/app/groups/new');
    await page.fill('#name', '');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Name is required')).toBeVisible();
  });

  test('cancel returns to groups list', async ({ page }) => {
    await page.goto('/app/groups/new');
    await page.click('button:has-text("Cancel")');
    await expect(page).toHaveURL(/\/app\/groups$/);
  });

  test('creates, edits, and deletes a group', async ({ page }) => {
    const main = page.locator('main');

    // Create
    await page.goto('/app/groups/new');
    await page.fill('#name', 'E2E Test Group');
    await page.fill('#description', 'A group created by E2E tests.');
    const booksViewCheckbox = page.locator('label:has-text("View books") button[role="checkbox"], label:has-text("View books") input[type="checkbox"]');
    await booksViewCheckbox.first().click();
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/groups$/);
    await expect(main.getByText('E2E Test Group')).toBeVisible();

    // Verify custom group has Delete button and no System badge
    const row = page.locator('tr', { hasText: 'E2E Test Group' });
    await expect(row.getByText('Delete')).toBeVisible();
    await expect(row.getByText('System')).not.toBeVisible();

    // Edit
    await main.locator('a:has-text("E2E Test Group")').click();
    await page.fill('#name', 'E2E Test Group (Updated)');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app\/groups$/);
    await expect(main.getByText('E2E Test Group (Updated)')).toBeVisible();

    // Delete
    const updatedRow = page.locator('tr', { hasText: 'E2E Test Group (Updated)' });
    await updatedRow.getByText('Delete').click();
    await page.locator('[role="dialog"] button:has-text("Delete")').click();
    await expect(main.getByText('E2E Test Group (Updated)')).not.toBeVisible();
  });
});
