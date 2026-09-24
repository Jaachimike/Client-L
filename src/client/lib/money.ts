/** Formats an amount in its own currency, e.g. ₦150,000 or $12.50. */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch (error) {
    if (error instanceof RangeError) return `${currency} ${amount.toLocaleString('en-NG')}`;
    throw error;
  }
}

/** Short form for chart axes and labels, e.g. ₦1.2M. */
export function formatCompact(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch (error) {
    if (error instanceof RangeError) return `${currency} ${amount}`;
    throw error;
  }
}
