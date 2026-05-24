import { test, expect } from '@playwright/test';
import { signIn } from './auth';

test.describe('Users Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.click('a:has-text("Users")');
    await expect(page).toHaveURL(/\/app\/users/);
  });

  test('displays users list', async ({ page }) => {
    await expect(page.getByText('e2e@test.com')).toBeVisible();
  });

  test('shows user groups as badges', async ({ page }) => {
    const row = page.locator('tr', { hasText: 'e2e@test.com' });
    await expect(row.locator('text=Administrators')).toBeVisible();
  });

  test('search filters users', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'e2e');
    await expect(page.getByText('e2e@test.com')).toBeVisible();
  });

  test('Invite User button opens dialog', async ({ page }) => {
    await page.click('button:has-text("Invite User")');
    await expect(page.getByText('Invite User', { exact: true })).toBeVisible();
    await expect(page.locator('#invite-email')).toBeVisible();
  });

  test('does not show Remove button for current user', async ({ page }) => {
    const row = page.locator('tr', { hasText: 'e2e@test.com' });
    await expect(row.getByText('Edit Groups')).toBeVisible();
    await expect(row.getByText('Remove')).not.toBeVisible();
  });
});

test.describe('User Invite', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/app/users');
  });

  test('invites a new user', async ({ page }) => {
    await page.click('button:has-text("Invite User")');
    await page.fill('#invite-email', 'invited@test.com');
    // Select a group
    const groupCheckbox = page.locator('label:has-text("Members") input[type="checkbox"], label:has-text("Members") button[role="checkbox"]');
    await groupCheckbox.first().click();
    await page.click('button:has-text("Send Invite")');

    // Wait for dialog to close and user to appear
    await expect(page.getByText('invited@test.com')).toBeVisible({ timeout: 10000 });
  });

  test('shows error for duplicate email', async ({ page }) => {
    await page.click('button:has-text("Invite User")');
    await page.fill('#invite-email', 'invited@test.com');
    await page.click('button:has-text("Send Invite")');

    await expect(page.getByText('already exists')).toBeVisible({ timeout: 5000 });
  });

  test('edit groups dialog works', async ({ page }) => {
    const row = page.locator('tr', { hasText: 'invited@test.com' });
    await row.getByText('Edit Groups').click();

    await expect(page.getByText('Edit Groups for')).toBeVisible();
    await page.click('button:has-text("Update Groups")');
    await expect(page.getByText('Groups updated')).toBeVisible({ timeout: 5000 });
  });

  test('removes the invited user', async ({ page }) => {
    const row = page.locator('tr', { hasText: 'invited@test.com' });
    await row.getByText('Remove').click();

    await expect(page.getByText('Remove User')).toBeVisible();
    await page.locator('[role="dialog"] button:has-text("Delete")').click();

    await expect(page.getByText('invited@test.com')).not.toBeVisible({ timeout: 5000 });
  });
});
