import { useEffect, useRef, useState } from 'react';
import { monthLabel, type MonthBar } from '../../../shared/cashflow';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/cn';
import { formatCompact, formatMoney } from '../../lib/money';
import { ChartTable, Legend } from './chartParts';

interface CashFlowChartProps {
  series: MonthBar[];
  currency: string;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

const DEFAULT_WIDTH = 600;
const MIN_WIDTH = 280;
const HEIGHT = 220;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 186;
const PLOT_LEFT = 56;
/** Bars never grow past 24px, however wide the chart is. */
const MAX_BAR = 22;
const GAP = 2;
const RADIUS = 4;

/** A bar with a 4px rounded top and a square base on the baseline. */
function barPath(x: number, top: number, bottom: number, bar: number): string {
  const r = Math.min(RADIUS, (bottom - top) / 2, bar / 2);
  if (bottom - top < 0.5) return '';
  return `M${x},${bottom}V${top + r}Q${x},${top} ${x + r},${top}H${x + bar - r}Q${x + bar},${top} ${x + bar},${top + r}V${bottom}Z`;
}

export function CashFlowChart({
  series,
  currency,
  selectedMonth,
  onSelectMonth,
}: CashFlowChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...series.flatMap((b) => [b.inflow, b.outflow]));
  const y = (value: number) => PLOT_BOTTOM - (value / max) * (PLOT_BOTTOM - PLOT_TOP);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const plotRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(MIN_WIDTH, Math.round(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [asTable]);
  const slot = (width - PLOT_LEFT) / series.length;
  const bar = Math.min(MAX_BAR, (slot - 12) / 2);
  const ticks = [0, max / 2, max];
  const active = series.find((b) => b.month === (hovered ?? selectedMonth));

  return (
    <section
      aria-labelledby="chart-heading"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="chart-heading" className="font-medium">
          Last 6 months ({currency})
        </h2>
        <div className="flex items-center gap-3">
          <Legend />
          <Button
            variant="ghost"
            size="dense"
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
          >
            {asTable ? 'Show chart' : 'Show as table'}
          </Button>
        </div>
      </div>
      {asTable ? (
        <ChartTable series={series} currency={currency} selectedMonth={selectedMonth} />
      ) : (
        <div className="relative" ref={plotRef}>
          <svg
            viewBox={`0 0 ${width} ${HEIGHT}`}
            width={width}
            height={HEIGHT}
            className="block max-w-full"
            role="group"
            aria-labelledby="chart-heading"
          >
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PLOT_LEFT}
                  x2={width}
                  y1={y(t)}
                  y2={y(t)}
                  className="stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={PLOT_LEFT - 8}
                  y={y(t) + 4}
                  textAnchor="end"
                  className="fill-text-muted font-mono text-[11px]"
                >
                  {formatCompact(t, currency)}
                </text>
              </g>
            ))}
            {series.map((b, i) => {
              const x = PLOT_LEFT + i * slot + (slot - (bar * 2 + GAP)) / 2;
              const selected = b.month === selectedMonth;
              return (
                <g
                  key={b.month}
                  role="button"
                  tabIndex={0}
                  aria-label={`${monthLabel(b.month)}: inflow ${formatMoney(b.inflow, currency)}, outflow ${formatMoney(b.outflow, currency)}. Show this month.`}
                  aria-pressed={selected}
                  className="cursor-pointer"
                  onClick={() => onSelectMonth(b.month)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    onSelectMonth(b.month);
                  }}
                  onMouseEnter={() => setHovered(b.month)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(b.month)}
                  onBlur={() => setHovered(null)}
                >
                  <rect
                    x={PLOT_LEFT + i * slot + 2}
                    y={PLOT_TOP - 8}
                    width={slot - 4}
                    height={PLOT_BOTTOM - PLOT_TOP + 32}
                    rx={8}
                    className={
                      selected
                        ? 'fill-accent-tint'
                        : hovered === b.month
                          ? 'fill-surface-muted'
                          : 'fill-transparent'
                    }
                  />
                  <path d={barPath(x, y(b.inflow), PLOT_BOTTOM, bar)} className="fill-accent" />
                  <path
                    d={barPath(x + bar + GAP, y(b.outflow), PLOT_BOTTOM, bar)}
                    className="fill-outflow"
                  />
                  <text
                    x={PLOT_LEFT + i * slot + slot / 2}
                    y={PLOT_BOTTOM + 18}
                    textAnchor="middle"
                    className={cn(
                      'text-[12px]',
                      selected ? 'fill-text font-semibold' : 'fill-text-muted',
                    )}
                  >
                    {monthLabel(b.month).split(' ')[0]}
                  </text>
                </g>
              );
            })}
            <line
              x1={PLOT_LEFT}
              x2={width}
              y1={PLOT_BOTTOM}
              y2={PLOT_BOTTOM}
              className="stroke-border-strong"
              strokeWidth={1}
            />
          </svg>
          {active && (
            <p className="mt-2 text-[13px] text-text-muted" aria-live="polite">
              <span className="font-medium text-text">{monthLabel(active.month)}</span> · In{' '}
              <span className="font-mono text-text">{formatMoney(active.inflow, currency)}</span> ·
              Out{' '}
              <span className="font-mono text-text">{formatMoney(active.outflow, currency)}</span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
