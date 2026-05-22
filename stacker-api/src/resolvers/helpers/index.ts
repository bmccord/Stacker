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

export function validateSlug(slug: string): void {
  if (!slug || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    throw new Error('Slug must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens');
  }
  if (slug.length > 200) {
    throw new Error('Slug must be 200 characters or fewer');
  }
}

export function validatePositiveInt(value: number | null | undefined, name: string): void {
  if (value == null) return;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
}

export function validateNonNegativeInt(value: number | null | undefined, name: string): void {
  if (value == null) return;
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be zero or a positive integer`);
  }
}

export function validateEnum(value: string | null | undefined, allowed: string[], name: string): void {
  if (value == null) return;
  if (!allowed.includes(value)) {
    throw new Error(`${name} must be one of: ${allowed.join(', ')}`);
  }
}

export function validateDomain(domain: string | null | undefined): void {
  if (!domain) return;
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i.test(domain)) {
    throw new Error('Invalid domain format');
  }
  if (domain.length > 255) {
    throw new Error('Domain must be 255 characters or fewer');
  }
}

// Re-export utility modules
export { slugify } from './slugify';
export { dbTimeToString, timeStringToDate } from './time';
export { safeJsonParse } from './json';
