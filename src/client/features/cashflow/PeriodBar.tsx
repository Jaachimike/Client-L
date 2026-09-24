import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, shiftMonth, type CashPeriod } from '../../../shared/cashflow';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/form';
import { periodParam } from './cashFilters';

interface PeriodBarProps {
  period: CashPeriod;
  months: string[];
  currency: string;
  currencies: string[];
  onPeriod: (period: CashPeriod) => void;
  onCurrency: (currency: string) => void;
}

function toPeriod(value: string): CashPeriod {
  if (value === 'all') return { kind: 'all' };
  if (value === 'undated') return { kind: 'undated' };
  return { kind: 'month', month: value };
}

export function PeriodBar({
  period,
  months,
  currency,
  currencies,
  onPeriod,
  onCurrency,
}: PeriodBarProps) {
  const current = periodParam(period);
  const options =
    period.kind === 'month' && !months.includes(period.month) ? [period.month, ...months] : months;
  const step = (offset: number) =>
    period.kind === 'month' && onPeriod({ kind: 'month', month: shiftMonth(period.month, offset) });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="icon"
        aria-label="Previous month"
        disabled={period.kind !== 'month'}
        onClick={() => step(-1)}
      >
        <ChevronLeft aria-hidden size={18} strokeWidth={1.8} />
      </Button>
      <label htmlFor="cash-period" className="sr-only">
        Period
      </label>
      <Select
        id="cash-period"
        value={current}
        onChange={(e) => onPeriod(toPeriod(e.target.value))}
        className="w-44"
      >
        {options.map((m) => (
          <option key={m} value={m}>
            {monthLabel(m)}
          </option>
        ))}
        <option value="all">All time</option>
        <option value="undated">No date</option>
      </Select>
      <Button
        variant="secondary"
        size="icon"
        aria-label="Next month"
        disabled={period.kind !== 'month'}
        onClick={() => step(1)}
      >
        <ChevronRight aria-hidden size={18} strokeWidth={1.8} />
      </Button>
      {currencies.length > 1 && (
        <>
          <label htmlFor="cash-currency" className="sr-only">
            Currency
          </label>
          <Select
            id="cash-currency"
            value={currency}
            onChange={(e) => onCurrency(e.target.value)}
            className="w-28"
          >
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </>
      )}
    </div>
  );
}
