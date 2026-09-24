import { SERVER_FUNCTIONS, type SampleSummary, type ServerHandlers } from '../shared/api';
import { AppError } from '../shared/result';
import { createApi } from './api';
import type { ServerDeps } from './deps';
import { decidePage } from './main';
import { addSampleData, clearSampleData } from './sampleService';
import { runSetup } from './setup';
import { SheetWorkbook } from './sheetStore';

const LOCK_TIMEOUT_MS = 10_000;

function createDeps(): ServerDeps {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const timeZone = spreadsheet.getSpreadsheetTimeZone();
  return {
    workbook: new SheetWorkbook(spreadsheet),
    currentEmail: () => Session.getActiveUser().getEmail(),
    withLock: (fn) => {
      const lock = LockService.getDocumentLock();
      lock.waitLock(LOCK_TIMEOUT_MS);
      try {
        const result = fn();
        SpreadsheetApp.flush();
        return result;
      } finally {
        lock.releaseLock();
      }
    },
    today: () => Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd'),
    now: () => Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm:ss'),
    newId: () => Utilities.getUuid(),
    logError: (error) => console.error(error),
  };
}

export function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  const decision = decidePage(createDeps());
  if (decision.kind !== 'app') {
    return HtmlService.createHtmlOutput(decision.html).setTitle(
      decision.kind === 'denied' ? 'Access denied' : 'Setup needed',
    );
  }
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle(decision.appName)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Run once from the Apps Script editor. Running it again only fills in what is missing. */
export function setup(): string {
  const report = runSetup(createDeps(), Session.getEffectiveUser().getEmail());
  const summary = report.length > 0 ? report.join('\n') : 'Everything was already set up.';
  console.log(summary);
  return summary;
}

const MENU_NAME = 'Client Task Tracker';

/** Simple trigger: adds the app's menu when the sheet opens. */
export function onOpen(): void {
  SpreadsheetApp.getUi()
    .createMenu(MENU_NAME)
    .addItem('Set up this sheet', 'menuSetup')
    .addSeparator()
    .addItem('Add sample data', 'menuAddSampleData')
    .addItem('Clear sample data', 'menuClearSampleData')
    .addToUi();
}

function describe(counts: SampleSummary): string {
  return `${counts.clients} clients, ${counts.tasks} tasks, ${counts.contracts} contracts, ${counts.subscriptions} subscriptions and ${counts.transactions} cash flow entries`;
}

/** Menu actions run for people who can already edit the sheet, so they skip the web app allowlist. */
function runFromMenu(action: () => string): void {
  const ui = SpreadsheetApp.getUi();
  try {
    ui.alert(MENU_NAME, action(), ui.ButtonSet.OK);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof AppError ? error.message : `Something went wrong: ${String(error)}`;
    ui.alert(MENU_NAME, message, ui.ButtonSet.OK);
  }
}

export function menuSetup(): void {
  runFromMenu(
    () => `${setup()}\n\nNext: Extensions > Apps Script > Deploy > New deployment > Web app.`,
  );
}

export function menuAddSampleData(): void {
  runFromMenu(
    () => `Added ${describe(addSampleData(createDeps()))}. Clear them any time from this menu.`,
  );
}

export function menuClearSampleData(): void {
  runFromMenu(
    () => `Removed ${describe(clearSampleData(createDeps()))}. Your own records were not touched.`,
  );
}

function callApi(name: (typeof SERVER_FUNCTIONS)[number], args: unknown[]) {
  const api: ServerHandlers = createApi(createDeps());
  return api[name](...args);
}

export const serverFunctions = Object.fromEntries(
  SERVER_FUNCTIONS.map((name) => [name, (...args: unknown[]) => callApi(name, args)]),
);
