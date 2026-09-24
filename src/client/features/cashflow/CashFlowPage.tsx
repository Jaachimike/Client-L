import { Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  currenciesIn,
  filterTransactions,
  monthLabel,
  monthOf,
  sixMonthSeries,
  sortNewestFirst,
  totalsFor,
} from '../../../shared/cashflow';
import type { Bootstrap } from '../../../shared/types';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState, ErrorState, LoadingState, StatusBanner } from '../../components/ui/feedback';
import { errorMessage } from '../../lib/api';
import { useTransactions } from '../../lib/cashQueries';
import { useClients } from '../../lib/queries';
import { useContracts } from '../../lib/renewalQueries';
import { navigate, type Route } from '../../lib/router';
import { CashFlowChart } from './CashFlowChart';
import { CashFlowPanel, type CashPanelState } from './CashFlowPanel';
import {
  monthOptions,
  periodParam,
  readCashParams,
  toFilters,
  type CashParams,
} from './cashFilters';
import { EntryFilters } from './EntryFilters';
import { EntryList } from './EntryList';
import { PeriodBar } from './PeriodBar';
import { TotalsCards } from './TotalsCards';

export function CashFlowPage({ bootstrap, route }: { bootstrap: Bootstrap; route: Route }) {
  const txQuery = useTransactions();
  const clientsQuery = useClients();
  const contracts = useContracts().data ?? [];
  const [panel, setPanel] = useState<CashPanelState>({ mode: 'closed' });
  const [banner, setBanner] = useState('');
  const params = readCashParams(route, bootstrap.today, bootstrap.defaultCurrency);
  const setParams = (next: Partial<CashParams>) => {
    const m = { ...params, ...next };
    navigate('/cashflow', {
      period: periodParam(m.period),
      currency: m.currency,
      type: m.view || undefined,
      client: m.client,
      category: m.category,
    });
  };

  const txs = useMemo(() => txQuery.data ?? [], [txQuery.data]);
  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? 'Unknown client';
  const inView = filterTransactions(txs, toFilters(params, false));
  const currencies = [...new Set([bootstrap.defaultCurrency, ...currenciesIn(txs)])];
  const shown = sortNewestFirst(
    filterTransactions(txs, toFilters(params, params.view !== 'voided')),
  );
  const totals = totalsFor(inView, params.currency);
  const otherCurrencies = currenciesIn(inView).filter((c) => c !== params.currency);
  const chartMonth =
    params.period.kind === 'month' ? params.period.month : monthOf(bootstrap.today);
  const chartTxs = filterTransactions(txs, {
    ...toFilters({ ...params, view: '' }, true),
    period: { kind: 'all' },
  });
  const categories = [
    ...new Set([...bootstrap.categories, ...txs.map((t) => t.category).filter(Boolean)]),
  ].sort();
  const periodLabel =
    params.period.kind === 'month'
      ? monthLabel(params.period.month)
      : params.period.kind === 'all'
        ? 'all time'
        : 'entries with no date';

  const header = (
    <PageHeader
      title="Cash flow"
      actionLabel="Add entry"
      onAction={() => setPanel({ mode: 'new' })}
    >
      <Button variant="secondary" onClick={() => setPanel({ mode: 'import' })}>
        <Upload aria-hidden size={18} strokeWidth={1.8} /> Import CSV
      </Button>
    </PageHeader>
  );

  let body;
  if (txQuery.isPending || clientsQuery.isPending)
    body = <LoadingState label="Loading cash flow…" />;
  else if (txQuery.isError || clientsQuery.isError)
    body = (
      <ErrorState
        message={errorMessage(txQuery.error ?? clientsQuery.error)}
        onRetry={() => void txQuery.refetch()}
      />
    );
  else if (txs.length === 0)
    body = (
      <EmptyState title="No money in or out yet">
        Add an entry, or bring in your existing sheet with Import CSV.
      </EmptyState>
    );
  else
    body = (
      <div className="flex flex-col gap-5">
        <PeriodBar
          period={params.period}
          months={monthOptions(txs, bootstrap.today)}
          currency={params.currency}
          currencies={currencies}
          onPeriod={(period) => setParams({ period })}
          onCurrency={(currency) => setParams({ currency })}
        />
        <TotalsCards
          totals={totals}
          currency={params.currency}
          periodLabel={periodLabel}
          otherCurrencies={otherCurrencies}
        />
        <CashFlowChart
          series={sixMonthSeries(chartTxs, params.currency, chartMonth)}
          currency={params.currency}
          selectedMonth={params.period.kind === 'month' ? chartMonth : ''}
          onSelectMonth={(month) => setParams({ period: { kind: 'month', month } })}
        />
        <EntryFilters
          params={params}
          clients={clients}
          categories={categories}
          onChange={setParams}
        />
        {shown.length === 0 ? (
          <EmptyState title="No entries in this view">
            Try another month, currency or filter.
          </EmptyState>
        ) : (
          <EntryList
            entries={shown}
            clientName={clientName}
            onOpen={(entry) => setPanel({ mode: 'edit', entry })}
          />
        )}
      </div>
    );

  return (
    <>
      {header}
      {banner && (
        <div className="mb-4">
          <StatusBanner onDismiss={() => setBanner('')}>{banner}</StatusBanner>
        </div>
      )}
      {body}
      <CashFlowPanel
        state={panel}
        onClose={() => setPanel({ mode: 'closed' })}
        bootstrap={bootstrap}
        clients={clients}
        contracts={contracts}
        transactions={txs}
        onDone={(message) => {
          setPanel({ mode: 'closed' });
          setBanner(message);
        }}
      />
    </>
  );
}
