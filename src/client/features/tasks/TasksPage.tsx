import { useDeferredValue, useMemo, useState } from 'react';
import {
  countByStatus,
  filterTasks,
  filterTasksExceptStatus,
  sortTasks,
} from '../../../shared/tasks';
import type { Bootstrap, DueFilter, TaskFilters } from '../../../shared/types';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/button';
import {
  EmptyState,
  ErrorAlert,
  ErrorState,
  LoadingState,
  StatusBanner,
} from '../../components/ui/feedback';
import { errorMessage } from '../../lib/api';
import { useClients, useTasks } from '../../lib/queries';
import { buildHref, navigate, type Route } from '../../lib/router';
import { useTaskContext } from '../../lib/useTaskContext';
import { TaskFiltersBar, type TaskFilterState } from './TaskFiltersBar';
import { TaskList } from './TaskList';
import { TaskPanel, type TaskPanelState } from './TaskPanel';
import { useStatusChange } from './useStatusChange';

const DUE_VALUES: DueFilter[] = ['any', 'overdue', 'week', 'none'];

function dueFromParam(value: string | null): DueFilter {
  return DUE_VALUES.find((d) => d === value) ?? 'any';
}

export function TasksPage({ bootstrap, route }: { bootstrap: Bootstrap; route: Route }) {
  const clientsQuery = useClients();
  const tasksQuery = useTasks();
  const ctx = useTaskContext(bootstrap);
  const statusChange = useStatusChange();
  const [panel, setPanel] = useState<TaskPanelState>({ mode: 'closed' });
  const [banner, setBanner] = useState('');
  const [search, setSearch] = useState(route.params.get('q') ?? '');
  const deferredSearch = useDeferredValue(search);

  const filters: TaskFilterState = {
    clientId: route.params.get('client') ?? '',
    status: route.params.get('status') ?? '',
    due: dueFromParam(route.params.get('due')),
    search,
  };

  const updateFilters = (next: Partial<TaskFilterState>) => {
    if (next.search !== undefined) setSearch(next.search);
    const merged = { ...filters, ...next };
    if (next.clientId !== undefined || next.status !== undefined || next.due !== undefined) {
      navigate('/tasks', {
        client: merged.clientId,
        status: merged.status,
        due: merged.due === 'any' ? undefined : merged.due,
      });
    }
  };

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);
  const active: TaskFilters = {
    clientId: filters.clientId,
    status: filters.status,
    due: filters.due,
    search: deferredSearch,
  };
  const withoutStatus = filterTasksExceptStatus(tasks, active, ctx);
  const visible = sortTasks(filterTasks(tasks, active, ctx), ctx);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? 'Unknown client';
  const hasFilters = Boolean(filters.clientId || filters.status || filters.due !== 'any' || search);
  const activeClients = clients.filter((c) => !c.archived);

  const header = (
    <PageHeader
      title="Tasks"
      actionLabel="New task"
      onAction={() => setPanel({ mode: 'new', clientId: filters.clientId || undefined })}
    />
  );

  if (tasksQuery.isPending || clientsQuery.isPending) {
    return (
      <>
        {header}
        <LoadingState label="Loading tasks…" />
      </>
    );
  }
  if (tasksQuery.isError || clientsQuery.isError) {
    return (
      <>
        {header}
        <ErrorState
          message={errorMessage(tasksQuery.error ?? clientsQuery.error)}
          onRetry={() => {
            void tasksQuery.refetch();
            void clientsQuery.refetch();
          }}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <div className="mb-4 flex flex-col gap-3 empty:hidden">
        {banner && <StatusBanner onDismiss={() => setBanner('')}>{banner}</StatusBanner>}
        {statusChange.error && <ErrorAlert>{statusChange.error}</ErrorAlert>}
      </div>
      {activeClients.length === 0 && tasks.length === 0 ? (
        <EmptyState
          title="Add a client first"
          action={
            <Button asChild>
              <a href={buildHref('/clients', { new: '1' })}>Add client</a>
            </Button>
          }
        >
          Every task belongs to a client, so start by adding one.
        </EmptyState>
      ) : tasks.length === 0 ? (
        <EmptyState title="No tasks yet">
          Add your first task with New task and it will show up here.
        </EmptyState>
      ) : (
        <>
          <TaskFiltersBar
            filters={filters}
            clients={clients}
            statuses={bootstrap.statuses}
            statusCounts={countByStatus(withoutStatus)}
            total={withoutStatus.length}
            onChange={updateFilters}
          />
          {visible.length === 0 ? (
            <EmptyState
              title="No tasks match these filters"
              action={
                hasFilters && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      updateFilters({ clientId: '', status: '', due: 'any', search: '' })
                    }
                  >
                    Clear filters
                  </Button>
                )
              }
            >
              Try another client, status or search.
            </EmptyState>
          ) : (
            <TaskList
              tasks={visible}
              clientName={clientName}
              statuses={bootstrap.statuses}
              ctx={ctx}
              onOpen={(task) => setPanel({ mode: 'view', taskId: task.id })}
              onStatusChange={statusChange.change}
            />
          )}
        </>
      )}
      <TaskPanel
        state={panel}
        onStateChange={setPanel}
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
}
