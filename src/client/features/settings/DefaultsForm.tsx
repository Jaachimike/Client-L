import { useState, type FormEvent } from 'react';
import type { Bootstrap } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert, StatusBanner } from '../../components/ui/feedback';
import { describedBy, Field, Input, Select } from '../../components/ui/form';
import { errorMessage, fieldErrors } from '../../lib/api';
import { useSaveDefaults } from '../../lib/renewalQueries';

const CURRENCY_HINT = 'Three-letter codes separated by commas, for example NGN, USD, GBP.';
const WINDOW_HINT =
  'Contracts ending and subscriptions renewing within this many days are flagged.';

function parseCodes(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[,;\s]+/)
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
}

export function DefaultsForm({ bootstrap }: { bootstrap: Bootstrap }) {
  const save = useSaveDefaults();
  const [codes, setCodes] = useState(bootstrap.currencies.join(', '));
  const [defaultCurrency, setDefaultCurrency] = useState(bootstrap.defaultCurrency);
  const [days, setDays] = useState(String(bootstrap.warningDays));
  const [saved, setSaved] = useState(false);
  const list = parseCodes(codes);
  const choices = list.includes(defaultCurrency) ? list : [defaultCurrency, ...list];
  const fields = fieldErrors(save.error);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    save.mutate(
      { defaultCurrency, currencies: list, warningDays: Number(days) },
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
        <Field
          id="defaults-currencies"
          label="Currencies"
          hint={CURRENCY_HINT}
          error={fields['currencies'] ?? fields['currencies.0']}
        >
          <Input
            id="defaults-currencies"
            value={codes}
            onChange={(e) => setCodes(e.target.value)}
            aria-describedby={describedBy(
              'defaults-currencies',
              fields['currencies'],
              CURRENCY_HINT,
            )}
          />
        </Field>
        <Field id="defaults-currency" label="Default currency" error={fields['defaultCurrency']}>
          <Select
            id="defaults-currency"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
          >
            {choices.map((code) => (
              <option key={code}>{code}</option>
            ))}
          </Select>
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
