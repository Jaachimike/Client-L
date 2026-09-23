import type { ServerDeps } from './deps';
import { cellText } from './records';
import { DEFAULT_SETTINGS, parseEmailList, SETTING_KEYS, SettingsStore } from './settings';
import type { TableStore, Workbook } from './store';
import { ALL_TABS, type TabDefinition } from './tabs';

function ensureHeaders(table: TableStore, tab: TabDefinition): string[] {
  const [headerRow = []] = table.readAll();
  const headers = headerRow.map(cellText);
  while (headers.length > 0 && headers[headers.length - 1] === '') headers.pop();
  const present = new Set(headers.map((h) => h.toLowerCase()));
  const added = tab.columns.filter((c) => !present.has(c.header.toLowerCase())).map((c) => c.header);
  const finalHeaders = [...headers, ...added];
  if (added.length > 0) table.writeRows(0, [finalHeaders]);
  for (const column of tab.columns) {
    const index = finalHeaders.findIndex((h) => h.toLowerCase() === column.header.toLowerCase());
    table.formatColumn(index, column.kind);
  }
  return added;
}

function ensureTab(workbook: Workbook, tab: TabDefinition): string[] {
  const table = workbook.getTable(tab.name) ?? workbook.createTable(tab.name);
  return ensureHeaders(table, tab);
}

/** Creates missing tabs, headers and settings. Safe to run any number of times. */
export function runSetup(deps: ServerDeps, ownerEmail: string): string[] {
  return deps.withLock(() => {
    const report: string[] = [];
    for (const tab of ALL_TABS) {
      const added = ensureTab(deps.workbook, tab);
      if (added.length > 0) report.push(`${tab.name}: added ${added.join(', ')}`);
    }
    const settings = new SettingsStore(deps.workbook);
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      if (!settings.has(key)) {
        settings.set(key, value);
        report.push(`Settings: added ${key}`);
      }
    }
    const owner = ownerEmail.trim().toLowerCase();
    const allowed = parseEmailList(settings.get(SETTING_KEYS.allowedEmails));
    if (owner && !allowed.includes(owner)) {
      settings.set(SETTING_KEYS.allowedEmails, [...allowed, owner].join(', '));
      report.push(`Settings: allowed ${owner}`);
    }
    return report;
  });
}
