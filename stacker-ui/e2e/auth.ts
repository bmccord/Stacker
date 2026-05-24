/**
 * E2E auth helpers — sign in/out via GraphQL, inject tokens into localStorage.
 */

import { Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Credentials {
  email: string;
  password: string;
  apiUrl: string;
  uiUrl: string;
}

let _credentials: Credentials | null = null;

export function getCredentials(): Credentials {
  if (!_credentials) {
    const raw = readFileSync(join(__dirname, '.e2e-credentials.json'), 'utf8');
    _credentials = JSON.parse(raw);
  }
  return _credentials!;
}

/**
 * Sign in by calling the GraphQL API directly and injecting the token.
 * This is faster and more reliable than filling the sign-in form.
 */
export async function signIn(page: Page) {
  const creds = getCredentials();

  // Call sign-in API
  const response = await page.request.post(creds.apiUrl, {
    data: {
      query: `mutation SignIn($email: String!, $password: String!) {
        signIn(email: $email, password: $password) {
          token
          user { id email firstName lastName emailVerified }
        }
      }`,
      variables: { email: creds.email, password: creds.password },
    },
  });

  const json = await response.json();
  const { token, user } = json.data.signIn;

  // Navigate to the app first (so localStorage is on the right origin)
  await page.goto(creds.uiUrl);

  // Inject auth state into localStorage
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('stacker_token', token);
    localStorage.setItem('stacker_user', JSON.stringify(user));
  }, { token, user });

  // Navigate to the app and wait for the sidebar to confirm we're logged in
  await page.goto(`${creds.uiUrl}/app`);
  await page.waitForSelector('nav', { timeout: 10000 });
}

/**
 * Sign in using the UI form (for testing the sign-in flow itself).
 */
export async function signInViaForm(page: Page) {
  const creds = getCredentials();
  await page.goto(`${creds.uiUrl}/sign-in`);
  await page.fill('#email', creds.email);
  await page.fill('#password', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app', { timeout: 10000 });
}

/**
 * Sign out — clear localStorage and navigate to home.
 */
export async function signOut(page: Page) {
  const creds = getCredentials();
  await page.evaluate(() => {
    localStorage.removeItem('stacker_token');
    localStorage.removeItem('stacker_user');
  });
  await page.goto(creds.uiUrl);
}
