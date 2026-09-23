import type { Status } from './types';

export const DEFAULT_STATUSES: Status[] = [
  { id: 'todo', name: 'To do', color: '#6B675F', done: false, retired: false },
  { id: 'in-progress', name: 'In progress', color: '#2A0CD0', done: false, retired: false },
  { id: 'delivered', name: 'Delivered', color: '#1A524E', done: true, retired: false },
];

export function doneStatusNames(statuses: Status[]): Set<string> {
  return new Set(statuses.filter((s) => s.done).map((s) => s.name));
}

export function activeStatuses(statuses: Status[]): Status[] {
  return statuses.filter((s) => !s.retired);
}

/** Statuses a task may be moved to: all active ones, plus its current one even if retired. */
export function statusOptionsFor(current: string, statuses: Status[]): Status[] {
  return statuses.filter((s) => !s.retired || s.name === current);
}

export function defaultStatusName(statuses: Status[]): string {
  return activeStatuses(statuses)[0]?.name ?? '';
}

export interface StatusChange {
  renames: Map<string, string>;
  removed: string[];
}

/** Compares two versions of the status list by ID to find renames and removals. */
export function diffStatuses(before: Status[], after: Status[]): StatusChange {
  const afterById = new Map(after.map((s) => [s.id, s]));
  const renames = new Map<string, string>();
  const removed: string[] = [];
  for (const old of before) {
    const next = afterById.get(old.id);
    if (!next) removed.push(old.name);
    else if (next.name !== old.name) renames.set(old.name, next.name);
  }
  return { renames, removed };
}
