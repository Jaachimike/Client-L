import type { ContractState, SubscriptionState } from '../../../shared/types';
import { cn } from '../../lib/cn';

type State = ContractState | SubscriptionState;

const TONES: Record<State, string> = {
  Active: 'bg-success-tint text-success',
  'Expiring soon': 'bg-warning-tint text-warning',
  'Renewing soon': 'bg-warning-tint text-warning',
  Expired: 'bg-danger-tint text-danger',
  Overdue: 'bg-danger-tint text-danger',
  Renewed: 'bg-surface-muted text-text-muted border border-border',
  Cancelled: 'bg-surface-muted text-text-muted border border-border',
};

/** A state is always shown as words, never colour alone. */
export function StateBadge({ state }: { state: State }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        TONES[state],
      )}
    >
      {state}
    </span>
  );
}

export function Tag({
  children,
  tone = 'warning',
}: {
  children: string;
  tone?: 'warning' | 'accent';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tone === 'warning' ? 'bg-warning-tint text-warning' : 'bg-accent-tint text-accent',
      )}
    >
      {children}
    </span>
  );
}
