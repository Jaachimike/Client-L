import type { ZodType, ZodTypeDef } from 'zod';
import { AppError } from '../shared/result';
import { doneStatusNames } from '../shared/statuses';
import type { TaskContext } from '../shared/tasks';
import type { ServerDeps } from './deps';
import { Repository } from './repository';
import { SettingsStore } from './settings';
import { CLIENTS_TAB, TASKS_TAB, type TabDefinition } from './tabs';
import { requireAccess } from './auth';

/** Per-request state: repositories are created fresh so each tab is read at most once. */
export class RequestContext {
  readonly settings: SettingsStore;
  private readonly repos = new Map<string, Repository>();

  constructor(readonly deps: ServerDeps) {
    this.settings = new SettingsStore(deps.workbook);
  }

  checkAccess(): void {
    requireAccess(this.deps.currentEmail(), this.settings.allowedEmails());
  }

  clients(): Repository {
    return this.repo(CLIENTS_TAB);
  }

  tasks(): Repository {
    return this.repo(TASKS_TAB);
  }

  taskContext(): TaskContext {
    return { today: this.deps.today(), doneStatuses: doneStatusNames(this.settings.statuses()) };
  }

  private repo(tab: TabDefinition): Repository {
    const existing = this.repos.get(tab.name);
    if (existing) return existing;
    const table = this.deps.workbook.getTable(tab.name);
    if (!table) {
      throw new AppError('SETUP', `This sheet has no ${tab.name} tab yet. Run setup() from the Apps Script editor first.`);
    }
    const repo = new Repository(table, tab);
    this.repos.set(tab.name, repo);
    return repo;
  }
}

export function parseInput<Out, In>(schema: ZodType<Out, ZodTypeDef, In>, value: unknown): Out {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'form';
    fields[key] ??= issue.message;
  }
  const first = result.error.issues[0]?.message ?? 'Some of the details are not valid.';
  throw new AppError('VALIDATION', first, fields);
}
