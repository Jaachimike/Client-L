import { AppError } from '../shared/result';
import type { RequestContext } from './context';

/** New records must use a listed currency; an edit may keep the currency it already had. */
export function requireCurrency(ctx: RequestContext, currency: string, existing?: string): void {
  if (currency === existing || ctx.settings.currencies().includes(currency)) return;
  throw new AppError(
    'VALIDATION',
    `${currency} is not in your currency list. Add it in Settings first.`,
    { currency: `Add ${currency} to the currency list in Settings first.` },
  );
}
