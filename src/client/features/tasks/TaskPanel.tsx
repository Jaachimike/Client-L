import type { TaskContext } from '../../../shared/tasks';
import type { Client, Status, Task } from '../../../shared/types';
import { SidePanel } from '../../components/ui/side-panel';
import { TaskDetail } from './TaskDetail';
import { TaskForm } from './TaskForm';

export type TaskPanelState =
  | { mode: 'closed' }
  | { mode: 'new'; clientId?: string }
  | { mode: 'view'; taskId: string }
  | { mode: 'edit'; taskId: string };

interface TaskPanelProps {
  state: TaskPanelState;
  onStateChange: (state: TaskPanelState) => void;
  tasks: Task[];
  clients: Client[];
  statuses: Status[];
  ctx: TaskContext;
  onStatusChange: (task: Task, status: string) => void;
  onSaved: (task: Task, isNew: boolean) => void;
}

export function TaskPanel({
  state,
  onStateChange,
  tasks,
  clients,
  statuses,
  ctx,
  onStatusChange,
  onSaved,
}: TaskPanelProps) {
  const close = () => onStateChange({ mode: 'closed' });
  const task =
    state.mode === 'view' || state.mode === 'edit'
      ? tasks.find((t) => t.id === state.taskId)
      : undefined;
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? 'Unknown client';
  const title =
    state.mode === 'new'
      ? 'New task'
      : state.mode === 'edit'
        ? 'Edit task'
        : (task?.title ?? 'Task');

  return (
    <SidePanel
      open={state.mode !== 'closed'}
      onOpenChange={(open) => !open && close()}
      title={title}
    >
      {state.mode === 'new' && (
        <TaskForm
          clients={clients}
          defaultClientId={state.clientId}
          onCancel={close}
          onSaved={(saved) => {
            close();
            onSaved(saved, true);
          }}
        />
      )}
      {state.mode === 'edit' && task && (
        <TaskForm
          clients={clients}
          task={task}
          onCancel={() => onStateChange({ mode: 'view', taskId: task.id })}
          onSaved={(saved) => {
            onStateChange({ mode: 'view', taskId: saved.id });
            onSaved(saved, false);
          }}
        />
      )}
      {state.mode === 'view' && task && (
        <TaskDetail
          task={task}
          clientName={clientName(task.clientId)}
          statuses={statuses}
          ctx={ctx}
          onEdit={() => onStateChange({ mode: 'edit', taskId: task.id })}
          onStatusChange={(status) => onStatusChange(task, status)}
        />
      )}
    </SidePanel>
  );
}
