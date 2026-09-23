import { useMemo, useState } from 'react';
import { isDone } from '../../../shared/tasks';
import type { Bootstrap, Client } from '../../../shared/types';
import { PageHeader } from '../../components/PageHeader';
import {
  EmptyState,
  ErrorAlert,
  ErrorState,
  LoadingState,
  StatusBanner,
} from '../../components/ui/feedback';
import { SidePanel } from '../../components/ui/side-panel';
import { errorMessage } from '../../lib/api';
import { cn } from '../../lib/cn';
import { useClients, useSetClientArchived, useTasks } from '../../lib/queries';
import { navigate, type Route } from '../../lib/router';
import { useTaskContext } from '../../lib/useTaskContext';
import { TaskPanel, type TaskPanelState } from '../tasks/TaskPanel';
import { useStatusChange } from '../tasks/useStatusChange';
import { ClientDetails } from './ClientDetails';
import { ClientForm } from './ClientForm';
import { ClientList } from './ClientList';

type ClientPanel = { mode: 'closed' } | { mode: 'new' } | { mode: 'edit'; client: Client };

export function ClientsPage({ bootstrap, route }: { bootstrap: Bootstrap; route: Route }) {
  const clientsQuery = useClients();
  const tasksQuery = useTasks();
  const archive = useSetClientArchived();
  const statusChange = useStatusChange();
  const ctx = useTaskContext(bootstrap);
  const [clientPanel, setClientPanel] = useState<ClientPanel>(() =>
    route.params.get('new') ? { mode: 'new' } : { mode: 'closed' },
  );
  const [taskPanel, setTaskPanel] = useState<TaskPanelState>({ mode: 'closed' });
  const [banner, setBanner] = useState('');

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const selectedId = route.segments[1] ?? '';
  const selected = clients.find((c) => c.id === selectedId);
  const openCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks)
      if (!isDone(task, ctx)) counts.set(task.clientId, (counts.get(task.clientId) ?? 0) + 1);
    return counts;
  }, [tasks, ctx]);

  const header = (
    <PageHeader
      title="Clients"
      actionLabel="Add client"
      onAction={() => setClientPanel({ mode: 'new' })}
    />
  );
  const closeClientPanel = () => setClientPanel({ mode: 'closed' });

  const toggleArchived = (client: Client) => {
    archive.mutate(
      { id: client.id, archived: !client.archived },
      {
        onSuccess: (c) =>
          setBanner(
            c.archived ? `${c.name} archived. Their tasks are kept.` : `${c.name} is active again.`,
          ),
      },
    );
  };

  const panels = (
    <>
      <SidePanel
        open={clientPanel.mode !== 'closed'}
        onOpenChange={(open) => !open && closeClientPanel()}
        title={clientPanel.mode === 'edit' ? 'Edit client' : 'Add client'}
      >
        {clientPanel.mode !== 'closed' && (
          <ClientForm
            client={clientPanel.mode === 'edit' ? clientPanel.client : undefined}
            onCancel={closeClientPanel}
            onSaved={(client) => {
              closeClientPanel();
              setBanner(
                clientPanel.mode === 'edit' ? `${client.name} saved.` : `${client.name} added.`,
              );
              navigate(`/clients/${client.id}`);
            }}
          />
        )}
      </SidePanel>
      <TaskPanel
        state={taskPanel}
        onStateChange={setTaskPanel}
        tasks={tasks}
        clients={clients}
        statuses={bootstrap.statuses}
        ctx={ctx}
        onStatusChange={statusChange.change}
        onSaved={(task, isNew) =>
          setBanner(isNew ? `Task “${task.title}” added.` : `Task “${task.title}” saved.`)
        }
      />
    </>
  );

  if (clientsQuery.isPending || tasksQuery.isPending) {
    return (
      <>
        {header}
        <LoadingState label="Loading clients…" />
        {panels}
      </>
    );
  }
  if (clientsQuery.isError || tasksQuery.isError) {
    return (
      <>
        {header}
        <ErrorState
          message={errorMessage(clientsQuery.error ?? tasksQuery.error)}
          onRetry={() => void clientsQuery.refetch()}
        />
      </>
    );
  }

  const failure = archive.isError ? errorMessage(archive.error) : statusChange.error;

  return (
    <>
      {header}
      <div className="mb-4 flex flex-col gap-3 empty:hidden">
        {banner && <StatusBanner onDismiss={() => setBanner('')}>{banner}</StatusBanner>}
        {failure && <ErrorAlert>{failure}</ErrorAlert>}
      </div>
      {clients.length === 0 ? (
        <EmptyState title="No clients yet">
          Add your first client with Add client, then give them tasks.
        </EmptyState>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className={cn(selected && 'hidden lg:block')}>
            <ClientList clients={clients} selectedId={selectedId} openCounts={openCounts} />
          </div>
          <div className={cn(!selected && 'hidden lg:block')}>
            {selected ? (
              <ClientDetails
                client={selected}
                tasks={tasks}
                statuses={bootstrap.statuses}
                ctx={ctx}
                onEdit={() => setClientPanel({ mode: 'edit', client: selected })}
                onToggleArchived={() => toggleArchived(selected)}
                onAddTask={() => setTaskPanel({ mode: 'new', clientId: selected.id })}
                onOpenTask={(task) => setTaskPanel({ mode: 'view', taskId: task.id })}
                onStatusChange={statusChange.change}
              />
            ) : (
              <EmptyState title={selectedId ? 'Client not found' : 'Choose a client'}>
                {selectedId
                  ? 'It may have been removed from the sheet.'
                  : 'Select a client on the left to see their details and tasks.'}
              </EmptyState>
            )}
          </div>
        </div>
      )}
      {panels}
    </>
  );
}
