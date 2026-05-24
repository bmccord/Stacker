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
    const main = page.locator('main');
    await page.fill('input[placeholder*="Search"]', 'e2e');
    await expect(main.getByText('e2e@test.com')).toBeVisible();
  });

  test('Invite User button opens dialog', async ({ page }) => {
    await page.locator('main').locator('button:has-text("Invite User")').click();
    await expect(page.locator('[role="dialog"]').getByText('Invite User', { exact: true })).toBeVisible();
    await expect(page.locator('#invite-email')).toBeVisible();
  });

  test('does not show Remove button for current user', async ({ page }) => {
    const row = page.locator('tr', { hasText: 'e2e@test.com' });
    await expect(row.getByText('Edit Groups')).toBeVisible();
    await expect(row.getByText('Remove')).not.toBeVisible();
  });
});

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/app/users');
  });

  test('invites, edits groups, and removes a user', async ({ page }) => {
    const main = page.locator('main');

    // Invite
    await main.locator('button:has-text("Invite User")').click();
    await page.fill('#invite-email', 'invited@test.com');
    const groupCheckbox = page.locator('[role="dialog"] label:has-text("Members") button[role="checkbox"], [role="dialog"] label:has-text("Members") input[type="checkbox"]');
    await groupCheckbox.first().click();
    await page.click('button:has-text("Send Invite")');
    await expect(main.getByText('invited@test.com')).toBeVisible({ timeout: 10000 });

    // Duplicate invite shows error
    await main.locator('button:has-text("Invite User")').click();
    await page.fill('#invite-email', 'invited@test.com');
    await page.click('button:has-text("Send Invite")');
    await expect(page.getByText('already exists').first()).toBeVisible({ timeout: 5000 });
    // Close the dialog via Cancel button and wait for it to disappear
    await page.locator('[role="dialog"] button:has-text("Cancel")').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Edit groups
    const row = page.locator('tr', { hasText: 'invited@test.com' });
    await row.getByText('Edit Groups').click();
    await expect(page.locator('[role="dialog"]').getByText('Edit Groups for')).toBeVisible();
    await page.click('button:has-text("Update Groups")');
    await expect(page.getByText('Groups updated').first()).toBeVisible({ timeout: 5000 });

    // Remove
    await row.getByText('Remove').click();
    await expect(page.locator('[role="dialog"]').getByText('Remove User')).toBeVisible();
    await page.locator('[role="dialog"] button:has-text("Delete")').click();
    await expect(main.getByText('invited@test.com')).not.toBeVisible({ timeout: 5000 });
  });
});
