import type { ReactNode } from 'react';
import { contractState, daysLeftLabel, type RenewalContext } from '../../../shared/contracts';
import { needsCharging, renewalLabel, subscriptionState } from '../../../shared/subscriptions';
import { StateBadge, Tag } from '../../components/ui/state-badge';
import { formatMoney } from '../../lib/money';
import { useContracts, useSubscriptions } from '../../lib/renewalQueries';
import { buildHref } from '../../lib/router';

function Section({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs tracking-[0.04em] text-text-muted uppercase">{title}</h3>
        <a href={href} className="text-[13px] text-accent hover:underline">
          Open in {title}
        </a>
      </div>
      {children}
    </section>
  );
}

function Rows({ children, empty }: { children: ReactNode[]; empty: string }) {
  if (children.length === 0) return <p className="text-text-subtle">{empty}</p>;
  return <ul className="divide-y divide-border rounded-lg border border-border">{children}</ul>;
}

/** Every contract (including renewed ones, as history) and subscription for one client. */
export function ClientRenewals({ clientId, ctx }: { clientId: string; ctx: RenewalContext }) {
  const contracts = (useContracts().data ?? [])
    .filter((c) => c.clientId === clientId)
    .sort((a, b) => (a.endDate < b.endDate ? 1 : -1));
  const subs = (useSubscriptions().data ?? [])
    .filter((s) => s.clientId === clientId)
    .sort((a, b) => (a.nextRenewal < b.nextRenewal ? -1 : 1));

  return (
    <>
      <Section title="Contracts" href={buildHref('/contracts', { client: clientId })}>
        <Rows empty="No contracts for this client.">
          {contracts.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span>
                <span className="block font-medium">{c.name}</span>
                <span className="text-xs text-text-muted">
                  {contractState(c, ctx) === 'Renewed'
                    ? 'Replaced by a newer contract'
                    : daysLeftLabel(c.endDate, ctx.today)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[13px]">{formatMoney(c.fee, c.currency)}</span>
                <StateBadge state={contractState(c, ctx)} />
              </span>
            </li>
          ))}
        </Rows>
      </Section>
      <Section title="Subscriptions" href={buildHref('/subscriptions', { client: clientId })}>
        <Rows empty="No subscriptions for this client.">
          {subs.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span>
                <span className="block font-medium">
                  {s.service}{' '}
                  {s.provider && (
                    <span className="font-normal text-text-muted">· {s.provider}</span>
                  )}
                </span>
                <span className="text-xs text-text-muted">
                  {s.cancelled ? 'Cancelled' : renewalLabel(s.nextRenewal, ctx.today)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                {needsCharging(s) && <Tag>Charge client</Tag>}
                <StateBadge state={subscriptionState(s, ctx)} />
              </span>
            </li>
          ))}
        </Rows>
      </Section>
    </>
  );
}
