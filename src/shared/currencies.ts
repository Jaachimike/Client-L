/**
 * Currencies offered as tick boxes in Settings. Any other ISO 4217 code can still be added by hand,
 * so this list is a convenience, not a limit.
 */
export const COMMON_CURRENCIES = [
  'NGN',
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'GHS',
  'KES',
  'ZAR',
  'XOF',
  'XAF',
  'EGP',
  'MAD',
  'AED',
  'INR',
  'CNY',
  'JPY',
  'CHF',
] as const;

/** Ticked in a brand-new copy, alongside whatever the default currency is. */
export const STARTER_CURRENCIES = ['USD', 'EUR', 'GBP'];

const CODE = /^[A-Z]{3}$/;

/** Upper-cases, drops anything that is not a 3-letter code, and removes duplicates. */
export function normaliseCodes(codes: string[]): string[] {
  return [...new Set(codes.map((c) => c.trim().toUpperCase()).filter((c) => CODE.test(c)))];
}
