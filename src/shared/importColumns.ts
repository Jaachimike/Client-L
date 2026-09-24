export type ImportField =
  | 'description'
  | 'inflow'
  | 'outflow'
  | 'amount'
  | 'type'
  | 'client'
  | 'date'
  | 'reference'
  | 'currency'
  | 'category';

/** Header spellings recognised for each field, compared without case, spaces or punctuation. */
const ALIASES: Record<ImportField, string[]> = {
  description: ['description', 'descriptioon', 'details', 'narration', 'item'],
  inflow: ['inflow', 'moneyin', 'in', 'credit', 'income'],
  outflow: ['outflow', 'moneyout', 'out', 'debit', 'expense'],
  amount: ['amount'],
  type: ['type'],
  client: ['projectname', 'project', 'client', 'clientname', 'customer'],
  date: ['date', 'transactiondate', 'paymentdate'],
  reference: ['comments', 'comment', 'reference', 'notes', 'note', 'memo'],
  currency: ['currency'],
  category: ['category'],
};

const FIELDS: ImportField[] = [
  'description',
  'inflow',
  'outflow',
  'amount',
  'type',
  'client',
  'date',
  'reference',
  'currency',
  'category',
];

function normalise(header: string): string {
  return header
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z]/g, '');
}

export type ColumnMap = Partial<Record<ImportField, number>>;

export function mapColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  headers.forEach((header, index) => {
    const key = normalise(header);
    const field = FIELDS.find((f) => ALIASES[f].includes(key));
    if (field && map[field] === undefined) map[field] = index;
  });
  return map;
}

/** Explains which columns are missing, or returns '' when the file can be imported. */
export function missingColumns(map: ColumnMap): string {
  const hasAmounts =
    map.inflow !== undefined ||
    map.outflow !== undefined ||
    (map.amount !== undefined && map.type !== undefined);
  const missing: string[] = [];
  if (map.description === undefined) missing.push('a Description column');
  if (!hasAmounts) missing.push('Inflow and Outflow columns (or Amount and Type)');
  if (missing.length === 0) return '';
  return `The file needs ${missing.join(' and ')}. Check that the first row holds the column headers.`;
}
