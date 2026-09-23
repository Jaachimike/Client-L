const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export const WEEK_DAYS = 7;

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  if (y === undefined || m === undefined || d === undefined) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function toUtcMs(iso: string): number {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromUtcMs(toUtcMs(iso) + days * DAY_MS);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** Leading ISO date of a sheet value such as `2026-10-01 09:30:00`, or '' when there is none. */
export function toIsoDate(value: string): string {
  const head = value.trim().slice(0, 10);
  return isIsoDate(head) ? head : '';
}

export function formatDisplayDate(iso: string): string {
  if (!isIsoDate(iso)) return '';
  return new Date(toUtcMs(iso)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function dueLabel(dueDate: string, today: string): string {
  if (!dueDate) return 'No date';
  const days = daysBetween(today, dueDate);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days === -1) return '1 day overdue';
  if (days < 0) return `${-days} days overdue`;
  return `Due in ${days} days`;
}
