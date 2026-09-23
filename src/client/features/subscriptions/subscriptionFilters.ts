import { PAID_BY_OPTIONS, type SubscriptionWindow } from '../../../shared/subscriptions';
import type { PaidBy } from '../../../shared/types';
import type { Route } from '../../lib/router';

export const WINDOWS: { value: SubscriptionWindow; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export type Params = {
  window: SubscriptionWindow;
  client: string;
  provider: string;
  paidBy: PaidBy | '';
};

export function readParams(route: Route): Params {
  const paidBy = PAID_BY_OPTIONS.find((o) => o.value === route.params.get('paidBy'))?.value ?? '';
  return {
    window: WINDOWS.find((w) => w.value === route.params.get('window'))?.value ?? 'all',
    client: route.params.get('client') ?? '',
    provider: route.params.get('provider') ?? '',
    paidBy,
  };
}
