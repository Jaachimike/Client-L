import { addMonths, daysBetween } from './dates';
import type { RenewalContext } from './contracts';
import type { PaidBy, Subscription, SubscriptionState } from './types';

export const PAID_BY_OPTIONS: { value: PaidBy; label: string }[] = [
  { value: 'Rebill', label: 'You, then rebill the client' },
  { value: 'Client card', label: "Client's own card" },
  { value: 'Contract', label: 'Included in a contract' },
];

export function subscriptionState(sub: Subscription, ctx: RenewalContext): SubscriptionState {
  if (sub.cancelled) return 'Cancelled';
  const days = daysBetween(ctx.today, sub.nextRenewal);
  if (days < 0) return 'Overdue';
  return days <= ctx.warningDays ? 'Renewing soon' : 'Active';
}

export type SubscriptionWindow = 'all' | '7' | '30' | '90' | 'overdue' | 'cancelled';

export interface SubscriptionFilters {
  window?: SubscriptionWindow;
  clientId?: string;
  provider?: string;
  paidBy?: PaidBy | '';
}

/** Renewal windows run from today to the boundary day inclusive; cancelled ones never match. */
export function inSubscriptionWindow(
  sub: Subscription,
  window: SubscriptionWindow,
  ctx: RenewalContext,
): boolean {
  const state = subscriptionState(sub, ctx);
  if (window === 'all') return true;
  if (window === 'cancelled') return state === 'Cancelled';
  if (state === 'Cancelled') return false;
  if (window === 'overdue') return state === 'Overdue';
  const days = daysBetween(ctx.today, sub.nextRenewal);
  return days >= 0 && days <= Number(window);
}

export function filterSubscriptions(
  subs: Subscription[],
  filters: SubscriptionFilters,
  ctx: RenewalContext,
): Subscription[] {
  return subs
    .filter(
      (s) =>
        inSubscriptionWindow(s, filters.window ?? 'all', ctx) &&
        (!filters.clientId || s.clientId === filters.clientId) &&
        (!filters.provider || s.provider === filters.provider) &&
        (!filters.paidBy || s.paidBy === filters.paidBy),
    )
    .sort((a, b) => {
      if (a.cancelled !== b.cancelled) return a.cancelled ? 1 : -1;
      return a.nextRenewal < b.nextRenewal ? -1 : a.nextRenewal > b.nextRenewal ? 1 : 0;
    });
}

/** One billing cycle later, keeping the original billing day (31 Jan → 28 Feb → 31 Mar). */
export function nextRenewalDate(
  sub: Pick<Subscription, 'nextRenewal' | 'billingCycle' | 'billingDay'>,
): string {
  const months = sub.billingCycle === 'Yearly' ? 12 : 1;
  const anchor = sub.billingDay > 0 ? sub.billingDay : Number(sub.nextRenewal.slice(8, 10));
  return addMonths(sub.nextRenewal, months, anchor);
}

export function needsCharging(sub: Subscription): boolean {
  return sub.paidBy === 'Rebill' && sub.rebillDue !== '' && !sub.cancelled;
}

export function renewalLabel(nextRenewal: string, today: string): string {
  const days = daysBetween(today, nextRenewal);
  if (days === 0) return 'Renews today';
  if (days === 1) return 'Renews tomorrow';
  if (days > 1) return `Renews in ${days} days`;
  return days === -1 ? '1 day overdue' : `${-days} days overdue`;
}
