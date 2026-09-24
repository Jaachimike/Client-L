import { duplicateKey } from './cashflow';
import { parseCsv } from './csv';
import { isIsoDate } from './dates';
import { mapColumns, missingColumns, type ColumnMap, type ImportField } from './importColumns';
import type { TransactionType } from './types';

export interface ImportRow {
  line: number;
  date: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  clientName: string;
  description: string;
  reference: string;
}

export interface SkippedRow {
  line: number;
  reason: string;
  text: string;
}

export type ImportPreview =
  | { ok: true; rows: ImportRow[]; skipped: SkippedRow[]; newClients: string[] }
  | { ok: false; message: string };

export interface ImportContext {
  defaultCurrency: string;
  existingClientNames: string[];
  existingKeys: Set<string>;
}

/** Reads DD/MM/YYYY, DD/MM/YY, D/M/YYYY or YYYY-MM-DD; returns '' for a blank cell, null if unreadable. */
export function readDate(value: string): string | null {
  const text = value.trim();
  if (!text) return '';
  if (isIsoDate(text)) return text;
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(text);
  if (!match) return null;
  const [, d = '', m = '', y = ''] = match;
  const iso = `${y.length === 2 ? `20${y}` : y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return isIsoDate(iso) ? iso : null;
}

/** Accepts 150000, 150,000, ₦150,000.00; returns null for text or negatives, 0 for a blank cell. */
export function readAmount(value: string): number | null {
  const text = value.replace(/[₦$£€,\s]|NGN|USD/gi, '');
  if (!text) return 0;
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

export function suggestCategory(type: TransactionType, description: string): string {
  if (type === 'Inflow') return 'Client payment';
  if (/\bui\b/i.test(description)) return 'UI design';
  if (/\bdev\b|develop/i.test(description)) return 'Development';
  return '';
}

type RowResult = { row: ImportRow } | { reason: string };

function readRow(cells: string[], map: ColumnMap, line: number, ctx: ImportContext): RowResult {
  const cell = (field: ImportField) => {
    const index = map[field];
    return index === undefined ? '' : (cells[index] ?? '').trim();
  };
  const description = cell('description');
  if (cells.every((c) => c.trim() === '')) return { reason: 'Blank row' };
  if (/^total\b/i.test(description) && !cell('client') && !cell('date'))
    return { reason: 'Total row; the app works out totals itself' };
  if (!description) return { reason: 'No description' };

  let type: TransactionType;
  let amount: number | null;
  if (map.inflow !== undefined || map.outflow !== undefined) {
    const inflow = readAmount(cell('inflow'));
    const outflow = readAmount(cell('outflow'));
    if (inflow === null || outflow === null) return { reason: 'Amount is not a positive number' };
    if (inflow > 0 && outflow > 0) return { reason: 'Has both an inflow and an outflow' };
    type = inflow > 0 ? 'Inflow' : 'Outflow';
    amount = inflow > 0 ? inflow : outflow;
  } else {
    const typeText = cell('type').toLowerCase();
    if (typeText !== 'inflow' && typeText !== 'outflow')
      return { reason: 'Type must be Inflow or Outflow' };
    type = typeText === 'inflow' ? 'Inflow' : 'Outflow';
    amount = readAmount(cell('amount'));
    if (amount === null) return { reason: 'Amount is not a positive number' };
  }
  if (amount === 0) return { reason: 'No amount' };

  const date = readDate(cell('date'));
  if (date === null)
    return { reason: `Date "${cell('date')}" is not a real date (use DD/MM/YYYY)` };
  if (ctx.existingKeys.has(duplicateKey({ date, type, amount, description })))
    return { reason: 'Already imported' };

  const currency = (cell('currency') || ctx.defaultCurrency).toUpperCase();
  return {
    row: {
      line,
      date,
      type,
      amount,
      currency,
      category: cell('category') || suggestCategory(type, description),
      clientName: cell('client'),
      description,
      reference: cell('reference'),
    },
  };
}

/** Everything the import would do, so it can be shown and confirmed before anything is saved. */
export function previewImport(csvText: string, ctx: ImportContext): ImportPreview {
  const [headers, ...body] = parseCsv(csvText);
  if (!headers) return { ok: false, message: 'The file is empty.' };
  const map = mapColumns(headers);
  const problem = missingColumns(map);
  if (problem) return { ok: false, message: problem };

  const rows: ImportRow[] = [];
  const skipped: SkippedRow[] = [];
  body.forEach((cells, index) => {
    const line = index + 2;
    const result = readRow(cells, map, line, ctx);
    if ('row' in result) rows.push(result.row);
    else skipped.push({ line, reason: result.reason, text: cells.join(', ').slice(0, 120) });
  });
  const known = new Set(ctx.existingClientNames.map((n) => n.trim().toLowerCase()));
  const newClients: string[] = [];
  for (const { clientName } of rows) {
    const key = clientName.toLowerCase();
    if (clientName && !known.has(key)) {
      known.add(key);
      newClients.push(clientName);
    }
  }
  return { ok: true, rows, skipped, newClients };
}
