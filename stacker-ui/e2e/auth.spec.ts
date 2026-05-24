import { test, expect } from '@playwright/test';
import { signIn, signInViaForm, signOut, getCredentials } from './auth';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('signs in via form with valid credentials', async ({ page }) => {
    await signInViaForm(page);
    await expect(page).toHaveURL(/\/app/);
    // Sidebar should be visible
    await expect(page.locator('nav')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    const creds = getCredentials();
    await page.goto(`${creds.uiUrl}/sign-in`);
    await page.fill('#email', 'wrong@test.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should stay on sign-in page
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('signs out and redirects to sign-in', async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/app/);
    await signOut(page);
    await page.goto('/app');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('forgot password link navigates to forgot-password page', async ({ page }) => {
    const creds = getCredentials();
    await page.goto(`${creds.uiUrl}/sign-in`);
    await page.click('text=Forgot password');
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('forgot password shows confirmation after submit', async ({ page }) => {
    const creds = getCredentials();
    await page.goto(`${creds.uiUrl}/forgot-password`);
    await page.fill('#email', creds.email);
    await page.click('button[type="submit"]');
    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 10000 });
  });

  test('reset password shows error without token', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByText('Invalid Reset Link')).toBeVisible();
  });
});
