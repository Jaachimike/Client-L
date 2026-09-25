import { useState } from 'react';
import { COMMON_CURRENCIES, normaliseCodes } from '../../../shared/currencies';
import { Button } from '../../components/ui/button';
import { describedBy, Field, Input } from '../../components/ui/form';

interface CurrencyPickerProps {
  selected: string[];
  defaultCurrency: string;
  onChange: (codes: string[]) => void;
}

const ADD_HINT = 'Any 3-letter ISO currency code, for example SEK or BRL.';

/** "GBP – British Pound", or just the code where the browser has no name for it. */
export function currencyName(code: string): string {
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(code);
    return name && name !== code ? `${code} – ${name}` : code;
  } catch (error) {
    if (error instanceof RangeError) return code;
    throw error;
  }
}

/** Tick the currencies you use; only those are offered in forms. The default is always kept. */
export function CurrencyPicker({ selected, defaultCurrency, onChange }: CurrencyPickerProps) {
  const [extra, setExtra] = useState('');
  const [extraError, setExtraError] = useState('');
  const options = normaliseCodes([...COMMON_CURRENCIES, ...selected]);

  const toggle = (code: string, on: boolean) =>
    onChange(on ? normaliseCodes([...selected, code]) : selected.filter((c) => c !== code));

  const add = () => {
    const code = extra.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) {
      setExtraError('Enter a 3-letter currency code, such as SEK.');
      return;
    }
    setExtraError('');
    setExtra('');
    onChange(normaliseCodes([...selected, code]));
  };

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] font-medium">Currencies you use</legend>
        <p className="text-xs text-text-muted">
          Only ticked currencies appear in forms. Totals are always kept separate per currency.
        </p>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          {options.map((code) => {
            const isDefault = code === defaultCurrency;
            return (
              <label key={code} className="flex min-h-10 items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={isDefault || selected.includes(code)}
                  disabled={isDefault}
                  onChange={(e) => toggle(code, e.target.checked)}
                />
                <span>
                  {currencyName(code)}
                  {isDefault && <span className="ml-1 text-text-muted">(default)</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <Field
        id="currency-extra"
        label="Add another currency"
        optional
        hint={ADD_HINT}
        error={extraError}
      >
        <div className="flex gap-2">
          <Input
            id="currency-extra"
            value={extra}
            maxLength={3}
            className="w-28 font-mono uppercase"
            aria-invalid={Boolean(extraError)}
            aria-describedby={describedBy('currency-extra', extraError, ADD_HINT)}
            onChange={(e) => setExtra(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              add();
            }}
          />
          <Button variant="secondary" onClick={add}>
            Add
          </Button>
        </div>
      </Field>
    </div>
  );
}
