import { describe, expect, it } from 'vitest';
import { createMemoryDeps } from './memoryDeps';
import { runSetup } from './setup';
import { ALL_TABS, headersOf } from './tabs';

const OWNER = 'owner@example.com';

describe('setup()', () => {
  it('creates every tab with its headers and default settings', () => {
    const deps = createMemoryDeps({ email: OWNER, today: '2026-10-01' });
    runSetup(deps, OWNER);
    for (const tab of ALL_TABS) {
      expect(deps.workbook.getTable(tab.name)?.rows[0]).toEqual(headersOf(tab));
    }
    const settings = deps.workbook.getTable('Settings')?.rows.map((r) => r[0]);
    expect(settings).toEqual([
      'Key',
      'Allowed emails',
      'Task statuses',
      'Default currency',
      'Currencies',
      'Expiry warning days',
      'App name',
    ]);
    expect(deps.workbook.getTable('Settings')?.rows[1]?.[1]).toBe(OWNER);
  });

  it('does not duplicate tabs, headers, settings or the owner when run twice', () => {
    const deps = createMemoryDeps({ email: OWNER, today: '2026-10-01' });
    runSetup(deps, OWNER);
    const before = JSON.stringify(
      [...deps.workbook.tables.entries()].map(([name, t]) => [name, t.rows]),
    );
    expect(runSetup(deps, OWNER)).toEqual([]);
    const after = JSON.stringify(
      [...deps.workbook.tables.entries()].map(([name, t]) => [name, t.rows]),
    );
    expect(after).toBe(before);
  });

  it('adds only missing columns and keeps existing ones and their order', () => {
    const deps = createMemoryDeps({ email: OWNER, today: '2026-10-01' });
    const clients = deps.workbook.createTable('Clients');
    clients.rows = [
      ['Name', 'My notes', 'ID'],
      ['Acme', 'hello', 'c1'],
    ];
    runSetup(deps, OWNER);
    expect(clients.rows[0]?.slice(0, 3)).toEqual(['Name', 'My notes', 'ID']);
    expect(clients.rows[0]).toContain('Archived');
    expect(clients.rows[1]).toEqual(['Acme', 'hello', 'c1']);
  });

  it('keeps an existing allowlist and adds the owner once', () => {
    const deps = createMemoryDeps({ email: OWNER, today: '2026-10-01' });
    deps.workbook.createTable('Settings').rows = [
      ['Key', 'Value'],
      ['Allowed emails', 'partner@example.com'],
    ];
    runSetup(deps, OWNER.toUpperCase());
    runSetup(deps, OWNER);
    expect(deps.workbook.getTable('Settings')?.rows[1]).toEqual([
      'Allowed emails',
      `partner@example.com, ${OWNER}`,
    ]);
  });
});
