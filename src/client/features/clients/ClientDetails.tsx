import { Archive, ArchiveRestore, ArrowLeft, Pencil, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { sortTasks, type TaskContext } from '../../../shared/tasks';
import type { Client, Status, Task } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/feedback';
import { buildHref } from '../../lib/router';
import { TaskList } from '../tasks/TaskList';

interface ClientDetailsProps {
  client: Client;
  tasks: Task[];
  statuses: Status[];
  ctx: TaskContext;
  onEdit: () => void;
  onToggleArchived: () => void;
  onAddTask: () => void;
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: string) => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs tracking-[0.04em] text-text-muted uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className="break-words">{value || <span className="text-text-subtle">Not set</span>}</dd>
    </div>
  );
}

export function ClientDetails(props: ClientDetailsProps) {
  const { client, tasks, statuses, ctx } = props;
  const clientTasks = sortTasks(
    tasks.filter((t) => t.clientId === client.id),
    ctx,
  );
  return (
    <article className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <a
        href={buildHref('/clients')}
        className="inline-flex items-center gap-1 text-[13px] text-text-muted lg:hidden"
      >
        <ArrowLeft aria-hidden size={16} strokeWidth={1.8} /> All clients
      </a>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold">{client.name}</h2>
          {client.archived && (
            <p className="mt-1 text-[13px] text-text-muted">
              Archived. Hidden from client lists in forms.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="dense"
            onClick={props.onAddTask}
            disabled={client.archived}
          >
            <Plus aria-hidden size={16} strokeWidth={2} /> Task for this client
          </Button>
          <Button variant="secondary" size="dense" onClick={props.onEdit}>
            <Pencil aria-hidden size={16} strokeWidth={1.8} /> Edit
          </Button>
          <Button variant="secondary" size="dense" onClick={props.onToggleArchived}>
            {client.archived ? (
              <ArchiveRestore aria-hidden size={16} strokeWidth={1.8} />
            ) : (
              <Archive aria-hidden size={16} strokeWidth={1.8} />
            )}
            {client.archived ? 'Unarchive' : 'Archive'}
          </Button>
        </div>
      </header>
      <Section title="Contact">
        <dl className="grid gap-3 sm:grid-cols-3">
          <Detail label="Contact person" value={client.contactPerson} />
          <Detail label="Email" value={client.email} />
          <Detail label="Phone" value={client.phone} />
        </dl>
      </Section>
      <Section title={`Tasks (${clientTasks.length})`}>
        {clientTasks.length === 0 ? (
          <EmptyState title="No tasks for this client">
            Use Task for this client to add one.
          </EmptyState>
        ) : (
          <TaskList
            tasks={clientTasks}
            clientName={() => client.name}
            statuses={statuses}
            ctx={ctx}
            onOpen={props.onOpenTask}
            onStatusChange={props.onStatusChange}
            showClient={false}
          />
        )}
      </Section>
      <Section title="Contracts">
        <p className="text-text-muted">Coming in a later release.</p>
      </Section>
      <Section title="Subscriptions">
        <p className="text-text-muted">Coming in a later release.</p>
      </Section>
      <Section title="Notes">
        {client.notes ? (
          <p className="whitespace-pre-wrap break-words">{client.notes}</p>
        ) : (
          <p className="text-text-subtle">No notes</p>
        )}
      </Section>
    </article>
  );
}
