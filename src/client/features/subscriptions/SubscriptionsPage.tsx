import { useMemo, useState } from 'react';
import { formatDisplayDate } from '../../../shared/dates';
import {
  filterSubscriptions,
  inSubscriptionWindow,
  PAID_BY_OPTIONS,
} from '../../../shared/subscriptions';
import type { Bootstrap } from '../../../shared/types';
import { PageHeader } from '../../components/PageHeader';
import { RenewalsSwitch } from '../../components/RenewalsSwitch';
import { FilterChip } from '../../components/ui/chip';
import {
  EmptyState,
  ErrorAlert,
  ErrorState,
  LoadingState,
  StatusBanner,
} from '../../components/ui/feedback';
import { Select } from '../../components/ui/form';
import { errorMessage } from '../../lib/api';
import { formatMoney } from '../../lib/money';
import { useClients } from '../../lib/queries';
import { useMarkCharged, useSubscriptions } from '../../lib/renewalQueries';
import { navigate, type Route } from '../../lib/router';
import { SubscriptionList } from './SubscriptionList';
import { readParams, subscriptionWindows, type Params } from './subscriptionFilters';
import { SubscriptionPanel, type SubscriptionPanelState } from './SubscriptionPanel';

export function SubscriptionsPage({ bootstrap, route }: { bootstrap: Bootstrap; route: Route }) {
  const subsQuery = useSubscriptions();
  const clientsQuery = useClients();
  const charge = useMarkCharged();
  const [panel, setPanel] = useState<SubscriptionPanelState>({ mode: 'closed' });
  const [banner, setBanner] = useState('');
  const ctx = useMemo(
    () => ({ today: bootstrap.today, warningDays: bootstrap.warningDays }),
    [bootstrap.today, bootstrap.warningDays],
  );
  const params = readParams(route);
  const setParams = (next: Partial<Params>) => {
    const merged = { ...params, ...next };
    navigate('/subscriptions', {
      ...merged,
      window: merged.window === 'all' ? undefined : merged.window,
    });
  };

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);
  const subs = useMemo(() => subsQuery.data ?? [], [subsQuery.data]);
  const providers = [...new Set(subs.map((s) => s.provider).filter(Boolean))].sort();
  const narrowed = filterSubscriptions(
    subs,
    { clientId: params.client, provider: params.provider, paidBy: params.paidBy },
    ctx,
  );
  const visible = narrowed.filter((s) => inSubscriptionWindow(s, params.window, ctx));
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? 'Unknown client';

  const header = (
    <PageHeader
      title="Subscriptions"
      actionLabel="New subscription"
      onAction={() => setPanel({ mode: 'new', clientId: params.client || undefined })}
    />
  );
  const select = (
    id: string,
    label: string,
    value: string,
    key: keyof Params,
    options: { value: string; label: string }[],
  ) => (
    <div className="min-w-0 flex-1 sm:w-48 sm:flex-none">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Select id={id} value={value} onChange={(e) => setParams({ [key]: e.target.value })}>
        <option value="">{`All ${label.toLowerCase()}`}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );

  let body;
  if (subsQuery.isPending || clientsQuery.isPending)
    body = <LoadingState label="Loading subscriptions…" />;
  else if (subsQuery.isError || clientsQuery.isError)
    body = (
      <ErrorState
        message={errorMessage(subsQuery.error ?? clientsQuery.error)}
        onRetry={() => void subsQuery.refetch()}
      />
    );
  else if (subs.length === 0)
    body = (
      <EmptyState title="No subscriptions yet">
        Track domains, hosting and licences you manage for clients with New subscription.
      </EmptyState>
    );
  else
    body = (
      <>
        <div className="mb-4 flex flex-col gap-3">
          <div role="group" aria-label="Renewing within" className="flex flex-wrap gap-2">
            {subscriptionWindows(bootstrap.warningDays).map((w) => (
              <FilterChip
                key={w.value}
                label={w.label}
                count={narrowed.filter((s) => inSubscriptionWindow(s, w.value, ctx)).length}
                selected={params.window === w.value}
                onSelect={() => setParams({ window: w.value })}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {select(
              'sub-client-filter',
              'Clients',
              params.client,
              'client',
              clients.map((c) => ({ value: c.id, label: c.name })),
            )}
            {select(
              'sub-provider-filter',
              'Providers',
              params.provider,
              'provider',
              providers.map((p) => ({ value: p, label: p })),
            )}
            {select('sub-paid-filter', 'Payers', params.paidBy, 'paidBy', PAID_BY_OPTIONS)}
          </div>
        </div>
        {visible.length === 0 ? (
          <EmptyState title="No subscriptions in this view">
            Try a longer window or clear a filter.
          </EmptyState>
        ) : (
          <SubscriptionList
            subscriptions={visible}
            clientName={clientName}
            ctx={ctx}
            onOpen={(s) => setPanel({ mode: 'edit', subscription: s })}
            onMarkRenewed={(s) => setPanel({ mode: 'renew', subscription: s })}
            onMarkCharged={(s) =>
              charge.mutate(s.id, {
                onSuccess: (c) =>
                  setBanner(`${c.service} for ${clientName(c.clientId)} marked as charged.`),
              })
            }
          />
        )}
      </>
    );

  return (
    <>
      <RenewalsSwitch current="/subscriptions" />
      {header}
      <div className="mb-4 flex flex-col gap-3 empty:hidden">
        {banner && <StatusBanner onDismiss={() => setBanner('')}>{banner}</StatusBanner>}
        {charge.isError && <ErrorAlert>{errorMessage(charge.error)}</ErrorAlert>}
      </div>
      {body}
      <SubscriptionPanel
        state={panel}
        onClose={() => setPanel({ mode: 'closed' })}
        bootstrap={bootstrap}
        clients={clients}
        clientName={clientName}
        onSaved={(message) => {
          setPanel({ mode: 'closed' });
          setBanner(message);
        }}
        renewedMessage={(sub, transaction) =>
          `${sub.service} renewed. Next renewal ${formatDisplayDate(sub.nextRenewal)}.` +
          (transaction
            ? ` ${formatMoney(transaction.amount, transaction.currency)} logged as an outflow.`
            : '') +
          (sub.paidBy === 'Rebill' ? ' Remember to charge the client.' : '')
        }
      />
    </>
  );
}
