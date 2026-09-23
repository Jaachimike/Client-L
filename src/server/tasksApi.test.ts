import { describe, expect, it } from 'vitest';
import { freshApp, tab, unwrap } from './testHelpers';

function withClient() {
  const app = freshApp();
  const client = unwrap(app.api.saveClient({ name: 'Acme' }));
  return { ...app, client };
}

describe('tasks', () => {
  it('blocks a task without a client or title; everything else is optional', () => {
    const { api, client } = withClient();
    expect(api.saveTask({ clientId: '', title: 'x' })).toMatchObject({
      ok: false,
      error: { fields: { clientId: 'Choose a client.' } },
    });
    expect(api.saveTask({ clientId: client.id, title: '' })).toMatchObject({
      ok: false,
      error: { fields: { title: 'Enter a task title.' } },
    });
    expect(api.saveTask({ clientId: client.id, title: 'Minimal' }).ok).toBe(true);
  });

  it('rejects a client ID that does not exist', () => {
    const { api } = withClient();
    expect(api.saveTask({ clientId: 'missing', title: 'x' })).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    });
  });

  it('writes a new row in the Tasks tab with the first status', () => {
    const { deps, api, client } = withClient();
    const task = unwrap(
      api.saveTask({ clientId: client.id, title: 'Homepage', dueDate: '2026-10-10' }),
    );
    const [header = [], row = []] = tab(deps, 'Tasks').readAll();
    expect(row[header.indexOf('ID')]).toBe(task.id);
    expect(row[header.indexOf('Status')]).toBe('To do');
    expect(row[header.indexOf('Due date')]).toBe('2026-10-10');
  });

  it('rejects links that are not http or https', () => {
    const { api, client } = withClient();
    const result = api.saveTask({ clientId: client.id, title: 'x', links: 'javascript:alert(1)' });
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION' } });
    expect(result.error?.fields?.['links']).toMatch(/http:\/\/ or https:\/\//);
  });

  it('keeps two saves made back to back, with neither overwritten', () => {
    const { deps, api, client } = withClient();
    const first = unwrap(api.saveTask({ clientId: client.id, title: 'First' }));
    const second = unwrap(api.saveTask({ clientId: client.id, title: 'Second' }));
    expect(first.id).not.toBe(second.id);
    expect(tab(deps, 'Tasks').readAll()).toHaveLength(3);
  });

  it('sets Delivered on when moved to a done status and clears it when reopened', () => {
    const { api, client } = withClient();
    const task = unwrap(api.saveTask({ clientId: client.id, title: 'x' }));
    expect(unwrap(api.setTaskStatus(task.id, 'Delivered')).deliveredOn).toBe('2026-10-01');
    expect(unwrap(api.setTaskStatus(task.id, 'In progress')).deliveredOn).toBe('');
  });

  it('refuses a status that does not exist', () => {
    const { api, client } = withClient();
    const task = unwrap(api.saveTask({ clientId: client.id, title: 'x' }));
    expect(api.setTaskStatus(task.id, 'Imaginary')).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    });
  });

  it('filters on the server with the same rules as the page', () => {
    const { api, client } = withClient();
    const other = unwrap(api.saveClient({ name: 'Beta' }));
    unwrap(api.saveTask({ clientId: client.id, title: 'Alpha work' }));
    unwrap(api.saveTask({ clientId: other.id, title: 'Beta work' }));
    expect(unwrap(api.listTasks({ clientId: other.id })).map((t) => t.title)).toEqual([
      'Beta work',
    ]);
  });

  it('shows edits made directly in the sheet on the next load, even with columns reordered', () => {
    const { deps, api, client } = withClient();
    unwrap(api.saveTask({ clientId: client.id, title: 'Typo titel' }));
    const table = tab(deps, 'Tasks');
    const [header = [], row = []] = table.readAll();
    const reordered = [...header].reverse();
    const values = [...row].reverse();
    values[reordered.indexOf('Title')] = 'Fixed title';
    table.rows = [
      [...reordered, 'My extra column'],
      [...values, 'keep me'],
    ];
    const [task] = unwrap(api.listTasks());
    expect(task?.title).toBe('Fixed title');
    unwrap(api.setTaskStatus(task?.id ?? '', 'In progress'));
    const [newHeader = [], newRow = []] = table.readAll();
    expect(newRow[newHeader.indexOf('My extra column')]).toBe('keep me');
    expect(newRow[newHeader.indexOf('Status')]).toBe('In progress');
  });

  it('stores text containing a script tag as plain text', () => {
    const { api, client } = withClient();
    const task = unwrap(api.saveTask({ clientId: client.id, title: '<script>alert(1)</script>' }));
    expect(task.title).toBe('<script>alert(1)</script>');
  });

  it('lists 1,000 tasks quickly', () => {
    const { api, client } = withClient();
    for (let i = 0; i < 1000; i += 1) {
      unwrap(api.saveTask({ clientId: client.id, title: `Task ${i}` }));
    }
    const started = performance.now();
    expect(unwrap(api.listTasks())).toHaveLength(1000);
    expect(performance.now() - started).toBeLessThan(500);
  });
});
