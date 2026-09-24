import { dayWindows, isDayWindow } from '../../../shared/contracts';
import { PAID_BY_OPTIONS, type SubscriptionWindow } from '../../../shared/subscriptions';
import type { PaidBy } from '../../../shared/types';
import type { Route } from '../../lib/router';

export function subscriptionWindows(
  warningDays: number,
): { value: SubscriptionWindow; label: string }[] {
  return [
    { value: 'all', label: 'All' },
    ...dayWindows([7, 30, 90], warningDays).map((d) => ({ value: d, label: `${d} days` })),
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
}

function windowFrom(value: string | null): SubscriptionWindow {
  if (value === 'overdue' || value === 'cancelled' || isDayWindow(value)) return value;
  return 'all';
}

export type Params = {
  window: SubscriptionWindow;
  client: string;
  provider: string;
  paidBy: PaidBy | '';
};

export function readParams(route: Route): Params {
  const paidBy = PAID_BY_OPTIONS.find((o) => o.value === route.params.get('paidBy'))?.value ?? '';
  return {
    window: windowFrom(route.params.get('window')),
    client: route.params.get('client') ?? '',
    provider: route.params.get('provider') ?? '',
    paidBy,
  };
}
