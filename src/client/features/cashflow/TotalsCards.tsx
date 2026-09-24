import type { Totals } from '../../../shared/cashflow';
import { cn } from '../../lib/cn';
import { formatMoney } from '../../lib/money';

interface TotalsCardsProps {
  totals: Totals;
  currency: string;
  periodLabel: string;
  otherCurrencies: string[];
}

function Card({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs tracking-[0.04em] text-text-muted uppercase">{label}</p>
      <p className={cn('mt-1 font-mono text-2xl font-medium', tone)}>{value}</p>
    </div>
  );
}

export function TotalsCards({ totals, currency, periodLabel, otherCurrencies }: TotalsCardsProps) {
  return (
    <section
      aria-label={`Totals for ${periodLabel} in ${currency}`}
      className="flex flex-col gap-2"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Card label="Inflow" value={formatMoney(totals.inflow, currency)} tone="text-success" />
        <Card
          label="Outflow"
          value={formatMoney(totals.outflow, currency)}
          tone="text-outflow-text"
        />
        <Card
          label="Net"
          value={`${totals.net < 0 ? '−' : ''}${formatMoney(Math.abs(totals.net), currency)}`}
          tone={totals.net < 0 ? 'text-danger' : 'text-text'}
        />
      </div>
      {otherCurrencies.length > 0 && (
        <p className="text-[13px] text-text-muted">
          Totals are in {currency} only. This view also has entries in {otherCurrencies.join(', ')};
          switch currency to see them. Different currencies are never added together.
        </p>
      )}
    </section>
  );
}
