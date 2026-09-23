import { useMemo, useState } from 'react';
import { filterContracts, inContractWindow, type ContractWindow } from '../../../shared/contracts';
import { formatDisplayDate } from '../../../shared/dates';
import type { Bootstrap, Contract } from '../../../shared/types';
import { PageHeader } from '../../components/PageHeader';
import { RenewalsSwitch } from '../../components/RenewalsSwitch';
import { FilterChip } from '../../components/ui/chip';
import { EmptyState, ErrorState, LoadingState, StatusBanner } from '../../components/ui/feedback';
import { Select } from '../../components/ui/form';
import { SidePanel } from '../../components/ui/side-panel';
import { errorMessage } from '../../lib/api';
import { useClients } from '../../lib/queries';
import { useContracts } from '../../lib/renewalQueries';
import { navigate, type Route } from '../../lib/router';
import { ContractForm, type ContractFormMode } from './ContractForm';
import { ContractList } from './ContractList';

const WINDOWS: { value: ContractWindow; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: 'expired', label: 'Expired' },
];

function windowFrom(value: string | null): ContractWindow {
  return WINDOWS.find((w) => w.value === value)?.value ?? 'all';
}

const PANEL_TITLES = { new: 'New contract', edit: 'Edit contract', renew: 'Renew contract' };

export function ContractsPage({ bootstrap, route }: { bootstrap: Bootstrap; route: Route }) {
  const contractsQuery = useContracts();
  const clientsQuery = useClients();
  const [panel, setPanel] = useState<ContractFormMode | null>(null);
  const [banner, setBanner] = useState('');
  const ctx = useMemo(
    () => ({ today: bootstrap.today, warningDays: bootstrap.warningDays }),
    [bootstrap.today, bootstrap.warningDays],
  );
  const range = windowFrom(route.params.get('window'));
  const clientId = route.params.get('client') ?? '';
  const setFilters = (next: { range?: ContractWindow; client?: string }) =>
    navigate('/contracts', {
      window: (next.range ?? range) === 'all' ? undefined : (next.range ?? range),
      client: next.client ?? clientId,
    });

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);
  const contracts = useMemo(() => contractsQuery.data ?? [], [contractsQuery.data]);
  const byClient = contracts.filter((c) => !clientId || c.clientId === clientId);
  const visible = filterContracts(byClient, { window: range }, ctx);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? 'Unknown client';

  const onSaved = (contract: Contract) => {
    const kind = panel?.kind;
    setPanel(null);
    setBanner(
      kind === 'renew'
        ? `Renewed. “${contract.name}” now runs to ${formatDisplayDate(contract.endDate)}, and the old contract is marked Renewed.`
        : kind === 'edit'
          ? `“${contract.name}” saved.`
          : `“${contract.name}” added.`,
    );
  };

  const header = (
    <PageHeader
      title="Contracts"
      actionLabel="New contract"
      onAction={() => setPanel({ kind: 'new', clientId: clientId || undefined })}
    />
  );

  let body;
  if (contractsQuery.isPending || clientsQuery.isPending)
    body = <LoadingState label="Loading contracts…" />;
  else if (contractsQuery.isError || clientsQuery.isError)
    body = (
      <ErrorState
        message={errorMessage(contractsQuery.error ?? clientsQuery.error)}
        onRetry={() => void contractsQuery.refetch()}
      />
    );
  else if (contracts.length === 0)
    body = (
      <EmptyState title="No contracts yet">
        Add a retainer or maintenance agreement with New contract to track when it ends.
      </EmptyState>
    );
  else
    body = (
      <>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Ending within" className="flex flex-wrap gap-2">
            {WINDOWS.map((w) => (
              <FilterChip
                key={w.value}
                label={w.label}
                count={byClient.filter((c) => inContractWindow(c, w.value, ctx)).length}
                selected={range === w.value}
                onSelect={() => setFilters({ range: w.value })}
              />
            ))}
          </div>
          <div className="sm:w-56">
            <label htmlFor="contract-client-filter" className="sr-only">
              Client
            </label>
            <Select
              id="contract-client-filter"
              value={clientId}
              onChange={(e) => setFilters({ client: e.target.value })}
            >
              <option value="">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {visible.length === 0 ? (
          <EmptyState title="No contracts in this view">
            Try a longer window or another client.
          </EmptyState>
        ) : (
          <ContractList
            contracts={visible}
            clientName={clientName}
            ctx={ctx}
            onOpen={(c) => setPanel({ kind: 'edit', contract: c })}
            onRenew={(c) => setPanel({ kind: 'renew', contract: c })}
          />
        )}
      </>
    );

  return (
    <>
      <RenewalsSwitch current="/contracts" />
      {header}
      {banner && (
        <div className="mb-4">
          <StatusBanner onDismiss={() => setBanner('')}>{banner}</StatusBanner>
        </div>
      )}
      {body}
      <SidePanel
        open={panel !== null}
        onOpenChange={(open) => !open && setPanel(null)}
        title={panel ? PANEL_TITLES[panel.kind] : ''}
      >
        {panel && (
          <ContractForm
            key={panel.kind === 'new' ? 'new' : `${panel.kind}-${panel.contract.id}`}
            mode={panel}
            clients={clients}
            currencies={bootstrap.currencies}
            defaultCurrency={bootstrap.defaultCurrency}
            onSaved={onSaved}
            onCancel={() => setPanel(null)}
          />
        )}
      </SidePanel>
    </>
  );
}
