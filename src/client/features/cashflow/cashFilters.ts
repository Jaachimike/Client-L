import { monthOf, type CashFilters, type CashPeriod } from '../../../shared/cashflow';
import type { Transaction } from '../../../shared/types';
import type { Route } from '../../lib/router';

export type TypeView = '' | 'Inflow' | 'Outflow' | 'voided';

export interface CashParams {
  period: CashPeriod;
  currency: string;
  view: TypeView;
  client: string;
  category: string;
}

const VIEWS: TypeView[] = ['', 'Inflow', 'Outflow', 'voided'];

export function readCashParams(route: Route, today: string, defaultCurrency: string): CashParams {
  const period = route.params.get('period') ?? '';
  return {
    period:
      period === 'all'
        ? { kind: 'all' }
        : period === 'undated'
          ? { kind: 'undated' }
          : { kind: 'month', month: /^\d{4}-\d{2}$/.test(period) ? period : monthOf(today) },
    currency: route.params.get('currency') || defaultCurrency,
    view: VIEWS.find((v) => v === route.params.get('type')) ?? '',
    client: route.params.get('client') ?? '',
    category: route.params.get('category') ?? '',
  };
}

export function periodParam(period: CashPeriod): string {
  return period.kind === 'month' ? period.month : period.kind;
}

export function toFilters(params: CashParams, withCurrency: boolean): CashFilters {
  return {
    period: params.period,
    currency: withCurrency ? params.currency : undefined,
    clientId: params.client,
    category: params.category,
    type: params.view === 'voided' ? '' : params.view,
    voided: params.view === 'voided',
  };
}

/** Months that have entries, plus the current one, newest first. */
export function monthOptions(txs: Transaction[], today: string): string[] {
  const months = new Set(txs.filter((t) => t.date).map((t) => monthOf(t.date)));
  months.add(monthOf(today));
  return [...months].sort().reverse();
}
