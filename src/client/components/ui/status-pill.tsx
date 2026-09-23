import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { pillColors } from '../../../shared/color';
import { statusOptionsFor } from '../../../shared/statuses';
import type { Status } from '../../../shared/types';
import { cn } from '../../lib/cn';

const UNKNOWN_COLOR = '#6B675F';

function colorFor(name: string, statuses: Status[]): string {
  return statuses.find((s) => s.name === name)?.color ?? UNKNOWN_COLOR;
}

export function StatusPill({
  name,
  statuses,
  className,
}: {
  name: string;
  statuses: Status[];
  className?: string;
}) {
  const { background, text } = pillColors(colorFor(name, statuses));
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        className,
      )}
      style={{ background, color: text }}
    >
      {name || 'No status'}
    </span>
  );
}

interface StatusMenuProps {
  taskTitle: string;
  current: string;
  statuses: Status[];
  onChange: (status: string) => void;
  disabled?: boolean;
}

/** Inline status dropdown; retired statuses are offered only to tasks already using them. */
export function StatusMenu({ taskTitle, current, statuses, onChange, disabled }: StatusMenuProps) {
  const { background, text } = pillColors(colorFor(current, statuses));
  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={disabled}
        aria-label={`Status: ${current}. Change status of ${taskTitle}`}
        className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-xs font-medium whitespace-nowrap"
        style={{ background, color: text }}
      >
        {current || 'No status'}
        <ChevronDown aria-hidden size={14} strokeWidth={2} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-44 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
        >
          <Menu.RadioGroup value={current} onValueChange={onChange}>
            {statusOptionsFor(current, statuses).map((status) => (
              <Menu.RadioItem
                key={status.id}
                value={status.name}
                className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-2 outline-none data-[highlighted]:bg-surface-muted"
              >
                <StatusPill name={status.name} statuses={statuses} />
                <Menu.ItemIndicator>
                  <Check aria-hidden size={16} strokeWidth={2} className="text-text-muted" />
                </Menu.ItemIndicator>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
