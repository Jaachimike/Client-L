import { describe, expect, it, vi } from 'vitest';
import { SERVER_FUNCTIONS } from '../shared/api';
import { SettingsStore } from './settings';
import { decidePage } from './main';
import { freshApp, OWNER, tab, unwrap } from './testHelpers';
import { MemoryTable } from './memoryStore';

const DATA_TABS = ['Clients', 'Tasks', 'Contracts', 'Subscriptions', 'Transactions'];

describe('access control', () => {
  it('serves the app to an allowlisted email', () => {
    const { deps } = freshApp();
    expect(decidePage(deps)).toEqual({ kind: 'app', appName: 'Client-L' });
  });

  it('shows "Access denied" and no data to an email not on the allowlist', () => {
    const { deps, api } = freshApp();
    unwrap(api.saveClient({ name: 'Secret Client Ltd' }));
    deps.email = 'stranger@example.com';
    const page = decidePage(deps);
    expect(page.kind).toBe('denied');
    if (page.kind === 'denied') {
      expect(page.html).toContain('Access denied');
      expect(page.html).not.toContain('Secret Client');
    }
  });

  it('denies an empty email, which Google returns when it will not share the account', () => {
    const { deps } = freshApp();
    deps.email = '';
    expect(decidePage(deps).kind).toBe('denied');
  });

  it.each(SERVER_FUNCTIONS)(
    '%s returns an access error and reads no data rows for a stranger',
    (name) => {
      const { deps, api } = freshApp();
      unwrap(api.saveClient({ name: 'Acme' }));
      deps.email = 'stranger@example.com';
      const reads = DATA_TABS.map((name) => vi.spyOn(tab(deps, name), 'readAll'));
      const result = api[name]({ name: 'x' }, true);
      expect(result).toMatchObject({ ok: false, data: null, error: { code: 'ACCESS_DENIED' } });
      for (const read of reads) expect(read).not.toHaveBeenCalled();
    },
  );

  it('grants access on the next load after an email is added, without redeploying', () => {
    const { deps, api } = freshApp();
    unwrap(api.saveAllowedEmails([OWNER, 'Partner@Example.com']));
    deps.email = 'partner@example.com';
    expect(decidePage(deps).kind).toBe('app');
    expect(api.listClients().ok).toBe(true);
  });

  it('also picks up an email typed straight into the Settings tab', () => {
    const { deps } = freshApp();
    new SettingsStore(deps.workbook).set('Allowed emails', `${OWNER}, helper@example.com`);
    deps.email = 'helper@example.com';
    expect(decidePage(deps).kind).toBe('app');
  });

  it('refuses to remove your own email', () => {
    const { api } = freshApp();
    expect(api.saveAllowedEmails(['other@example.com'])).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    });
  });

  it('asks for setup when the sheet has no Settings tab', () => {
    const { deps } = freshApp();
    deps.workbook.tables.delete('Settings');
    expect(decidePage(deps).kind).toBe('setup');
    deps.workbook.tables.set('Settings', new MemoryTable());
    expect(decidePage(deps).kind).toBe('setup');
  });
});
