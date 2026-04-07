import { describe, expect, it } from 'vitest';
import { formatAdminAmount, formatAdminDate } from '../format';

describe('formatAdminDate', () => {
  it('formats an ISO date string', () => {
    expect(formatAdminDate('2026-03-10T00:00:00.000Z')).toMatch(/Mar \d+, 2026/);
  });

  it('returns em-dash for null', () => {
    expect(formatAdminDate(null)).toBe('—');
  });
});

describe('formatAdminAmount', () => {
  it('formats amount with currency prefix', () => {
    expect(formatAdminAmount(450000, 'ARS')).toBe('ARS 450,000');
  });

  it('formats small amounts without extra commas', () => {
    expect(formatAdminAmount(100, 'USD')).toBe('USD 100');
  });
});
