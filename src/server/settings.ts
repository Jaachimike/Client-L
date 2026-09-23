import { z } from 'zod';
import { statusSchema } from '../shared/schemas';
import { DEFAULT_STATUSES } from '../shared/statuses';
import type { Status } from '../shared/types';
import { Repository } from './repository';
import { cellText } from './records';
import type { Workbook } from './store';
import { SETTINGS_TAB } from './tabs';
import { AppError } from '../shared/result';

export const SETTING_KEYS = {
  allowedEmails: 'Allowed emails',
  taskStatuses: 'Task statuses',
  defaultCurrency: 'Default currency',
  expiryWarningDays: 'Expiry warning days',
  appName: 'App name',
} as const;

export const DEFAULT_SETTINGS: Record<string, string> = {
  [SETTING_KEYS.allowedEmails]: '',
  [SETTING_KEYS.taskStatuses]: JSON.stringify(DEFAULT_STATUSES),
  [SETTING_KEYS.defaultCurrency]: 'USD',
  [SETTING_KEYS.expiryWarningDays]: '30',
  [SETTING_KEYS.appName]: 'Client Task Tracker',
};

export function parseEmailList(value: string): string[] {
  return value
    .split(/[,;\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function parseStatuses(value: string): Status[] {
  if (!value.trim()) return DEFAULT_STATUSES;
  try {
    const parsed = z.array(statusSchema).safeParse(JSON.parse(value));
    if (parsed.success) return parsed.data;
  } catch (error) {
    throw new AppError(
      'SETUP',
      `The "Task statuses" setting is not valid JSON (${String(error)}). Fix it in the Settings tab or save statuses again from the app.`,
    );
  }
  throw new AppError(
    'SETUP',
    'The "Task statuses" setting has an entry the app cannot read. Fix it in the Settings tab or save statuses again from the app.',
  );
}

/** Key/value settings tab, read once per request. */
export class SettingsStore {
  private readonly repo: Repository;

  constructor(workbook: Workbook) {
    const table = workbook.getTable(SETTINGS_TAB.name);
    if (!table) {
      throw new AppError(
        'SETUP',
        'This sheet has no Settings tab yet. Run setup() from the Apps Script editor first.',
      );
    }
    this.repo = new Repository(table, SETTINGS_TAB);
  }

  get(key: string): string {
    const row = this.repo.list().find((r) => cellText(r['Key']) === key);
    return row ? cellText(row['Value']) : (DEFAULT_SETTINGS[key] ?? '');
  }

  has(key: string): boolean {
    return this.repo.list().some((r) => cellText(r['Key']) === key);
  }

  set(key: string, value: string): void {
    const updated = this.repo.updateWhere(
      (r) => cellText(r['Key']) === key,
      (r) => ({ ...r, Value: value }),
    );
    if (updated === 0) this.repo.insert({ Key: key, Value: value });
  }

  allowedEmails(): string[] {
    return parseEmailList(this.get(SETTING_KEYS.allowedEmails));
  }

  statuses(): Status[] {
    return parseStatuses(this.get(SETTING_KEYS.taskStatuses));
  }

  appName(): string {
    return this.get(SETTING_KEYS.appName) || (DEFAULT_SETTINGS[SETTING_KEYS.appName] ?? '');
  }
}
