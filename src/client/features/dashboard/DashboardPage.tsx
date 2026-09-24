import { useMemo } from 'react';
import { filterTransactions, monthLabel, monthOf, totalsFor } from '../../../shared/cashflow';
import { summariseDashboard } from '../../../shared/dashboard';
import type { Bootstrap } from '../../../shared/types';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/feedback';
import { errorMessage } from '../../lib/api';
import { useTransactions } from '../../lib/cashQueries';
import { formatMoney } from '../../lib/money';
import { useClients, useTasks } from '../../lib/queries';
import { useContracts, useSubscriptions } from '../../lib/renewalQueries';
import { buildHref } from '../../lib/router';
import { useTaskContext } from '../../lib/useTaskContext';
import { CountCard, ItemList } from './DashboardLists';

function MonthCash({ bootstrap }: { bootstrap: Bootstrap }) {
  const txs = useTransactions().data ?? [];
  const month = monthOf(bootstrap.today);
  const currency = bootstrap.defaultCurrency;
  const totals = totalsFor(filterTransactions(txs, { period: { kind: 'month', month } }), currency);
  const rows = [
    { label: 'Inflow', value: formatMoney(totals.inflow, currency), tone: 'text-success' },
    { label: 'Outflow', value: formatMoney(totals.outflow, currency), tone: 'text-outflow-text' },
    {
      label: 'Net',
      value: `${totals.net < 0 ? '−' : ''}${formatMoney(Math.abs(totals.net), currency)}`,
      tone: totals.net < 0 ? 'text-danger' : 'text-text',
    },
  ];
  return (
    <section
      aria-labelledby="month-cash-heading"
      className="flex flex-col rounded-xl border border-border bg-surface"
    >
      <h2 id="month-cash-heading" className="border-b border-border px-5 py-4 font-medium">
        {monthLabel(month)} cash flow
      </h2>
      <dl className="flex flex-col gap-3 px-5 py-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-[13px] text-text-muted">{r.label}</dt>
            <dd className={`font-mono text-lg ${r.tone}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
      <a
        href={buildHref('/cashflow', { period: month })}
        className="mt-auto border-t border-border px-5 py-3 text-[13px] text-accent hover:underline"
      >
        Open Cash flow
      </a>
    </section>
  );
}

export function DashboardPage({ bootstrap }: { bootstrap: Bootstrap }) {
  const tasks = useTasks();
  const contracts = useContracts();
  const subs = useSubscriptions();
  const clients = useClients();
  const txs = useTransactions();
  const taskCtx = useTaskContext(bootstrap);
  const queries = [tasks, contracts, subs, clients, txs];
  const summary = useMemo(
    () =>
      summariseDashboard({
        tasks: tasks.data ?? [],
        contracts: contracts.data ?? [],
        subscriptions: subs.data ?? [],
        taskCtx,
        renewalCtx: { today: bootstrap.today, warningDays: bootstrap.warningDays },
      }),
    [tasks.data, contracts.data, subs.data, taskCtx, bootstrap.today, bootstrap.warningDays],
  );
  const clientName = (id: string) => clients.data?.find((c) => c.id === id)?.name ?? 'No client';
  const header = <PageHeader title="Dashboard" />;

  if (queries.some((q) => q.isPending))
    return (
      <>
        {header}
        <LoadingState label="Loading your dashboard…" />
      </>
    );
  const failed = queries.find((q) => q.isError);
  if (failed)
    return (
      <>
        {header}
        <ErrorState
          message={errorMessage(failed.error)}
          onRetry={() => queries.forEach((q) => void q.refetch())}
        />
      </>
    );

  const isEmpty = queries.every((q) => (q.data ?? []).length === 0);
  if (isEmpty) {
    return (
      <>
        {header}
        <EmptyState
          title="Welcome. Nothing to show yet"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <a href={buildHref('/clients', { new: '1' })}>Add your first client</a>
              </Button>
              <Button asChild variant="secondary">
                <a href={buildHref('/settings')}>Try sample data</a>
              </Button>
            </div>
          }
        >
          Add a client and their tasks, or load sample data from Settings to see how everything fits
          together.
        </EmptyState>
      </>
    );
  }

  const { counts, window } = summary;
  return (
    <>
      {header}
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CountCard
            label="Overdue tasks"
            count={counts.overdueTasks}
            tone="danger"
            href={buildHref('/tasks', { due: 'overdue' })}
          />
          <CountCard
            label="Tasks due in the next 7 days"
            count={counts.dueThisWeek}
            tone="warning"
            href={buildHref('/tasks', { due: 'week' })}
          />
          <CountCard
            label={`Contracts ending within ${window} days`}
            count={counts.contractsExpiring}
            tone="warning"
            href={buildHref('/contracts', { window })}
          />
          <CountCard
            label={`Subscriptions renewing within ${window} days`}
            count={counts.subscriptionsRenewing}
            tone="warning"
            href={buildHref('/subscriptions', { window })}
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <ItemList
            title="Needs attention"
            items={summary.attention}
            empty="Nothing is overdue. Nice work."
            clientName={clientName}
          />
          <MonthCash bootstrap={bootstrap} />
        </div>
        <ItemList
          title="Coming up"
          items={summary.comingUp}
          empty={`Nothing due or renewing in the next ${window} days.`}
          clientName={clientName}
        />
      </div>
    </>
  );
}
