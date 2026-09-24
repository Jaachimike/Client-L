import { monthLabel, type MonthBar } from '../../../shared/cashflow';
import { cn } from '../../lib/cn';
import { formatMoney } from '../../lib/money';

export function Legend() {
  return (
    <ul className="flex gap-4 text-[13px] text-text-muted" aria-label="Legend">
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-3 rounded-sm bg-accent" /> Inflow
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-3 rounded-sm bg-outflow" /> Outflow
      </li>
    </ul>
  );
}

/** The chart's numbers as a table, for screen readers, printing and exact values. */
export function ChartTable({
  series,
  currency,
  selectedMonth,
}: {
  series: MonthBar[];
  currency: string;
  selectedMonth: string;
}) {
  return (
    <table className="w-full text-left text-[13px]">
      <thead className="text-xs tracking-[0.04em] text-text-muted uppercase">
        <tr>
          <th className="py-2 font-medium">Month</th>
          <th className="py-2 text-right font-medium">Inflow</th>
          <th className="py-2 text-right font-medium">Outflow</th>
        </tr>
      </thead>
      <tbody>
        {series.map((b) => (
          <tr
            key={b.month}
            className={cn('border-t border-border', b.month === selectedMonth && 'font-semibold')}
          >
            <td className="py-2">{monthLabel(b.month)}</td>
            <td className="py-2 text-right font-mono">{formatMoney(b.inflow, currency)}</td>
            <td className="py-2 text-right font-mono">{formatMoney(b.outflow, currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
