import { describe, expect, it } from 'vitest';
import {
  currenciesIn,
  filterTransactions,
  shiftMonth,
  sixMonthSeries,
  sortNewestFirst,
  totalsFor,
} from './cashflow';
import type { Transaction } from './types';

let counter = 0;
function tx(overrides: Partial<Transaction>): Transaction {
  counter += 1;
  return {
    id: `t${counter}`,
    date: '2026-09-10',
    type: 'Inflow',
    amount: 100,
    currency: 'NGN',
    category: '',
    clientId: 'a',
    description: 'Entry',
    reference: '',
    voided: false,
    created: `2026-09-10 09:00:${String(counter).padStart(2, '0')}`,
    ...overrides,
  };
}

const entries = [
  tx({ amount: 500000, clientId: 'a', category: 'Client payment' }),
  tx({ type: 'Outflow', amount: 150000, clientId: 'a', category: 'UI design' }),
  tx({ type: 'Outflow', amount: 75000.5, clientId: 'b', category: 'Development' }),
  tx({ date: '2026-08-20', amount: 200000, clientId: 'b' }),
  tx({ amount: 40, currency: 'USD', clientId: 'b' }),
  tx({ date: '', amount: 1000, clientId: 'a' }),
  tx({ amount: 999999, voided: true }),
];
const september = { kind: 'month', month: '2026-09' } as const;

describe('cash flow totals', () => {
  it('matches a manual sum for the month, per currency, ignoring voided entries', () => {
    const month = filterTransactions(entries, { period: september });
    expect(totalsFor(month, 'NGN')).toEqual({ inflow: 500000, outflow: 225000.5, net: 274999.5 });
    expect(totalsFor(month, 'USD')).toEqual({ inflow: 40, outflow: 0, net: 40 });
  });

  it('never adds different currencies together', () => {
    const all = filterTransactions(entries, { period: { kind: 'all' } });
    expect(totalsFor(all, 'NGN').inflow).toBe(500000 + 200000 + 1000);
    expect(currenciesIn(all)).toEqual(['NGN', 'USD']);
  });

  it('updates totals to match only the filtered rows', () => {
    const byClient = filterTransactions(entries, { period: september, clientId: 'b' });
    expect(totalsFor(byClient, 'NGN')).toEqual({ inflow: 0, outflow: 75000.5, net: -75000.5 });
    const byCategory = filterTransactions(entries, { period: september, category: 'UI design' });
    expect(totalsFor(byCategory, 'NGN').outflow).toBe(150000);
  });

  it('keeps undated entries in All time and No date, but out of any month', () => {
    expect(filterTransactions(entries, { period: { kind: 'undated' } })).toHaveLength(1);
    expect(filterTransactions(entries, { period: september }).some((t) => t.date === '')).toBe(
      false,
    );
  });

  it('shows voided entries only in the voided view', () => {
    expect(
      filterTransactions(entries, { period: september, voided: true }).map((t) => t.amount),
    ).toEqual([999999]);
  });

  it('adds decimals exactly', () => {
    const cents = [tx({ amount: 0.1 }), tx({ amount: 0.2 })];
    expect(totalsFor(cents, 'NGN').inflow).toBe(0.3);
  });
});

describe('six month chart', () => {
  it('covers the chosen month and the five before it, oldest first', () => {
    const series = sixMonthSeries(entries, 'NGN', '2026-09');
    expect(series.map((b) => b.month)).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
    ]);
    expect(series[5]).toEqual({ month: '2026-09', inflow: 500000, outflow: 225000.5 });
    expect(series[4]?.inflow).toBe(200000);
  });

  it('shifts months across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2025-12', 1)).toBe('2026-01');
  });
});

describe('sortNewestFirst', () => {
  it('puts the newest dates first and undated entries last', () => {
    const sorted = sortNewestFirst([
      tx({ date: '' }),
      tx({ date: '2026-01-01' }),
      tx({ date: '2026-03-01' }),
    ]);
    expect(sorted.map((t) => t.date)).toEqual(['2026-03-01', '2026-01-01', '']);
  });
});
