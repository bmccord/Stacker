import { describe, it, expect } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('my page title')).toBe('my-page-title');
  });

  it('removes special characters', () => {
    expect(slugify('Hello & World!')).toBe('hello-world');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('removes leading hyphens', () => {
    expect(slugify('--hello')).toBe('hello');
  });

  it('removes trailing hyphens', () => {
    expect(slugify('hello--')).toBe('hello');
  });

  it('preserves numbers', () => {
    expect(slugify('Page 1 of 3')).toBe('page-1-of-3');
  });

  it('handles already-slugified text', () => {
    expect(slugify('already-a-slug')).toBe('already-a-slug');
  });

  it('handles consecutive special characters', () => {
    expect(slugify('hello!!!world')).toBe('hello-world');
  });
});
