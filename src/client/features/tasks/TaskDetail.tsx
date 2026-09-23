import type { ReactNode } from 'react';
import { formatDisplayDate } from '../../../shared/dates';
import type { TaskContext } from '../../../shared/tasks';
import type { Status, Task } from '../../../shared/types';
import { DueText } from '../../components/DueText';
import { Button } from '../../components/ui/button';
import { LinkChips, LinkifiedText } from '../../components/ui/links';
import { StatusMenu } from '../../components/ui/status-pill';

interface TaskDetailProps {
  task: Task;
  clientName: string;
  statuses: Status[];
  ctx: TaskContext;
  onEdit: () => void;
  onStatusChange: (status: string) => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs tracking-[0.04em] text-text-muted uppercase">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function TaskDetail({
  task,
  clientName,
  statuses,
  ctx,
  onEdit,
  onStatusChange,
}: TaskDetailProps) {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <dl className="flex flex-col gap-4">
        <Row label="Client">{clientName}</Row>
        <Row label="Status">
          <StatusMenu
            taskTitle={task.title}
            current={task.status}
            statuses={statuses}
            onChange={onStatusChange}
          />
        </Row>
        <Row label="Due">
          <DueText task={task} ctx={ctx} />
        </Row>
        {task.deliveredOn && <Row label="Delivered on">{formatDisplayDate(task.deliveredOn)}</Row>}
        <Row label="Description">
          {task.description ? (
            <LinkifiedText text={task.description} />
          ) : (
            <span className="text-text-subtle">No description</span>
          )}
        </Row>
        <Row label="Links">
          {task.links ? (
            <LinkChips links={task.links} />
          ) : (
            <span className="text-text-subtle">No links</span>
          )}
        </Row>
      </dl>
      <div className="mt-auto flex justify-end pt-4">
        <Button onClick={onEdit}>Edit task</Button>
      </div>
    </div>
  );
}
