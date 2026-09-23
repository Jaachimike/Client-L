import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, dueLabel, isIsoDate, toIsoDate } from './dates';

describe('dates', () => {
  it('validates real calendar dates', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('01/10/2026')).toBe(false);
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-12-29', 6)).toBe('2027-01-04');
    expect(daysBetween('2026-10-01', '2026-09-27')).toBe(-4);
  });

  it('reads the date part of a sheet timestamp', () => {
    expect(toIsoDate('2026-10-01 09:30:00')).toBe('2026-10-01');
    expect(toIsoDate('next week')).toBe('');
  });

  it('labels due dates in plain language', () => {
    expect(dueLabel('2026-09-27', '2026-10-01')).toBe('4 days overdue');
    expect(dueLabel('2026-10-01', '2026-10-01')).toBe('Due today');
    expect(dueLabel('2026-10-04', '2026-10-01')).toBe('Due in 3 days');
    expect(dueLabel('', '2026-10-01')).toBe('No date');
  });
});
