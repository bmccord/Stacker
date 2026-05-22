import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Set JWT_SECRET before any imports that might need it
process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';

import { testPrisma } from './setup/testClient';
import { makeTestContext } from './setup/testContext';
import { resetDatabase } from './setup/truncate';
import { seedTestData } from './setup/seed';
import * as C from './setup/constants';
import { AuthMutations } from '../../src/resolvers/mutations/auth';
import { hashPassword } from '../../src/services/auth';

const TEST_PASSWORD = 'testpass123';
let testPasswordHash: string;

beforeAll(async () => {
  await resetDatabase(testPrisma);
  await seedTestData(testPrisma);

  // Set a known password on the admin user for auth tests
  testPasswordHash = await hashPassword(TEST_PASSWORD);
  await testPrisma.users.update({
    where: { id: C.ADMIN_USER_ID },
    data: { password_hash: testPasswordHash },
  });
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe('signIn', () => {
  it('signs in with valid credentials', async () => {
    const ctx = makeTestContext('unauthenticated');
    const result = await AuthMutations.signIn(null, {
      email: 'admin@test.com',
      password: TEST_PASSWORD,
    }, ctx);
    expect(result.token).toBeTruthy();
    expect(result.user.id).toBe(C.ADMIN_USER_ID);
    expect(result.user.email).toBe('admin@test.com');
  });

  it('rejects wrong password', async () => {
    const ctx = makeTestContext('unauthenticated');
    await expect(
      AuthMutations.signIn(null, { email: 'admin@test.com', password: 'wrongpassword' }, ctx)
    ).rejects.toThrow('Invalid email or password');
  });

  it('rejects non-existent email', async () => {
    const ctx = makeTestContext('unauthenticated');
    await expect(
      AuthMutations.signIn(null, { email: 'nobody@test.com', password: 'anything' }, ctx)
    ).rejects.toThrow('Invalid email or password');
  });

  it('normalizes email to lowercase', async () => {
    const ctx = makeTestContext('unauthenticated');
    const result = await AuthMutations.signIn(null, {
      email: 'ADMIN@TEST.COM',
      password: TEST_PASSWORD,
    }, ctx);
    expect(result.user.email).toBe('admin@test.com');
  });
});

describe('changePassword', () => {
  it('changes password successfully', async () => {
    const ctx = makeTestContext('admin');
    const result = await AuthMutations.changePassword(null, {
      currentPassword: TEST_PASSWORD,
      newPassword: 'newpassword123',
    }, ctx);
    expect(result).toBe(true);

    // Restore original password for other tests
    await testPrisma.users.update({
      where: { id: C.ADMIN_USER_ID },
      data: { password_hash: testPasswordHash },
    });
  });

  it('rejects wrong current password', async () => {
    const ctx = makeTestContext('admin');
    await expect(
      AuthMutations.changePassword(null, {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      }, ctx)
    ).rejects.toThrow('Current password is incorrect');
  });

  it('rejects short new password', async () => {
    const ctx = makeTestContext('admin');
    await expect(
      AuthMutations.changePassword(null, {
        currentPassword: TEST_PASSWORD,
        newPassword: 'short',
      }, ctx)
    ).rejects.toThrow('at least 8 characters');
  });

  it('rejects unauthenticated user', async () => {
    const ctx = makeTestContext('unauthenticated');
    await expect(
      AuthMutations.changePassword(null, {
        currentPassword: 'testpass',
        newPassword: 'newpassword123',
      }, ctx)
    ).rejects.toThrow('Not authenticated');
  });
});

describe('requestPasswordReset', () => {
  it('returns true for existing email', async () => {
    const ctx = makeTestContext('unauthenticated');
    const result = await AuthMutations.requestPasswordReset(null, {
      email: 'admin@test.com',
    }, ctx);
    expect(result).toBe(true);
  });

  it('returns true for non-existent email (no leak)', async () => {
    const ctx = makeTestContext('unauthenticated');
    const result = await AuthMutations.requestPasswordReset(null, {
      email: 'nobody@test.com',
    }, ctx);
    expect(result).toBe(true);
  });

  it('stores reset token in database', async () => {
    const ctx = makeTestContext('unauthenticated');
    await AuthMutations.requestPasswordReset(null, {
      email: 'editor@test.com',
    }, ctx);
    const user = await testPrisma.users.findUnique({ where: { id: C.EDITOR_USER_ID } });
    expect(user!.password_reset_token).not.toBeNull();
    expect(user!.password_reset_expires_at).not.toBeNull();
  });
});

describe('resetPassword', () => {
  const RESET_TOKEN = 'valid-test-reset-token-abc123';

  beforeAll(async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await testPrisma.users.update({
      where: { id: C.MEMBER_USER_ID },
      data: { password_reset_token: RESET_TOKEN, password_reset_expires_at: expiresAt },
    });
  });

  it('resets password with valid token and auto-signs in', async () => {
    const ctx = makeTestContext('unauthenticated');
    const result = await AuthMutations.resetPassword(null, {
      token: RESET_TOKEN,
      password: 'brandnewpass',
    }, ctx);

    expect(result.token).toBeTruthy();
    expect(result.user.id).toBe(C.MEMBER_USER_ID);
    expect(result.user.emailVerified).toBe(true);

    // Token should be cleared
    const user = await testPrisma.users.findUnique({ where: { id: C.MEMBER_USER_ID } });
    expect(user!.password_reset_token).toBeNull();

    // Restore
    await testPrisma.users.update({
      where: { id: C.MEMBER_USER_ID },
      data: { password_hash: testPasswordHash },
    });
  });

  it('rejects expired token', async () => {
    const expiredAt = new Date(Date.now() - 60 * 60 * 1000);
    const expiredToken = 'expired-test-token-xyz789';
    await testPrisma.users.update({
      where: { id: C.MEMBER_USER_ID },
      data: { password_reset_token: expiredToken, password_reset_expires_at: expiredAt },
    });

    const ctx = makeTestContext('unauthenticated');
    await expect(
      AuthMutations.resetPassword(null, { token: expiredToken, password: 'newpassword123' }, ctx)
    ).rejects.toThrow('Invalid or expired reset link');

    // Token should be cleared
    const user = await testPrisma.users.findUnique({ where: { id: C.MEMBER_USER_ID } });
    expect(user!.password_reset_token).toBeNull();
  });

  it('rejects invalid token', async () => {
    const ctx = makeTestContext('unauthenticated');
    await expect(
      AuthMutations.resetPassword(null, { token: 'totally-bogus-token', password: 'newpassword123' }, ctx)
    ).rejects.toThrow('Invalid or expired reset link');
  });

  it('rejects short password', async () => {
    const ctx = makeTestContext('unauthenticated');
    await expect(
      AuthMutations.resetPassword(null, { token: 'any-token', password: 'short' }, ctx)
    ).rejects.toThrow('Password must be at least 8 characters');
  });
});
