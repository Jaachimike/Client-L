import type { TaskContext } from '../../../shared/tasks';
import type { Status, Task } from '../../../shared/types';
import { DueText } from '../../components/DueText';
import { StatusMenu } from '../../components/ui/status-pill';
import { LinkChips } from '../../components/ui/links';
import { isOverdue } from '../../../shared/tasks';
import { cn } from '../../lib/cn';

interface TaskListProps {
  tasks: Task[];
  clientName: (id: string) => string;
  statuses: Status[];
  ctx: TaskContext;
  onOpen: (task: Task) => void;
  onStatusChange: (task: Task, status: string) => void;
  showClient?: boolean;
}

function TitleButton({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className="text-left font-medium text-text hover:text-accent hover:underline"
    >
      {task.title}
    </button>
  );
}

export function TaskList({
  tasks,
  clientName,
  statuses,
  ctx,
  onOpen,
  onStatusChange,
  showClient = true,
}: TaskListProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface sm:block">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-surface-muted text-xs tracking-[0.04em] text-text-muted uppercase">
            <tr>
              {showClient && (
                <th scope="col" className="px-4 py-3 font-medium">
                  Client
                </th>
              )}
              <th scope="col" className="px-4 py-3 font-medium">
                Task
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Due
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">
                Links
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className={cn(
                  'border-t border-border align-top',
                  isOverdue(task, ctx) && 'bg-danger-tint/40',
                )}
              >
                {showClient && (
                  <td className="px-4 py-3 text-text-muted">{clientName(task.clientId)}</td>
                )}
                <td className="max-w-md px-4 py-3">
                  <TitleButton task={task} onOpen={onOpen} />
                  {task.description && (
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-text-muted">
                      {task.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <DueText task={task} ctx={ctx} />
                </td>
                <td className="px-4 py-2">
                  <StatusMenu
                    taskTitle={task.title}
                    current={task.status}
                    statuses={statuses}
                    onChange={(s) => onStatusChange(task, s)}
                  />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <LinkChips links={task.links} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 sm:hidden" aria-label="Tasks">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={cn(
              'rounded-xl border border-border bg-surface p-4',
              isOverdue(task, ctx) && 'border-danger',
            )}
          >
            {showClient && <p className="text-xs text-text-muted">{clientName(task.clientId)}</p>}
            <TitleButton task={task} onOpen={onOpen} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <DueText task={task} ctx={ctx} />
              <StatusMenu
                taskTitle={task.title}
                current={task.status}
                statuses={statuses}
                onChange={(s) => onStatusChange(task, s)}
              />
            </div>
            {task.links && (
              <div className="mt-3">
                <LinkChips links={task.links} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
