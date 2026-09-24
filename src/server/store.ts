import type { ColumnKind } from './tabs';

export type Cell = string | number | boolean;

/** A tab as a grid of values; row 0 is the header row. */
export interface TableStore {
  readAll(): Cell[][];
  /** Writes a block of rows starting at a 0-based row index, in one call. */
  writeRows(startIndex: number, rows: Cell[][]): void;
  appendRows(rows: Cell[][]): void;
  /** Replaces every row below the header in one write, removing rows left over at the end. */
  replaceBody(rows: Cell[][]): void;
  formatColumn(columnIndex: number, kind: ColumnKind): void;
}

export interface Workbook {
  getTable(name: string): TableStore | null;
  createTable(name: string): TableStore;
}
