import { describe, expect, it } from 'vitest';
import { duplicateKey } from './cashflow';
import { parseCsv } from './csv';
import { SAMPLE_CSV } from '../client/mocks/sampleCsv';
import { previewImport, readAmount, readDate } from './importPreview';

const ctx = {
  defaultCurrency: 'NGN',
  existingClientNames: ['acme foods'],
  existingKeys: new Set<string>(),
};

describe('parseCsv', () => {
  it('handles quoted commas, doubled quotes and a byte order mark', () => {
    expect(parseCsv(`${String.fromCharCode(0xfeff)}a,"b, c","say ""hi"""\n1,2,3`)).toEqual([
      ['a', 'b, c', 'say "hi"'],
      ['1', '2', '3'],
    ]);
  });
});

describe('readDate and readAmount', () => {
  it('reads day-first dates and rejects impossible ones', () => {
    expect(readDate('03/03/2026')).toBe('2026-03-03');
    expect(readDate('3/3/26')).toBe('2026-03-03');
    expect(readDate('2026-03-03')).toBe('2026-03-03');
    expect(readDate('')).toBe('');
    expect(readDate('31/02/2026')).toBeNull();
  });

  it('reads money with commas or symbols and rejects text and negatives', () => {
    expect(readAmount('1,250,000')).toBe(1250000);
    expect(readAmount('₦12,500.50')).toBe(12500.5);
    expect(readAmount('-500')).toBeNull();
    expect(readAmount('lots')).toBeNull();
    expect(readAmount('')).toBe(0);
  });
});

describe('previewImport', () => {
  it('imports every real entry with the same count, dates and amounts', () => {
    const preview = previewImport(SAMPLE_CSV, ctx);
    if (!preview.ok) throw new Error(preview.message);
    expect(preview.rows.map((r) => [r.line, r.type, r.amount, r.date])).toEqual([
      [2, 'Inflow', 500000, '2026-02-14'],
      [3, 'Outflow', 120000, '2026-02-20'],
      [4, 'Outflow', 80000, ''],
      [5, 'Inflow', 750000, '2026-03-03'],
    ]);
    expect(preview.rows[3]).toMatchObject({
      description: 'Balance, final 60%',
      reference: '(received 700000, 50000 removed for VAT)',
      clientName: 'Beta Clinic',
      currency: 'NGN',
    });
  });

  it('reports every skipped row and why', () => {
    const preview = previewImport(SAMPLE_CSV, ctx);
    if (!preview.ok) throw new Error(preview.message);
    expect(preview.skipped.map((s) => [s.line, s.reason])).toEqual([
      [6, 'No amount'],
      [7, 'Amount is not a positive number'],
      [8, 'Date "31/02/2026" is not a real date (use DD/MM/YYYY)'],
      [9, 'Blank row'],
      [10, 'Total row; the app works out totals itself'],
      [11, 'Total row; the app works out totals itself'],
    ]);
  });

  it('suggests categories and lists only clients that do not exist yet', () => {
    const preview = previewImport(SAMPLE_CSV, ctx);
    if (!preview.ok) throw new Error(preview.message);
    expect(preview.rows.map((r) => r.category)).toEqual([
      'Client payment',
      'UI design',
      'Development',
      'Client payment',
    ]);
    expect(preview.newClients).toEqual(['Beta Clinic']);
  });

  it('skips rows that were already imported', () => {
    const existingKeys = new Set([
      duplicateKey({
        date: '2026-02-14',
        type: 'Inflow',
        amount: 500000,
        description: 'Website build deposit',
      }),
    ]);
    const preview = previewImport(SAMPLE_CSV, { ...ctx, existingKeys });
    if (!preview.ok) throw new Error(preview.message);
    expect(preview.rows).toHaveLength(3);
    expect(preview.skipped[0]).toMatchObject({ line: 2, reason: 'Already imported' });
  });

  it('explains a file without the needed columns', () => {
    expect(previewImport('Name,Value\na,b', ctx)).toEqual({
      ok: false,
      message: expect.stringContaining('Description column'),
    });
  });

  it('also reads the app’s own Type and Amount layout', () => {
    const preview = previewImport(
      'Date,Type,Amount,Currency,Description\n2026-03-01,Outflow,12.5,USD,Hosting',
      ctx,
    );
    if (!preview.ok) throw new Error(preview.message);
    expect(preview.rows[0]).toMatchObject({ type: 'Outflow', amount: 12.5, currency: 'USD' });
  });
});
