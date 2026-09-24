import { AppError } from '../shared/result';
import type { Cell, TableStore } from './store';
import { headersOf, type TabDefinition } from './tabs';

export type Row = Record<string, Cell>;

interface Snapshot {
  headers: string[];
  rows: Cell[][];
}

const ID = 'ID';

function normaliseHeader(header: Cell): string {
  return String(header).trim().toLowerCase();
}

function isBlankRow(row: Cell[]): boolean {
  return row.every((cell) => String(cell).trim() === '');
}

/**
 * Reads and writes one tab by header name, so users can reorder or add columns.
 * The tab is read once per instance; create one repository per request.
 */
export class Repository {
  private snapshot: Snapshot | null = null;

  constructor(
    private readonly store: TableStore,
    private readonly tab: TabDefinition,
  ) {}

  list(): Row[] {
    const { headers, rows } = this.load();
    return rows.filter((row) => !isBlankRow(row)).map((row) => this.toRecord(headers, row));
  }

  findById(id: string): Row | null {
    return this.list().find((row) => row[ID] === id) ?? null;
  }

  insert(record: Row): void {
    this.insertMany([record]);
  }

  /** Appends many records with a single write. */
  insertMany(records: Row[]): void {
    if (records.length === 0) return;
    const snapshot = this.load();
    const rows = records.map((record) => this.toCells(snapshot.headers, record, []));
    this.store.appendRows(rows);
    snapshot.rows.push(...rows);
  }

  update(id: string, patch: Row): Row {
    const snapshot = this.load();
    const index = snapshot.rows.findIndex((row) => this.idOf(snapshot.headers, row) === id);
    const existing = snapshot.rows[index];
    if (index < 0 || !existing) {
      throw new AppError(
        'NOT_FOUND',
        `That record no longer exists in the ${this.tab.name} tab. Reload and try again.`,
      );
    }
    const row = this.toCells(snapshot.headers, patch, existing);
    this.store.writeRows(index + 1, [row]);
    snapshot.rows[index] = row;
    return this.toRecord(snapshot.headers, row);
  }

  /** Applies `change` to every matching row and writes the affected block in one call. */
  updateWhere(matches: (row: Row) => boolean, change: (row: Row) => Row): number {
    const snapshot = this.load();
    const changed: number[] = [];
    snapshot.rows = snapshot.rows.map((cells, index) => {
      const record = this.toRecord(snapshot.headers, cells);
      if (isBlankRow(cells) || !matches(record)) return cells;
      changed.push(index);
      return this.toCells(snapshot.headers, change(record), cells);
    });
    const first = changed[0];
    const last = changed[changed.length - 1];
    if (first !== undefined && last !== undefined) {
      this.store.writeRows(first + 1, snapshot.rows.slice(first, last + 1));
    }
    return changed.length;
  }

  private load(): Snapshot {
    if (this.snapshot) return this.snapshot;
    const [headerRow = [], ...rows] = this.store.readAll();
    const headers = headerRow.map((h) => String(h).trim());
    const present = new Set(headerRow.map(normaliseHeader));
    const missing = headersOf(this.tab).filter((h) => !present.has(h.toLowerCase()));
    if (missing.length > 0) {
      throw new AppError(
        'SETUP',
        `The ${this.tab.name} tab is missing the column "${missing.join('", "')}". Run setup() from the Apps Script editor to repair it.`,
      );
    }
    this.snapshot = { headers, rows: rows.map((row) => headers.map((_, i) => row[i] ?? '')) };
    return this.snapshot;
  }

  private columnIndex(headers: string[], header: string): number {
    return headers.findIndex((h) => h.toLowerCase() === header.toLowerCase());
  }

  private idOf(headers: string[], row: Cell[]): string {
    return String(row[this.columnIndex(headers, ID)] ?? '');
  }

  private toRecord(headers: string[], row: Cell[]): Row {
    const record: Row = {};
    for (const column of this.tab.columns) {
      record[column.header] = row[this.columnIndex(headers, column.header)] ?? '';
    }
    return record;
  }

  /** Builds a full row, keeping values in columns the app does not know about. */
  private toCells(headers: string[], record: Row, existing: Cell[]): Cell[] {
    return headers.map((header, i) => {
      const known = this.tab.columns.find((c) => c.header.toLowerCase() === header.toLowerCase());
      const value = known ? record[known.header] : undefined;
      return value ?? existing[i] ?? '';
    });
  }
}
