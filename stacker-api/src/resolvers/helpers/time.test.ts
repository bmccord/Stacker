import { describe, it, expect } from 'vitest';
import { dbTimeToString, timeStringToDate } from './time';

describe('dbTimeToString', () => {
  it('converts a Date to HH:MM format', () => {
    const d = new Date(0);
    d.setUTCHours(9, 30, 0, 0);
    expect(dbTimeToString(d)).toBe('09:30');
  });

  it('handles midnight', () => {
    const d = new Date(0);
    d.setUTCHours(0, 0, 0, 0);
    expect(dbTimeToString(d)).toBe('00:00');
  });

  it('handles late evening', () => {
    const d = new Date(0);
    d.setUTCHours(23, 59, 0, 0);
    expect(dbTimeToString(d)).toBe('23:59');
  });

  it('pads single-digit hours and minutes', () => {
    const d = new Date(0);
    d.setUTCHours(5, 3, 0, 0);
    expect(dbTimeToString(d)).toBe('05:03');
  });

  it('extracts HH:MM from a string', () => {
    expect(dbTimeToString('14:30:00')).toBe('14:30');
  });

  it('handles null', () => {
    expect(dbTimeToString(null)).toBe('');
  });

  it('handles undefined', () => {
    expect(dbTimeToString(undefined)).toBe('');
  });
});

describe('timeStringToDate', () => {
  it('converts HH:MM to a Date', () => {
    const d = timeStringToDate('09:30');
    expect(d.getUTCHours()).toBe(9);
    expect(d.getUTCMinutes()).toBe(30);
  });

  it('handles midnight', () => {
    const d = timeStringToDate('00:00');
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it('handles late evening', () => {
    const d = timeStringToDate('23:59');
    expect(d.getUTCHours()).toBe(23);
    expect(d.getUTCMinutes()).toBe(59);
  });

  it('sets seconds and milliseconds to zero', () => {
    const d = timeStringToDate('12:00');
    expect(d.getUTCSeconds()).toBe(0);
    expect(d.getUTCMilliseconds()).toBe(0);
  });
});
