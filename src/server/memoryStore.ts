import type { Cell, TableStore, Workbook } from './store';

/** In-memory tab used by tests and the local mock server. */
export class MemoryTable implements TableStore {
  constructor(public rows: Cell[][] = []) {}

  readAll(): Cell[][] {
    return this.rows.map((row) => [...row]);
  }

  writeRows(startIndex: number, rows: Cell[][]): void {
    rows.forEach((row, offset) => {
      this.rows[startIndex + offset] = [...row];
    });
  }

  appendRows(rows: Cell[][]): void {
    this.rows.push(...rows.map((row) => [...row]));
  }

  replaceBody(rows: Cell[][]): void {
    this.rows = [this.rows[0] ?? [], ...rows.map((row) => [...row])];
  }

  formatColumn(): void {
    // Formatting only matters in a real sheet.
  }
}

export class MemoryWorkbook implements Workbook {
  readonly tables = new Map<string, MemoryTable>();

  getTable(name: string): MemoryTable | null {
    return this.tables.get(name) ?? null;
  }

  createTable(name: string): MemoryTable {
    const table = new MemoryTable();
    this.tables.set(name, table);
    return table;
  }
}
