import { test, expect } from '@playwright/test';
import { signIn } from './auth';

test.describe('Change Password', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('opens change password dialog from sidebar', async ({ page }) => {
    await page.click('[title="Change password"]');
    await expect(page.getByText('Change Password', { exact: true })).toBeVisible();
    await expect(page.locator('#cp-current')).toBeVisible();
    await expect(page.locator('#cp-new')).toBeVisible();
    await expect(page.locator('#cp-confirm')).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.click('[title="Change password"]');
    await page.fill('#cp-current', 'anything');
    await page.fill('#cp-new', 'newpassword123');
    await page.fill('#cp-confirm', 'differentpassword');
    await page.click('button:has-text("Change Password")');
    await expect(page.getByText('Passwords do not match')).toBeVisible({ timeout: 5000 });
  });

  test('cancel closes the dialog', async ({ page }) => {
    await page.click('[title="Change password"]');
    await expect(page.locator('#cp-current')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('#cp-current')).not.toBeVisible();
  });
});
