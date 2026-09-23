import { addDays, WEEK_DAYS } from './dates';
import type { Task, TaskFilters } from './types';

export interface TaskContext {
  today: string;
  doneStatuses: Set<string>;
}

export function isDone(task: Task, ctx: TaskContext): boolean {
  return ctx.doneStatuses.has(task.status);
}

export function isOverdue(task: Task, ctx: TaskContext): boolean {
  return task.dueDate !== '' && task.dueDate < ctx.today && !isDone(task, ctx);
}

export function isDueThisWeek(task: Task, ctx: TaskContext): boolean {
  if (!task.dueDate || isDone(task, ctx)) return false;
  return task.dueDate >= ctx.today && task.dueDate <= addDays(ctx.today, WEEK_DAYS - 1);
}

function searchWords(search: string): string[] {
  return search.toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesSearch(task: Task, words: string[]): boolean {
  if (words.length === 0) return true;
  const haystack = `${task.title} ${task.description}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

function matchesDue(task: Task, filters: TaskFilters, ctx: TaskContext): boolean {
  switch (filters.due ?? 'any') {
    case 'overdue':
      return isOverdue(task, ctx);
    case 'week':
      return isDueThisWeek(task, ctx);
    case 'none':
      return task.dueDate === '';
    case 'any':
      return true;
  }
}

/** Applies every filter except status, so status chips can show counts for the rest. */
export function filterTasksExceptStatus(
  tasks: Task[],
  filters: TaskFilters,
  ctx: TaskContext,
): Task[] {
  const words = searchWords(filters.search ?? '');
  return tasks.filter(
    (task) =>
      (!filters.clientId || task.clientId === filters.clientId) &&
      matchesDue(task, filters, ctx) &&
      matchesSearch(task, words),
  );
}

export function filterTasks(tasks: Task[], filters: TaskFilters, ctx: TaskContext): Task[] {
  return filterTasksExceptStatus(tasks, filters, ctx).filter(
    (task) => !filters.status || task.status === filters.status,
  );
}

export function countByStatus(tasks: Task[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const task of tasks) counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
  return counts;
}

function sortGroup(task: Task, ctx: TaskContext): number {
  if (isDone(task, ctx)) return 2;
  return task.dueDate ? 0 : 1;
}

/** Open tasks by soonest due date, then open tasks with no date, then done tasks. */
export function sortTasks(tasks: Task[], ctx: TaskContext): Task[] {
  return [...tasks].sort((a, b) => {
    const group = sortGroup(a, ctx) - sortGroup(b, ctx);
    if (group !== 0) return group;
    if (sortGroup(a, ctx) === 0 && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    if (sortGroup(a, ctx) === 2 && a.deliveredOn !== b.deliveredOn) {
      return a.deliveredOn > b.deliveredOn ? -1 : 1;
    }
    return a.created < b.created ? -1 : a.created > b.created ? 1 : 0;
  });
}

/** Moving into a done status records today as the delivery date; moving out clears it. */
export function withStatus(task: Task, status: string, ctx: TaskContext): Task {
  const wasDone = isDone(task, ctx);
  const willBeDone = ctx.doneStatuses.has(status);
  let deliveredOn = task.deliveredOn;
  if (willBeDone && !wasDone) deliveredOn = ctx.today;
  if (!willBeDone) deliveredOn = '';
  return { ...task, status, deliveredOn };
}
