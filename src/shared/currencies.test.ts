import { describe, expect, it } from 'vitest';
import { COMMON_CURRENCIES, normaliseCodes, STARTER_CURRENCIES } from './currencies';

describe('currencies', () => {
  it('cleans codes: upper-case, 3 letters only, no duplicates', () => {
    expect(normaliseCodes([' ngn', 'USD', 'usd', 'US', 'EURO', 'gbp'])).toEqual([
      'NGN',
      'USD',
      'GBP',
    ]);
  });

  it('only starts new copies with currencies that are in the common list', () => {
    for (const code of STARTER_CURRENCIES) expect(COMMON_CURRENCIES).toContain(code);
  });
});
