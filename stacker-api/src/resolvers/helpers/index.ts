import { GraphQLContext } from '../../context';

export function requireAuth(ctx: GraphQLContext) {
  if (!ctx.userId) throw new Error('Not authenticated');
}

export function requirePermission(ctx: GraphQLContext, permission: string) {
  requireAuth(ctx);
  if (!ctx.permissions.has(permission)) {
    throw new Error('Access denied');
  }
}

export function validateRequired(value: unknown, name: string) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${name} is required`);
  }
}

export function validateMaxLength(value: string | null | undefined, max: number, name: string) {
  if (value && value.length > max) {
    throw new Error(`${name} must be ${max} characters or less`);
  }
}

export function validateEmail(email: string | null | undefined) {
  if (!email) return;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) throw new Error('Invalid email address');
}

export function validateRange(value: number, min: number, max: number, name: string) {
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
}
