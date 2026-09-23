import { describe, expect, it, vi } from 'vitest';
import { MemoryTable } from './memoryStore';
import { Repository } from './repository';
import { SETTINGS_TAB } from './tabs';

function settingsTable() {
  return new MemoryTable([
    ['Value', 'Key', 'Extra'],
    ['a', 'first', 'x'],
    ['', '', ''],
    ['b', 'second', 'y'],
  ]);
}

describe('Repository', () => {
  it('reads by header name, whatever the column order, and skips blank rows', () => {
    const repo = new Repository(settingsTable(), SETTINGS_TAB);
    expect(repo.list()).toEqual([
      { Key: 'first', Value: 'a' },
      { Key: 'second', Value: 'b' },
    ]);
  });

  it('reads the tab once per instance', () => {
    const table = settingsTable();
    const reads = vi.spyOn(table, 'readAll');
    const repo = new Repository(table, SETTINGS_TAB);
    repo.list();
    repo.list();
    repo.insert({ Key: 'third', Value: 'c' });
    expect(reads).toHaveBeenCalledTimes(1);
  });

  it('writes a batch update as one block and keeps unknown columns', () => {
    const table = settingsTable();
    const writes = vi.spyOn(table, 'writeRows');
    const repo = new Repository(table, SETTINGS_TAB);
    const count = repo.updateWhere(
      () => true,
      (row) => ({ ...row, Value: 'z' }),
    );
    expect(count).toBe(2);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(table.rows).toEqual([
      ['Value', 'Key', 'Extra'],
      ['z', 'first', 'x'],
      ['', '', ''],
      ['z', 'second', 'y'],
    ]);
  });

  it('explains how to fix a tab that is missing a column', () => {
    const repo = new Repository(new MemoryTable([['Key']]), SETTINGS_TAB);
    expect(() => repo.list()).toThrow(/missing the column "Value".*setup\(\)/);
  });
});
