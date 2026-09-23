import type { Cell, TableStore, Workbook } from './store';
import type { ColumnKind } from './tabs';

const FORMATS: Record<ColumnKind, string> = {
  text: '@',
  date: 'yyyy-mm-dd',
  datetime: 'yyyy-mm-dd hh:mm:ss',
  boolean: 'General',
  number: 'General',
};

function readCell(value: unknown, timeZone: string): Cell {
  if (value instanceof Date) return Utilities.formatDate(value, timeZone, 'yyyy-MM-dd HH:mm:ss');
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return '';
}

/** A tab in the bound spreadsheet. Reads with one `getValues()` and writes whole blocks. */
class SheetTable implements TableStore {
  constructor(
    private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet,
    private readonly timeZone: string,
  ) {}

  readAll(): Cell[][] {
    if (this.sheet.getLastRow() === 0) return [];
    return this.sheet
      .getDataRange()
      .getValues()
      .map((row) => row.map((value: unknown) => readCell(value, this.timeZone)));
  }

  writeRows(startIndex: number, rows: Cell[][]): void {
    const width = rows[0]?.length ?? 0;
    if (rows.length === 0 || width === 0) return;
    this.sheet.getRange(startIndex + 1, 1, rows.length, width).setValues(rows);
  }

  appendRows(rows: Cell[][]): void {
    this.writeRows(this.sheet.getLastRow(), rows);
  }

  formatColumn(columnIndex: number, kind: ColumnKind): void {
    if (columnIndex < 0) return;
    this.sheet.getRange(2, columnIndex + 1, this.sheet.getMaxRows() - 1, 1).setNumberFormat(FORMATS[kind]);
  }
}

export class SheetWorkbook implements Workbook {
  private readonly timeZone: string;

  constructor(private readonly spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
    this.timeZone = spreadsheet.getSpreadsheetTimeZone();
  }

  getTable(name: string): TableStore | null {
    const sheet = this.spreadsheet.getSheetByName(name);
    return sheet ? new SheetTable(sheet, this.timeZone) : null;
  }

  createTable(name: string): TableStore {
    const sheet = this.spreadsheet.insertSheet(name);
    sheet.setFrozenRows(1);
    return new SheetTable(sheet, this.timeZone);
  }
}
