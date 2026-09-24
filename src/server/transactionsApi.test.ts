import { describe, expect, it } from 'vitest';
import { totalsFor } from '../shared/cashflow';
import { previewImport } from '../shared/importPreview';
import { SAMPLE_CSV } from '../client/mocks/sampleCsv';
import { freshApp, tab, unwrap } from './testHelpers';

function app() {
  const created = freshApp();
  unwrap(
    created.api.saveDefaults({
      defaultCurrency: 'NGN',
      currencies: ['NGN', 'USD'],
      warningDays: 30,
    }),
  );
  return created;
}

function previewRows() {
  const preview = previewImport(SAMPLE_CSV, {
    defaultCurrency: 'NGN',
    existingClientNames: [],
    existingKeys: new Set(),
  });
  if (!preview.ok) throw new Error(preview.message);
  return preview.rows;
}

describe('transactions', () => {
  it('rejects a negative, zero or non-numeric amount', () => {
    const { api } = app();
    for (const amount of [-5, 0, 'abc', '']) {
      expect(
        api.saveTransaction({ type: 'Outflow', amount, currency: 'NGN', description: 'x' }).ok,
      ).toBe(false);
    }
    expect(
      api.saveTransaction({ type: 'Outflow', amount: '1,500', currency: 'NGN', description: 'x' })
        .ok,
    ).toBe(true);
  });

  it('saves, edits and voids an entry without deleting it', () => {
    const { deps, api } = app();
    const entry = unwrap(
      api.saveTransaction({
        date: '2026-09-01',
        type: 'Inflow',
        amount: 1000,
        currency: 'NGN',
        description: 'Deposit',
      }),
    );
    unwrap(api.saveTransaction({ ...entry, amount: 1500 }));
    unwrap(api.setTransactionVoided(entry.id, true));
    const [saved] = unwrap(api.listTransactions());
    expect(saved).toMatchObject({ amount: 1500, voided: true });
    expect(totalsFor(unwrap(api.listTransactions()), 'NGN').inflow).toBe(0);
    expect(tab(deps, 'Transactions').readAll()).toHaveLength(2);
  });

  it('remembers a new category as a suggestion', () => {
    const { api } = app();
    unwrap(
      api.saveTransaction({
        type: 'Outflow',
        amount: 10,
        currency: 'NGN',
        description: 'x',
        category: 'Travel',
      }),
    );
    expect(unwrap(api.getBootstrap()).categories).toContain('Travel');
  });
});

describe('importTransactions', () => {
  it('imports every row, creates missing clients once, and writes in one batch', () => {
    const { deps, api } = app();
    unwrap(api.saveClient({ name: 'Acme Foods' }));
    const result = unwrap(api.importTransactions(previewRows()));
    expect(result).toEqual({ imported: 4, duplicates: 0, clientsCreated: ['Beta Clinic'] });
    const clients = unwrap(api.listClients());
    expect(clients.map((c) => c.name)).toEqual(['Acme Foods', 'Beta Clinic']);
    const txs = unwrap(api.listTransactions());
    expect(txs.map((t) => clients.find((c) => c.id === t.clientId)?.name)).toEqual([
      'Acme Foods',
      'Acme Foods',
      'Acme Foods',
      'Beta Clinic',
    ]);
    expect(totalsFor(txs, 'NGN')).toEqual({ inflow: 1250000, outflow: 200000, net: 1050000 });
    expect(tab(deps, 'Transactions').readAll()).toHaveLength(5);
  });

  it('skips rows that are already in the sheet when the file is imported again', () => {
    const { api } = app();
    unwrap(api.importTransactions(previewRows()));
    expect(unwrap(api.importTransactions(previewRows()))).toEqual({
      imported: 0,
      duplicates: 4,
      clientsCreated: [],
    });
    expect(unwrap(api.listTransactions())).toHaveLength(4);
  });

  it('validates rows again on the server', () => {
    const { api } = app();
    const [first] = previewRows();
    expect(api.importTransactions([{ ...first, amount: -1 }]).ok).toBe(false);
    expect(api.importTransactions([{ ...first, currency: 'EUR' }])).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    });
    expect(unwrap(api.listTransactions())).toHaveLength(0);
  });
});
