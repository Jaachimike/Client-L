import { z } from 'zod';
import { isIsoDate } from './dates';
import { currencySchema } from './renewalSchemas';

/** Positive amounts only: an outflow is a positive amount with type Outflow. */
export const positiveAmount = z.preprocess(
  (value) =>
    typeof value === 'string'
      ? value.trim() === ''
        ? undefined
        : Number(value.replace(/,/g, ''))
      : value,
  z
    .number({
      required_error: 'Enter the amount.',
      invalid_type_error: 'The amount must be a number.',
    })
    .finite('The amount must be a number.')
    .positive(
      'The amount must be more than zero. Record money out as an Outflow, not a negative number.',
    ),
);

const optionalDate = z
  .string()
  .trim()
  .default('')
  .refine((v) => v === '' || isIsoDate(v), 'Enter the date as a real date.');

export const transactionInputSchema = z.object({
  id: z.string().trim().optional(),
  date: optionalDate,
  type: z.enum(['Inflow', 'Outflow'], {
    errorMap: () => ({ message: 'Choose Inflow or Outflow.' }),
  }),
  amount: positiveAmount,
  currency: currencySchema,
  category: z.string().trim().max(80, 'Keep the category under 80 characters.').default(''),
  clientId: z.string().trim().default(''),
  description: z
    .string()
    .trim()
    .min(1, 'Enter a description.')
    .max(300, 'Keep the description under 300 characters.'),
  reference: z.string().trim().max(1000, 'Keep the reference under 1000 characters.').default(''),
});
export type TransactionInput = z.input<typeof transactionInputSchema>;

export const importRowSchema = transactionInputSchema
  .omit({ id: true, clientId: true })
  .extend({ line: z.number().int(), clientName: z.string().trim().max(200).default('') });

export const importRowsSchema = z
  .array(importRowSchema)
  .min(1, 'There is nothing to import.')
  .max(5000, 'Import at most 5,000 rows at a time.');
export type ImportRowInput = z.input<typeof importRowSchema>;
