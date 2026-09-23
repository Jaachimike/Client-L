import { describe, expect, it } from 'vitest';
import { contractState } from '../shared/contracts';
import { freshApp, tab, unwrap } from './testHelpers';

function withClient() {
  const app = freshApp();
  unwrap(
    app.api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['NGN', 'USD'], warningDays: 30 }),
  );
  const client = unwrap(app.api.saveClient({ name: 'Acme' }));
  const base = {
    clientId: client.id,
    name: 'Website retainer',
    startDate: '2026-01-01',
    endDate: '2026-10-20',
    fee: 150000,
    currency: 'NGN',
    billingCycle: 'Monthly',
  };
  return { ...app, client, base };
}

describe('contracts', () => {
  it('blocks a contract whose end date is before its start date', () => {
    const { api, base } = withClient();
    expect(api.saveContract({ ...base, endDate: '2025-12-31' })).toMatchObject({
      ok: false,
      error: { fields: { endDate: 'The end date must be on or after the start date.' } },
    });
  });

  it('saves a contract row and lists it', () => {
    const { deps, api, base } = withClient();
    const saved = unwrap(api.saveContract(base));
    expect(unwrap(api.listContracts())).toEqual([saved]);
    const [header = [], row = []] = tab(deps, 'Contracts').readAll();
    expect(row[header.indexOf('Fee')]).toBe(150000);
    expect(row[header.indexOf('End date')]).toBe('2026-10-20');
  });

  it('rejects a currency that is not in the Settings list', () => {
    const { api, base } = withClient();
    expect(api.saveContract({ ...base, currency: 'EUR' })).toMatchObject({
      ok: false,
      error: { fields: { currency: 'Add EUR to the currency list in Settings first.' } },
    });
  });

  it('renews: creates the new contract and marks the old one Renewed, keeping both', () => {
    const { api, base, client } = withClient();
    const old = unwrap(api.saveContract(base));
    const { renewed, replacement } = unwrap(
      api.renewContract(old.id, { ...base, startDate: '2026-10-21', endDate: '2027-10-20' }),
    );
    expect(renewed.renewedById).toBe(replacement.id);
    const ctx = { today: '2026-10-01', warningDays: 30 };
    const all = unwrap(api.listContracts()).filter((c) => c.clientId === client.id);
    expect(all.map((c) => contractState(c, ctx))).toEqual(['Renewed', 'Active']);
  });

  it('refuses to renew the same contract twice', () => {
    const { api, base } = withClient();
    const old = unwrap(api.saveContract(base));
    unwrap(api.renewContract(old.id, { ...base, startDate: '2026-10-21', endDate: '2027-10-20' }));
    expect(
      api.renewContract(old.id, { ...base, startDate: '2026-10-21', endDate: '2027-10-20' }),
    ).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  });

  it('follows the expiry warning window when it is changed in Settings', () => {
    const { api, base } = withClient();
    const saved = unwrap(api.saveContract({ ...base, endDate: '2026-11-15' }));
    const before = unwrap(api.getBootstrap());
    expect(contractState(saved, { today: before.today, warningDays: before.warningDays })).toBe(
      'Active',
    );
    unwrap(api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['NGN'], warningDays: 60 }));
    const after = unwrap(api.getBootstrap());
    expect(after.warningDays).toBe(60);
    expect(contractState(saved, { today: after.today, warningDays: after.warningDays })).toBe(
      'Expiring soon',
    );
  });
});

describe('defaults', () => {
  it('keeps the default currency first in the list', () => {
    const { api } = freshApp();
    unwrap(
      api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['USD', 'NGN'], warningDays: 30 }),
    );
    expect(unwrap(api.getBootstrap())).toMatchObject({
      defaultCurrency: 'NGN',
      currencies: ['NGN', 'USD'],
    });
  });

  it('rejects a warning window that is not a whole number of days', () => {
    const { api } = freshApp();
    expect(
      api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['NGN'], warningDays: 0 }).ok,
    ).toBe(false);
  });
});
