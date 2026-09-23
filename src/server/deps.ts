import type { Workbook } from './store';

/** Everything the server needs from Apps Script, so the same code runs in tests and the mock. */
export interface ServerDeps {
  workbook: Workbook;
  currentEmail(): string;
  withLock<T>(fn: () => T): T;
  /** Today's date as `yyyy-MM-dd` in the spreadsheet's time zone. */
  today(): string;
  /** Current time as `yyyy-MM-dd HH:mm:ss` in the spreadsheet's time zone. */
  now(): string;
  newId(): string;
  logError(error: unknown): void;
}
