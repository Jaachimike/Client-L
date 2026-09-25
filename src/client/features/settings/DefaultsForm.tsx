import { useState, type FormEvent } from 'react';
import type { Bootstrap } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert, StatusBanner } from '../../components/ui/feedback';
import { describedBy, Field, Input, Select } from '../../components/ui/form';
import { errorMessage, fieldErrors } from '../../lib/api';
import { useSaveDefaults } from '../../lib/renewalQueries';
import { CurrencyPicker, currencyName } from './CurrencyPicker';

const CATEGORY_HINT =
  'Suggested when adding entries, separated by commas. Entries can still use others.';
const WINDOW_HINT =
  'Contracts ending and subscriptions renewing within this many days are flagged.';

export function DefaultsForm({ bootstrap }: { bootstrap: Bootstrap }) {
  const save = useSaveDefaults();
  const [currencies, setCurrencies] = useState(bootstrap.currencies);
  const [defaultCurrency, setDefaultCurrency] = useState(bootstrap.defaultCurrency);
  const [days, setDays] = useState(String(bootstrap.warningDays));
  const [categories, setCategories] = useState(bootstrap.categories.join(', '));
  const [saved, setSaved] = useState(false);
  const list = currencies.includes(defaultCurrency) ? currencies : [defaultCurrency, ...currencies];
  const fields = fieldErrors(save.error);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    save.mutate(
      {
        defaultCurrency,
        currencies: list,
        warningDays: Number(days),
        categories: categories
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
      },
      { onSuccess: () => setSaved(true) },
    );
  };

  return (
    <section
      aria-labelledby="defaults-heading"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <h2 id="defaults-heading" className="font-heading text-2xl font-semibold">
        Warnings and defaults
      </h2>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <CurrencyPicker
          selected={list}
          defaultCurrency={defaultCurrency}
          onChange={setCurrencies}
        />
        {(fields['currencies'] ?? fields['currencies.0']) && (
          <ErrorAlert>{fields['currencies'] ?? fields['currencies.0']}</ErrorAlert>
        )}
        <Field id="defaults-currency" label="Default currency" error={fields['defaultCurrency']}>
          <Select
            id="defaults-currency"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
          >
            {list.map((code) => (
              <option key={code} value={code}>
                {currencyName(code)}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="defaults-categories" label="Cash flow categories" hint={CATEGORY_HINT}>
          <Input
            id="defaults-categories"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            aria-describedby={describedBy('defaults-categories', undefined, CATEGORY_HINT)}
          />
        </Field>
        <Field
          id="defaults-days"
          label="Warning window (days)"
          hint={WINDOW_HINT}
          error={fields['warningDays']}
        >
          <Input
            id="defaults-days"
            type="number"
            min={1}
            max={365}
            inputMode="numeric"
            className="font-mono sm:w-32"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            aria-describedby={describedBy('defaults-days', fields['warningDays'], WINDOW_HINT)}
          />
        </Field>
        {save.isError && <ErrorAlert>{errorMessage(save.error)}</ErrorAlert>}
        {saved && <StatusBanner>Defaults saved.</StatusBanner>}
        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save defaults'}
          </Button>
        </div>
      </form>
    </section>
  );
}
