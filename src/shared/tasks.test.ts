import { describe, expect, it } from 'vitest';
import { doneStatusNames, DEFAULT_STATUSES, statusOptionsFor, diffStatuses } from './statuses';
import { filterTasks, isDueThisWeek, isOverdue, sortTasks, withStatus, type TaskContext } from './tasks';
import type { Task } from './types';

const ctx: TaskContext = { today: '2026-10-01', doneStatuses: doneStatusNames(DEFAULT_STATUSES) };

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 'id',
    clientId: 'c1',
    title: 'Task',
    description: '',
    links: '',
    dueDate: '',
    status: 'To do',
    created: '2026-09-01 09:00:00',
    updated: '',
    deliveredOn: '',
    ...overrides,
  };
}

describe('overdue', () => {
  it('is overdue when due before today and not in a done status', () => {
    expect(isOverdue(task({ dueDate: '2026-09-30' }), ctx)).toBe(true);
    expect(isOverdue(task({ dueDate: '2026-10-01' }), ctx)).toBe(false);
    expect(isOverdue(task({ dueDate: '2026-09-30', status: 'Delivered' }), ctx)).toBe(false);
    expect(isOverdue(task({ dueDate: '' }), ctx)).toBe(false);
  });

  it('respects custom done statuses', () => {
    const custom = { ...ctx, doneStatuses: new Set(['Invoiced']) };
    expect(isOverdue(task({ dueDate: '2026-09-01', status: 'Invoiced' }), custom)).toBe(false);
  });
});

describe('due this week', () => {
  it('covers today and the next six days', () => {
    expect(isDueThisWeek(task({ dueDate: '2026-10-01' }), ctx)).toBe(true);
    expect(isDueThisWeek(task({ dueDate: '2026-10-07' }), ctx)).toBe(true);
    expect(isDueThisWeek(task({ dueDate: '2026-10-08' }), ctx)).toBe(false);
    expect(isDueThisWeek(task({ dueDate: '2026-09-30' }), ctx)).toBe(false);
  });
});

describe('filterTasks', () => {
  const tasks = [
    task({ id: '1', clientId: 'a', status: 'To do', title: 'Fix login page' }),
    task({ id: '2', clientId: 'a', status: 'Delivered', title: 'Logo', description: 'New brand colours' }),
    task({ id: '3', clientId: 'b', status: 'To do', title: 'Login emails', dueDate: '2026-09-01' }),
  ];
  const ids = (list: Task[]) => list.map((t) => t.id);

  it('shows only the chosen client, and combining filters narrows both', () => {
    expect(ids(filterTasks(tasks, { clientId: 'a' }, ctx))).toEqual(['1', '2']);
    expect(ids(filterTasks(tasks, { clientId: 'a', status: 'To do' }, ctx))).toEqual(['1']);
  });

  it('matches every search word in title or description, ignoring case', () => {
    expect(ids(filterTasks(tasks, { search: 'LOGIN' }, ctx))).toEqual(['1', '3']);
    expect(ids(filterTasks(tasks, { search: 'brand colours' }, ctx))).toEqual(['2']);
    expect(ids(filterTasks(tasks, { search: 'login brand' }, ctx))).toEqual([]);
  });

  it('filters by due date', () => {
    expect(ids(filterTasks(tasks, { due: 'overdue' }, ctx))).toEqual(['3']);
    expect(ids(filterTasks(tasks, { due: 'none' }, ctx))).toEqual(['1', '2']);
  });
});

describe('sortTasks', () => {
  it('puts open tasks by soonest date first, then undated, then done', () => {
    const sorted = sortTasks(
      [
        task({ id: 'done', status: 'Delivered', dueDate: '2026-09-01' }),
        task({ id: 'nodate' }),
        task({ id: 'late', dueDate: '2026-10-20' }),
        task({ id: 'soon', dueDate: '2026-09-15' }),
      ],
      ctx,
    );
    expect(sorted.map((t) => t.id)).toEqual(['soon', 'late', 'nodate', 'done']);
  });
});

describe('withStatus', () => {
  it('sets Delivered on to today when moved to a done status and clears it when moved back', () => {
    const delivered = withStatus(task({}), 'Delivered', ctx);
    expect(delivered.deliveredOn).toBe('2026-10-01');
    expect(withStatus(delivered, 'In progress', ctx).deliveredOn).toBe('');
  });

  it('keeps the original delivery date when moving between done statuses', () => {
    const custom = { ...ctx, doneStatuses: new Set(['Delivered', 'Invoiced']) };
    const moved = withStatus(task({ status: 'Delivered', deliveredOn: '2026-09-20' }), 'Invoiced', custom);
    expect(moved.deliveredOn).toBe('2026-09-20');
  });
});

describe('statuses', () => {
  it('ships To do, In progress and Delivered, with only Delivered counted as done', () => {
    expect(DEFAULT_STATUSES.map((s) => s.name)).toEqual(['To do', 'In progress', 'Delivered']);
    expect([...doneStatusNames(DEFAULT_STATUSES)]).toEqual(['Delivered']);
  });

  it('offers retired statuses only to tasks that already use them', () => {
    const list = [...DEFAULT_STATUSES, { id: 'w', name: 'Waiting', color: '#7A4209', done: false, retired: true }];
    expect(statusOptionsFor('To do', list).map((s) => s.name)).not.toContain('Waiting');
    expect(statusOptionsFor('Waiting', list).map((s) => s.name)).toContain('Waiting');
  });

  it('detects renames and removals by ID', () => {
    const renamed = DEFAULT_STATUSES.map((s) => (s.id === 'todo' ? { ...s, name: 'Backlog' } : s));
    const change = diffStatuses(DEFAULT_STATUSES, renamed.slice(0, 2));
    expect([...change.renames]).toEqual([['To do', 'Backlog']]);
    expect(change.removed).toEqual(['Delivered']);
  });
});
