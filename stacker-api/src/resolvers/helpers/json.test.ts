import { describe, it, expect, vi } from 'vitest';

// Mock the logger to avoid side effects
vi.mock('../../logger', () => ({
  logger: { warn: vi.fn() },
}));

import { safeJsonParse } from './json';

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('parses a JSON array', () => {
    expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3]);
  });

  it('returns fallback for null', () => {
    expect(safeJsonParse(null, { default: true })).toEqual({ default: true });
  });

  it('returns fallback for undefined', () => {
    expect(safeJsonParse(undefined, [])).toEqual([]);
  });

  it('returns fallback for empty string', () => {
    expect(safeJsonParse('', 'fallback')).toBe('fallback');
  });

  it('returns fallback for malformed JSON', () => {
    expect(safeJsonParse('{invalid', {})).toEqual({});
  });

  it('returns fallback for truncated JSON', () => {
    expect(safeJsonParse('{"a":', null)).toBeNull();
  });
});
