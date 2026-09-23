import { describe, expect, it } from 'vitest';
import { freshApp, tab, unwrap } from './testHelpers';

describe('clients', () => {
  it('blocks a client without a name, with a clear message', () => {
    const { api } = freshApp();
    const result = api.saveClient({ name: '   ' });
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION', message: 'Enter a client name.' },
    });
    expect(result.error?.fields).toEqual({ name: 'Enter a client name.' });
  });

  it('saves a client as a row and lists it straight away', () => {
    const { deps, api } = freshApp();
    const client = unwrap(
      api.saveClient({ name: 'Acme', email: 'hi@acme.test', phone: '0803 000 0000' }),
    );
    expect(unwrap(api.listClients()).map((c) => c.name)).toEqual(['Acme']);
    const [header = [], row = []] = tab(deps, 'Clients').readAll();
    expect(row[header.indexOf('ID')]).toBe(client.id);
    expect(row[header.indexOf('Phone')]).toBe('0803 000 0000');
  });

  it('rejects an invalid email', () => {
    const { api } = freshApp();
    expect(api.saveClient({ name: 'Acme', email: 'not-an-email' })).toMatchObject({
      ok: false,
      error: { fields: { email: 'Enter a valid email address.' } },
    });
  });

  it('renames a client everywhere because tasks link by client ID', () => {
    const { api } = freshApp();
    const client = unwrap(api.saveClient({ name: 'Acme' }));
    const task = unwrap(api.saveTask({ clientId: client.id, title: 'Homepage' }));
    unwrap(api.saveClient({ ...client, name: 'Acme Group' }));
    const clients = unwrap(api.listClients());
    const saved = unwrap(api.listTasks()).find((t) => t.id === task.id);
    expect(clients.find((c) => c.id === saved?.clientId)?.name).toBe('Acme Group');
  });

  it('archives a client but keeps it and its tasks', () => {
    const { api } = freshApp();
    const client = unwrap(api.saveClient({ name: 'Old Co' }));
    unwrap(api.saveTask({ clientId: client.id, title: 'Legacy fix' }));
    unwrap(api.setClientArchived(client.id, true));
    expect(unwrap(api.listClients())[0]).toMatchObject({ name: 'Old Co', archived: true });
    expect(unwrap(api.listTasks())[0]?.clientId).toBe(client.id);
    expect(api.saveTask({ clientId: client.id, title: 'New work' })).toMatchObject({
      ok: false,
      error: { fields: { clientId: 'Choose an active client.' } },
    });
    unwrap(api.setClientArchived(client.id, false));
    expect(unwrap(api.listClients())[0]?.archived).toBe(false);
  });

  it('allows editing a task that stays with an archived client', () => {
    const { api } = freshApp();
    const client = unwrap(api.saveClient({ name: 'Old Co' }));
    const task = unwrap(api.saveTask({ clientId: client.id, title: 'Legacy fix' }));
    unwrap(api.setClientArchived(client.id, true));
    expect(api.saveTask({ ...task, title: 'Legacy fix v2' }).ok).toBe(true);
  });
});
