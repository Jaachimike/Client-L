import { z } from 'zod';
import { AppError } from '../shared/result';
import { statusNameSchema, taskFiltersSchema, taskInputSchema, idSchema } from '../shared/schemas';
import { defaultStatusName, statusOptionsFor } from '../shared/statuses';
import { filterTasks, sortTasks, withStatus } from '../shared/tasks';
import type { Task } from '../shared/types';
import { requireClient } from './clientsService';
import { parseInput, type RequestContext } from './context';
import { rowToTask, taskToRow } from './records';

function requireTask(ctx: RequestContext, id: string): Task {
  const row = ctx.tasks().findById(id);
  if (!row) throw new AppError('NOT_FOUND', 'That task no longer exists. Reload to see the latest list.');
  return rowToTask(row);
}

function listTasks(ctx: RequestContext, [filters]: unknown[]): Task[] {
  const parsed = parseInput(taskFiltersSchema, filters);
  const tasks = ctx
    .tasks()
    .list()
    .map(rowToTask)
    .filter((task) => task.id !== '');
  const taskCtx = ctx.taskContext();
  return sortTasks(filterTasks(tasks, parsed, taskCtx), taskCtx);
}

function saveTask(ctx: RequestContext, [input]: unknown[]): Task {
  const data = parseInput(taskInputSchema, input);
  return ctx.deps.withLock(() => {
    const client = requireClient(ctx, data.clientId);
    const now = ctx.deps.now();
    if (data.id) {
      const existing = requireTask(ctx, data.id);
      if (client.archived && client.id !== existing.clientId) {
        throw new AppError('VALIDATION', `${client.name} is archived. Choose an active client.`, { clientId: 'Choose an active client.' });
      }
      const task: Task = { ...existing, ...data, id: existing.id, updated: now };
      ctx.tasks().update(task.id, taskToRow(task));
      return task;
    }
    if (client.archived) {
      throw new AppError('VALIDATION', `${client.name} is archived. Choose an active client.`, { clientId: 'Choose an active client.' });
    }
    const task: Task = {
      ...data,
      id: ctx.deps.newId(),
      status: defaultStatusName(ctx.settings.statuses()),
      created: now,
      updated: now,
      deliveredOn: '',
    };
    ctx.tasks().insert(taskToRow(task));
    return task;
  });
}

const statusArgs = z.tuple([idSchema, statusNameSchema]);

function setTaskStatus(ctx: RequestContext, args: unknown[]): Task {
  const [id, status] = parseInput(statusArgs, args);
  return ctx.deps.withLock(() => {
    const existing = requireTask(ctx, id);
    const allowed = statusOptionsFor(existing.status, ctx.settings.statuses());
    if (!allowed.some((s) => s.name === status)) {
      throw new AppError('VALIDATION', `"${status}" is not an available status. Choose one from the list.`);
    }
    const task = { ...withStatus(existing, status, ctx.taskContext()), updated: ctx.deps.now() };
    ctx.tasks().update(id, taskToRow(task));
    return task;
  });
}

export const taskHandlers = { listTasks, saveTask, setTaskStatus };
