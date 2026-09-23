import type { RenewalContext } from '../../../shared/contracts';
import { formatDisplayDate } from '../../../shared/dates';
import { PAID_BY_OPTIONS, renewalLabel, subscriptionState } from '../../../shared/subscriptions';
import type { Subscription } from '../../../shared/types';
import { StateBadge } from '../../components/ui/state-badge';
import { cn } from '../../lib/cn';
import { formatMoney } from '../../lib/money';
import { Actions, Title } from './SubscriptionRowParts';

export interface SubscriptionActions {
  onOpen: (sub: Subscription) => void;
  onMarkRenewed: (sub: Subscription) => void;
  onMarkCharged: (sub: Subscription) => void;
}

interface SubscriptionListProps extends SubscriptionActions {
  subscriptions: Subscription[];
  clientName: (id: string) => string;
  ctx: RenewalContext;
}

const PAID_BY_SHORT = {
  Rebill: 'You (rebill)',
  'Client card': 'Client card',
  Contract: 'In contract',
};

function renewalNote(sub: Subscription, ctx: RenewalContext): string {
  const state = subscriptionState(sub, ctx);
  if (state === 'Cancelled') return 'Cancelled';
  if (state === 'Overdue' && sub.autoRenew) return 'Auto-renew: confirm payment';
  return renewalLabel(sub.nextRenewal, ctx.today);
}

function Renewal({ sub, ctx }: { sub: Subscription; ctx: RenewalContext }) {
  const state = subscriptionState(sub, ctx);
  const tone =
    state === 'Overdue'
      ? 'text-danger'
      : state === 'Renewing soon'
        ? 'text-warning'
        : 'text-text-muted';
  return (
    <span className="inline-flex flex-col">
      <span className="font-mono text-[13px]">{formatDisplayDate(sub.nextRenewal)}</span>
      <span className={cn('text-xs', tone)}>{renewalNote(sub, ctx)}</span>
    </span>
  );
}

export function SubscriptionList({
  subscriptions,
  clientName,
  ctx,
  ...actions
}: SubscriptionListProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface sm:block">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-surface-muted text-xs tracking-[0.04em] text-text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Service and client
              </th>
              <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">
                Provider
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Cost
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Next renewal
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Paid by
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                State
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-t border-border align-middle">
                <td className="px-4 py-3">
                  <Title sub={sub} clientName={clientName(sub.clientId)} onOpen={actions.onOpen} />
                </td>
                <td className="hidden px-4 py-3 text-text-muted lg:table-cell">
                  {sub.provider || '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                  {formatMoney(sub.cost, sub.currency)}
                  <span className="block text-xs text-text-muted">{sub.billingCycle}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Renewal sub={sub} ctx={ctx} />
                </td>
                <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                  {PAID_BY_SHORT[sub.paidBy]}
                </td>
                <td className="px-4 py-3">
                  <StateBadge state={subscriptionState(sub, ctx)} />
                </td>
                <td className="px-4 py-2">
                  <Actions sub={sub} ctx={ctx} {...actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 sm:hidden" aria-label="Subscriptions">
        {subscriptions.map((sub) => (
          <li
            key={sub.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <Title sub={sub} clientName={clientName(sub.clientId)} onOpen={actions.onOpen} />
              <StateBadge state={subscriptionState(sub, ctx)} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Renewal sub={sub} ctx={ctx} />
              <span className="font-mono">{formatMoney(sub.cost, sub.currency)}</span>
            </div>
            <p className="text-xs text-text-muted">
              {PAID_BY_OPTIONS.find((o) => o.value === sub.paidBy)?.label}
            </p>
            <Actions sub={sub} ctx={ctx} {...actions} />
          </li>
        ))}
      </ul>
    </>
  );
}
