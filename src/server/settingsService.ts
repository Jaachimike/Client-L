import { AppError } from '../shared/result';
import { emailListSchema, statusListSchema } from '../shared/schemas';
import { diffStatuses } from '../shared/statuses';
import type { Bootstrap, Status } from '../shared/types';
import { parseInput, type RequestContext } from './context';
import { cellText } from './records';
import { SETTING_KEYS } from './settings';

function getBootstrap(ctx: RequestContext): Bootstrap {
  return {
    email: ctx.deps.currentEmail(),
    appName: ctx.settings.appName(),
    today: ctx.deps.today(),
    statuses: ctx.settings.statuses(),
    allowedEmails: ctx.settings.allowedEmails(),
  };
}

function saveStatuses(ctx: RequestContext, [input]: unknown[]): Status[] {
  const statuses = parseInput(statusListSchema, input);
  return ctx.deps.withLock(() => {
    const { renames, removed } = diffStatuses(ctx.settings.statuses(), statuses);
    const tasks = ctx.tasks();
    for (const name of removed) {
      const inUse = tasks.list().filter((row) => cellText(row['Status']) === name).length;
      if (inUse > 0) {
        throw new AppError(
          'CONFLICT',
          `"${name}" is used by ${inUse} ${inUse === 1 ? 'task' : 'tasks'}, so it cannot be deleted. Retire it instead.`,
        );
      }
    }
    if (renames.size > 0) {
      tasks.updateWhere(
        (row) => renames.has(cellText(row['Status'])),
        (row) => ({
          ...row,
          Status: renames.get(cellText(row['Status'])) ?? cellText(row['Status']),
        }),
      );
    }
    ctx.settings.set(SETTING_KEYS.taskStatuses, JSON.stringify(statuses));
    return statuses;
  });
}

function saveAllowedEmails(ctx: RequestContext, [input]: unknown[]): string[] {
  const emails = [...new Set(parseInput(emailListSchema, input))];
  const own = ctx.deps.currentEmail().trim().toLowerCase();
  if (!emails.includes(own)) {
    throw new AppError(
      'VALIDATION',
      'You cannot remove your own email, or you would lose access to the app.',
    );
  }
  return ctx.deps.withLock(() => {
    ctx.settings.set(SETTING_KEYS.allowedEmails, emails.join(', '));
    return emails;
  });
}

export const settingsHandlers = {
  getBootstrap: (ctx: RequestContext) => getBootstrap(ctx),
  saveStatuses,
  saveAllowedEmails,
};
