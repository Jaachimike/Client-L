import type { Transaction, TransactionType } from './types';

export type CashPeriod = { kind: 'month'; month: string } | { kind: 'all' } | { kind: 'undated' };

export interface CashFilters {
  period: CashPeriod;
  currency?: string;
  clientId?: string;
  category?: string;
  type?: TransactionType | '';
  /** Voided entries are hidden unless this is set, and then only they are shown. */
  voided?: boolean;
}

export interface Totals {
  inflow: number;
  outflow: number;
  net: number;
}

/** `yyyy-MM` for a dated entry, or '' when it has no date. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function inPeriod(tx: Transaction, period: CashPeriod): boolean {
  if (period.kind === 'all') return true;
  if (period.kind === 'undated') return tx.date === '';
  return monthOf(tx.date) === period.month;
}

export function filterTransactions(txs: Transaction[], filters: CashFilters): Transaction[] {
  return txs.filter(
    (tx) =>
      tx.voided === Boolean(filters.voided) &&
      inPeriod(tx, filters.period) &&
      (!filters.currency || tx.currency === filters.currency) &&
      (!filters.clientId || tx.clientId === filters.clientId) &&
      (!filters.category || tx.category === filters.category) &&
      (!filters.type || tx.type === filters.type),
  );
}

/** Sums in whole minor units so decimals like 0.1 + 0.2 add up exactly. */
function sum(values: number[]): number {
  return values.reduce((total, v) => total + Math.round(v * 100), 0) / 100;
}

/** Totals for one currency; entries in other currencies are never added in. */
export function totalsFor(txs: Transaction[], currency: string): Totals {
  const own = txs.filter((tx) => tx.currency === currency && !tx.voided);
  const inflow = sum(own.filter((tx) => tx.type === 'Inflow').map((tx) => tx.amount));
  const outflow = sum(own.filter((tx) => tx.type === 'Outflow').map((tx) => tx.amount));
  return { inflow, outflow, net: sum([inflow, -outflow]) };
}

export function currenciesIn(txs: Transaction[]): string[] {
  return [...new Set(txs.filter((tx) => !tx.voided).map((tx) => tx.currency))].sort();
}

export function shiftMonth(month: string, offset: number): string {
  const [y = 0, m = 1] = month.split('-').map(Number);
  const total = y * 12 + (m - 1) + offset;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

export interface MonthBar {
  month: string;
  inflow: number;
  outflow: number;
}

/** The six months ending with `month`, oldest first, for one currency. */
export function sixMonthSeries(txs: Transaction[], currency: string, month: string): MonthBar[] {
  return Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5)).map((m) => {
    const totals = totalsFor(
      txs.filter((tx) => monthOf(tx.date) === m),
      currency,
    );
    return { month: m, inflow: totals.inflow, outflow: totals.outflow };
  });
}

/** Newest first; undated entries last, in the order they were added. */
export function sortNewestFirst(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => {
    if (a.date !== b.date) {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date < b.date ? 1 : -1;
    }
    return a.created < b.created ? 1 : a.created > b.created ? -1 : 0;
  });
}

export function monthLabel(month: string): string {
  const [y = 0, m = 1] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Same date, type, amount and description (ignoring case and spacing) counts as the same entry. */
export function duplicateKey(
  tx: Pick<Transaction, 'date' | 'type' | 'amount' | 'description'>,
): string {
  return [
    tx.date,
    tx.type,
    Math.round(tx.amount * 100),
    tx.description.trim().toLowerCase().replace(/\s+/g, ' '),
  ].join('|');
}
