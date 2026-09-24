import type { z } from 'zod';
import type { transactionInputSchema } from '../../../shared/cashSchemas';
import type { Transaction } from '../../../shared/types';

export type EntryFormValues = z.input<typeof transactionInputSchema>;
export type EntryValues = z.output<typeof transactionInputSchema>;
export type EntryFieldName = Exclude<keyof EntryFormValues, 'id'>;

export const ENTRY_FIELDS: EntryFieldName[] = [
  'date',
  'type',
  'amount',
  'currency',
  'category',
  'clientId',
  'description',
  'reference',
];

export function initialEntryValues(
  entry: Transaction | undefined,
  today: string,
  defaultCurrency: string,
): EntryFormValues {
  return {
    id: entry?.id,
    date: entry ? entry.date : today,
    type: entry?.type ?? 'Inflow',
    amount: entry ? String(entry.amount) : '',
    currency: entry?.currency ?? defaultCurrency,
    category: entry?.category ?? '',
    clientId: entry?.clientId ?? '',
    description: entry?.description ?? '',
    reference: entry?.reference ?? '',
  };
}
