import { describe, expect, it } from 'vitest';
import { freshApp, tab, unwrap } from './testHelpers';

const DATA_TABS = ['Clients', 'Tasks', 'Contracts', 'Subscriptions', 'Transactions'];

function rowCount(deps: ReturnType<typeof freshApp>['deps'], name: string): number {
  return tab(deps, name).readAll().length - 1;
}

describe('sample data', () => {
  it('fills every tab and says so in the bootstrap', () => {
    const { deps, api } = freshApp();
    const summary = unwrap(api.addSampleData());
    for (const name of DATA_TABS) expect(rowCount(deps, name)).toBeGreaterThan(0);
    expect(summary).toEqual({
      clients: 4,
      tasks: 6,
      contracts: 3,
      subscriptions: 4,
      transactions: 8,
    });
    expect(unwrap(api.getBootstrap()).hasSampleData).toBe(true);
    expect(unwrap(api.listTasks()).every((t) => t.id.startsWith('sample-'))).toBe(true);
  });

  it('uses the default currency and does not change settings', () => {
    const { api } = freshApp();
    unwrap(api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['NGN'], warningDays: 45 }));
    unwrap(api.addSampleData());
    expect(unwrap(api.listContracts()).every((c) => c.currency === 'NGN')).toBe(true);
    expect(unwrap(api.getBootstrap())).toMatchObject({ defaultCurrency: 'NGN', warningDays: 45 });
  });

  it('refuses to add a second set', () => {
    const { api } = freshApp();
    unwrap(api.addSampleData());
    expect(api.addSampleData()).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  });

  it('clears only sample rows and keeps your own records', () => {
    const { deps, api } = freshApp();
    const mine = unwrap(api.saveClient({ name: 'My real client' }));
    unwrap(api.saveTask({ clientId: mine.id, title: 'Real work' }));
    unwrap(api.addSampleData());
    const cleared = unwrap(api.clearSampleData());
    expect(cleared).toEqual({
      clients: 4,
      tasks: 6,
      contracts: 3,
      subscriptions: 4,
      transactions: 8,
    });
    expect(unwrap(api.listClients()).map((c) => c.name)).toEqual(['My real client']);
    expect(unwrap(api.listTasks()).map((t) => t.title)).toEqual(['Real work']);
    for (const name of ['Contracts', 'Subscriptions', 'Transactions'])
      expect(rowCount(deps, name)).toBe(0);
    expect(unwrap(api.getBootstrap()).hasSampleData).toBe(false);
  });

  it('keeps a sample client that one of your own records uses', () => {
    const { api } = freshApp();
    unwrap(api.addSampleData());
    const sampleClient = unwrap(api.listClients()).find((c) => !c.archived);
    if (!sampleClient) throw new Error('no sample client');
    unwrap(api.saveTask({ clientId: sampleClient.id, title: 'My own task for them' }));
    const cleared = unwrap(api.clearSampleData());
    expect(cleared.clients).toBe(3);
    expect(unwrap(api.listClients()).map((c) => c.id)).toEqual([sampleClient.id]);
  });

  it('can be added again after clearing, and setup still changes nothing', () => {
    const { deps, api } = freshApp();
    unwrap(api.addSampleData());
    unwrap(api.clearSampleData());
    expect(api.addSampleData().ok).toBe(true);
    expect(rowCount(deps, 'Settings')).toBeGreaterThan(0);
  });

  it('is blocked for people who are not on the allowlist', () => {
    const { deps, api } = freshApp();
    deps.email = 'stranger@example.com';
    expect(api.addSampleData()).toMatchObject({ ok: false, error: { code: 'ACCESS_DENIED' } });
    expect(rowCount(deps, 'Clients')).toBe(0);
  });
});
