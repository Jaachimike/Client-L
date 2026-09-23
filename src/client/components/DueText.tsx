import { AlertTriangle } from 'lucide-react';
import { dueLabel, formatDisplayDate } from '../../shared/dates';
import { isDone, isOverdue, type TaskContext } from '../../shared/tasks';
import type { Task } from '../../shared/types';
import { cn } from '../lib/cn';

/** Due date with a plain-language label; overdue is shown in red and in words. */
export function DueText({ task, ctx }: { task: Task; ctx: TaskContext }) {
  if (!task.dueDate) return <span className="text-text-subtle">No date</span>;
  const overdue = isOverdue(task, ctx);
  const done = isDone(task, ctx);
  return (
    <span className={cn('inline-flex flex-col', overdue && 'text-danger')}>
      <span className="font-mono text-[13px]">{formatDisplayDate(task.dueDate)}</span>
      {!done && (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs',
            overdue ? 'font-medium' : 'text-text-muted',
          )}
        >
          {overdue && <AlertTriangle aria-hidden size={12} strokeWidth={2} />}
          {dueLabel(task.dueDate, ctx.today)}
        </span>
      )}
    </span>
  );
}
