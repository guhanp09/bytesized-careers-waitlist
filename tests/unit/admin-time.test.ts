import { describe, expect, it } from 'vitest';
import {
  formatIstDateTime,
  istDateKey,
  istEndOfDayExclusive,
  istStartOfDay,
  readablePercent,
} from '@/lib/admin/time';
import { fillTrend, withPercent } from '@/lib/db/queries/admin';

describe('admin IST handling', () => {
  it('formats UTC instants explicitly in Asia/Kolkata', () => {
    expect(formatIstDateTime(new Date('2026-07-15T03:12:00Z'))).toBe('15 Jul 2026, 8:42 AM IST');
  });

  it('groups the midnight edge by IST rather than UTC', () => {
    expect(istDateKey('2026-07-14T18:29:59Z')).toBe('2026-07-14');
    expect(istDateKey('2026-07-14T18:30:00Z')).toBe('2026-07-15');
  });

  it('converts filter boundaries to the correct UTC instants', () => {
    expect(istStartOfDay('2026-07-15').toISOString()).toBe('2026-07-14T18:30:00.000Z');
    expect(istEndOfDayExclusive('2026-07-15').toISOString()).toBe('2026-07-15T18:30:00.000Z');
  });

  it('does not apply daylight-saving changes to India', () => {
    expect(istStartOfDay('2026-01-15').toISOString()).toContain('T18:30:00.000Z');
    expect(istStartOfDay('2026-07-15').toISOString()).toContain('T18:30:00.000Z');
  });
});

describe('analytics helpers', () => {
  it('fills missing IST calendar dates without inventing values', () => {
    const rows = fillTrend(
      [{ date: '2026-07-14', total: 2, completed: 1, verified: 1 }],
      '7',
      new Date('2026-07-15T12:00:00Z'),
    );
    expect(rows).toHaveLength(7);
    expect(rows.at(-2)).toEqual({ date: '2026-07-14', total: 2, completed: 1, verified: 1 });
    expect(rows.at(-1)).toEqual({ date: '2026-07-15', total: 0, completed: 0, verified: 0 });
  });

  it('handles empty and zero-denominator datasets', () => {
    expect(fillTrend([], 'all', new Date('2026-07-15T12:00:00Z'))).toEqual([
      { date: '2026-07-15', total: 0, completed: 0, verified: 0 },
    ]);
    expect(readablePercent(4, 0)).toBe(0);
    expect(withPercent([{ key: 'x', count: 4 }], 0)).toEqual([{ key: 'x', count: 4, percentage: 0 }]);
  });
});
