import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateMaxLength,
  validateSlug,
  validatePositiveInt,
  validateNonNegativeInt,
  validateEmail,
  validateEnum,
  validateRange,
  validateDomain,
} from './index';

describe('validateRequired', () => {
  it('throws on empty string', () => {
    expect(() => validateRequired('', 'Name')).toThrow('Name is required');
  });

  it('throws on whitespace-only string', () => {
    expect(() => validateRequired('   ', 'Name')).toThrow('Name is required');
  });

  it('throws on null', () => {
    expect(() => validateRequired(null, 'Name')).toThrow('Name is required');
  });

  it('throws on undefined', () => {
    expect(() => validateRequired(undefined, 'Name')).toThrow('Name is required');
  });

  it('passes for a valid string', () => {
    expect(() => validateRequired('hello', 'Name')).not.toThrow();
  });
});

describe('validateMaxLength', () => {
  it('throws when value exceeds max length', () => {
    expect(() => validateMaxLength('abcdef', 5, 'Title')).toThrow('Title must be 5 characters or less');
  });

  it('passes when value is within limit', () => {
    expect(() => validateMaxLength('abc', 5, 'Title')).not.toThrow();
  });

  it('passes when value is exactly at limit', () => {
    expect(() => validateMaxLength('abcde', 5, 'Title')).not.toThrow();
  });

  it('passes on null', () => {
    expect(() => validateMaxLength(null, 5, 'Title')).not.toThrow();
  });

  it('passes on undefined', () => {
    expect(() => validateMaxLength(undefined, 5, 'Title')).not.toThrow();
  });
});

describe('validateSlug', () => {
  it('accepts a simple slug', () => {
    expect(() => validateSlug('hello')).not.toThrow();
  });

  it('accepts a slug with hyphens', () => {
    expect(() => validateSlug('hello-world')).not.toThrow();
  });

  it('accepts a slug with numbers', () => {
    expect(() => validateSlug('page-1')).not.toThrow();
  });

  it('accepts a single character', () => {
    expect(() => validateSlug('a')).not.toThrow();
  });

  it('rejects empty string', () => {
    expect(() => validateSlug('')).toThrow();
  });

  it('rejects uppercase letters', () => {
    expect(() => validateSlug('Hello')).toThrow();
  });

  it('rejects leading hyphen', () => {
    expect(() => validateSlug('-hello')).toThrow();
  });

  it('rejects trailing hyphen', () => {
    expect(() => validateSlug('hello-')).toThrow();
  });

  it('rejects spaces', () => {
    expect(() => validateSlug('hello world')).toThrow();
  });

  it('rejects special characters', () => {
    expect(() => validateSlug('hello@world')).toThrow();
  });

  it('rejects slugs over 200 characters', () => {
    expect(() => validateSlug('a'.repeat(201))).toThrow('200 characters or fewer');
  });

  it('accepts slug at exactly 200 characters', () => {
    expect(() => validateSlug('a'.repeat(200))).not.toThrow();
  });
});

describe('validatePositiveInt', () => {
  it('passes on null', () => {
    expect(() => validatePositiveInt(null, 'Count')).not.toThrow();
  });

  it('passes on undefined', () => {
    expect(() => validatePositiveInt(undefined, 'Count')).not.toThrow();
  });

  it('passes on a positive integer', () => {
    expect(() => validatePositiveInt(5, 'Count')).not.toThrow();
  });

  it('throws on zero', () => {
    expect(() => validatePositiveInt(0, 'Count')).toThrow('positive integer');
  });

  it('throws on a negative number', () => {
    expect(() => validatePositiveInt(-1, 'Count')).toThrow('positive integer');
  });

  it('throws on a decimal', () => {
    expect(() => validatePositiveInt(1.5, 'Count')).toThrow('positive integer');
  });
});

describe('validateNonNegativeInt', () => {
  it('passes on null', () => {
    expect(() => validateNonNegativeInt(null, 'Count')).not.toThrow();
  });

  it('passes on zero', () => {
    expect(() => validateNonNegativeInt(0, 'Count')).not.toThrow();
  });

  it('passes on a positive integer', () => {
    expect(() => validateNonNegativeInt(5, 'Count')).not.toThrow();
  });

  it('throws on a negative number', () => {
    expect(() => validateNonNegativeInt(-1, 'Count')).toThrow('zero or a positive integer');
  });

  it('throws on a decimal', () => {
    expect(() => validateNonNegativeInt(1.5, 'Count')).toThrow('zero or a positive integer');
  });
});

describe('validateEmail', () => {
  it('accepts a valid email', () => {
    expect(() => validateEmail('user@example.com')).not.toThrow();
  });

  it('accepts an email with subdomain', () => {
    expect(() => validateEmail('user@mail.example.com')).not.toThrow();
  });

  it('passes on null (optional)', () => {
    expect(() => validateEmail(null)).not.toThrow();
  });

  it('passes on undefined (optional)', () => {
    expect(() => validateEmail(undefined)).not.toThrow();
  });

  it('throws on missing @', () => {
    expect(() => validateEmail('userexample.com')).toThrow('Invalid email');
  });

  it('throws on missing domain', () => {
    expect(() => validateEmail('user@')).toThrow('Invalid email');
  });
});

describe('validateEnum', () => {
  const allowed = ['public', 'authenticated', 'restricted'];

  it('passes on a valid value', () => {
    expect(() => validateEnum('public', allowed, 'Visibility')).not.toThrow();
  });

  it('passes on null', () => {
    expect(() => validateEnum(null, allowed, 'Visibility')).not.toThrow();
  });

  it('passes on undefined', () => {
    expect(() => validateEnum(undefined, allowed, 'Visibility')).not.toThrow();
  });

  it('throws on an invalid value', () => {
    expect(() => validateEnum('private', allowed, 'Visibility')).toThrow('must be one of');
  });

  it('is case-sensitive', () => {
    expect(() => validateEnum('Public', allowed, 'Visibility')).toThrow('must be one of');
  });
});

describe('validateRange', () => {
  it('passes when value is within range', () => {
    expect(() => validateRange(3, 1, 5, 'Rating')).not.toThrow();
  });

  it('passes at minimum boundary', () => {
    expect(() => validateRange(1, 1, 5, 'Rating')).not.toThrow();
  });

  it('passes at maximum boundary', () => {
    expect(() => validateRange(5, 1, 5, 'Rating')).not.toThrow();
  });

  it('throws below minimum', () => {
    expect(() => validateRange(0, 1, 5, 'Rating')).toThrow('must be between 1 and 5');
  });

  it('throws above maximum', () => {
    expect(() => validateRange(6, 1, 5, 'Rating')).toThrow('must be between 1 and 5');
  });
});

describe('validateDomain', () => {
  it('passes on a valid domain', () => {
    expect(() => validateDomain('example.com')).not.toThrow();
  });

  it('passes on a subdomain', () => {
    expect(() => validateDomain('app.example.com')).not.toThrow();
  });

  it('passes on null', () => {
    expect(() => validateDomain(null)).not.toThrow();
  });

  it('passes on undefined', () => {
    expect(() => validateDomain(undefined)).not.toThrow();
  });

  it('passes on empty string', () => {
    expect(() => validateDomain('')).not.toThrow();
  });

  it('rejects domains with spaces', () => {
    expect(() => validateDomain('example .com')).toThrow('Invalid domain format');
  });

  it('rejects domains over 255 characters', () => {
    expect(() => validateDomain('a'.repeat(256))).toThrow('255 characters or fewer');
  });
});
