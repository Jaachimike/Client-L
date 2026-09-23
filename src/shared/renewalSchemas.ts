import { z } from 'zod';
import { isIsoDate } from './dates';

const CURRENCY = /^[A-Z]{3}$/;

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(CURRENCY, 'Use a 3-letter currency code such as NGN or USD.');

const requiredDate = (message: string) => z.string().trim().refine(isIsoDate, message);

/** Accepts numbers or numeric text from form fields; rejects blanks, negatives and non-numbers. */
const amount = (label: string) =>
  z.preprocess(
    (value) =>
      typeof value === 'string'
        ? value.trim() === ''
          ? undefined
          : Number(value.replace(/,/g, ''))
        : value,
    z
      .number({
        required_error: `Enter the ${label}.`,
        invalid_type_error: `The ${label} must be a number.`,
      })
      .finite(`The ${label} must be a number.`)
      .min(0, `The ${label} cannot be negative.`),
  );

const text = (max: number) =>
  z.string().trim().max(max, `Keep this under ${max} characters.`).default('');

export const contractInputSchema = z
  .object({
    id: z.string().trim().optional(),
    clientId: z.string().trim().min(1, 'Choose a client.'),
    name: z
      .string()
      .trim()
      .min(1, 'Enter a contract name.')
      .max(200, 'Keep the name under 200 characters.'),
    startDate: requiredDate('Enter the start date.'),
    endDate: requiredDate('Enter the end date.'),
    fee: amount('fee'),
    currency: currencySchema,
    billingCycle: z.enum(['Monthly', 'Quarterly', 'Yearly'], {
      errorMap: () => ({ message: 'Choose a billing cycle.' }),
    }),
    notes: text(5000),
  })
  .refine((c) => c.endDate >= c.startDate, {
    message: 'The end date must be on or after the start date.',
    path: ['endDate'],
  });
export type ContractInput = z.input<typeof contractInputSchema>;

export const subscriptionInputSchema = z.object({
  id: z.string().trim().optional(),
  clientId: z.string().trim().min(1, 'Choose a client.'),
  service: z.string().trim().min(1, 'Enter the service, such as Domain or Hosting.').max(200),
  provider: text(200),
  plan: text(200),
  cost: amount('cost'),
  currency: currencySchema,
  billingCycle: z.enum(['Monthly', 'Yearly'], {
    errorMap: () => ({ message: 'Choose a billing cycle.' }),
  }),
  nextRenewal: requiredDate('Enter the next renewal date.'),
  autoRenew: z.boolean().default(false),
  paidBy: z.enum(['Rebill', 'Client card', 'Contract'], {
    errorMap: () => ({ message: 'Choose who pays.' }),
  }),
  accountEmail: z
    .string()
    .trim()
    .max(320)
    .default('')
    .refine(
      (v) => v === '' || z.string().email().safeParse(v).success,
      'Enter a valid email address.',
    ),
  notes: text(5000),
});
export type SubscriptionInput = z.input<typeof subscriptionInputSchema>;

export const defaultsSchema = z
  .object({
    defaultCurrency: currencySchema,
    currencies: z.array(currencySchema).min(1, 'Keep at least one currency.'),
    warningDays: z.coerce
      .number({ invalid_type_error: 'The warning window must be a number of days.' })
      .int('Use a whole number of days.')
      .min(1, 'The warning window must be at least 1 day.')
      .max(365, 'The warning window can be at most 365 days.'),
  })
  .refine((d) => d.currencies.includes(d.defaultCurrency), {
    message: 'The default currency must be in the currency list.',
    path: ['defaultCurrency'],
  });
export type DefaultsInput = z.input<typeof defaultsSchema>;
