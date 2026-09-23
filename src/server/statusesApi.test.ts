import { describe, expect, it } from 'vitest';
import type { Status } from '../shared/types';
import { freshApp, unwrap } from './testHelpers';

const waiting: Status = { id: 'waiting', name: 'Waiting on client', color: '#7A4209', done: false, retired: false };

function setup() {
  const app = freshApp();
  const client = unwrap(app.api.saveClient({ name: 'Acme' }));
  const task = unwrap(app.api.saveTask({ clientId: client.id, title: 'Homepage' }));
  const statuses = unwrap(app.api.getBootstrap()).statuses;
  return { ...app, task, statuses };
}

describe('task statuses', () => {
  it('starts with To do, In progress and Delivered, with Delivered counted as done', () => {
    const { statuses } = setup();
    expect(statuses.map((s) => [s.name, s.done])).toEqual([
      ['To do', false],
      ['In progress', false],
      ['Delivered', true],
    ]);
  });

  it('offers a new status in the set order and colour', () => {
    const { api, statuses, task } = setup();
    const [first, ...rest] = statuses;
    if (!first) throw new Error('missing default status');
    unwrap(api.saveStatuses([first, waiting, ...rest]));
    const saved = unwrap(api.getBootstrap()).statuses;
    expect(saved.map((s) => s.name)).toEqual(['To do', 'Waiting on client', 'In progress', 'Delivered']);
    expect(saved[1]?.color).toBe('#7A4209');
    expect(unwrap(api.setTaskStatus(task.id, 'Waiting on client')).status).toBe('Waiting on client');
  });

  it('counts a custom done status as done', () => {
    const { api, statuses, task } = setup();
    const invoiced: Status = { id: 'invoiced', name: 'Invoiced', color: '#1A524E', done: true, retired: false };
    unwrap(api.saveStatuses([...statuses, invoiced]));
    expect(unwrap(api.setTaskStatus(task.id, 'Invoiced')).deliveredOn).toBe('2026-10-01');
  });

  it('blocks deleting a status that is in use but allows retiring it', () => {
    const { api, statuses } = setup();
    const withoutToDo = statuses.filter((s) => s.name !== 'To do');
    expect(api.saveStatuses(withoutToDo)).toMatchObject({
      ok: false,
      error: { code: 'CONFLICT', message: expect.stringContaining('Retire it instead') },
    });
    const retired = statuses.map((s) => (s.name === 'To do' ? { ...s, retired: true } : s));
    expect(api.saveStatuses(retired).ok).toBe(true);
  });

  it('keeps a retired status on existing tasks but does not give it to new ones', () => {
    const { api, statuses, task } = setup();
    unwrap(api.saveStatuses(statuses.map((s) => (s.name === 'To do' ? { ...s, retired: true } : s))));
    expect(unwrap(api.listTasks()).find((t) => t.id === task.id)?.status).toBe('To do');
    const fresh = unwrap(api.saveTask({ clientId: task.clientId, title: 'New' }));
    expect(fresh.status).toBe('In progress');
    unwrap(api.setTaskStatus(task.id, 'Delivered'));
    expect(api.setTaskStatus(task.id, 'To do').ok).toBe(false);
  });

  it('allows deleting a status nobody uses', () => {
    const { api, statuses } = setup();
    unwrap(api.saveStatuses([...statuses, waiting]));
    expect(api.saveStatuses(statuses).ok).toBe(true);
  });

  it('renames the status on every task that uses it', () => {
    const { api, statuses, task } = setup();
    unwrap(api.saveStatuses(statuses.map((s) => (s.name === 'To do' ? { ...s, name: 'Backlog' } : s))));
    expect(unwrap(api.listTasks()).find((t) => t.id === task.id)?.status).toBe('Backlog');
  });

  it('rejects duplicate names, bad colours and a list with nothing active', () => {
    const { api, statuses } = setup();
    const [first] = statuses;
    if (!first) throw new Error('missing default status');
    expect(api.saveStatuses([...statuses, { ...waiting, name: 'to do' }]).ok).toBe(false);
    expect(api.saveStatuses([{ ...first, color: 'red' }]).ok).toBe(false);
    expect(api.saveStatuses(statuses.map((s) => ({ ...s, retired: true }))).ok).toBe(false);
  });
});
