import { cn } from '../lib/cn';
import { buildHref } from '../lib/router';

const VIEWS = [
  { path: '/contracts', label: 'Contracts' },
  { path: '/subscriptions', label: 'Subscriptions' },
];

/** On phones Contracts and Subscriptions share the Renewals tab; this switches between them. */
export function RenewalsSwitch({ current }: { current: string }) {
  return (
    <nav
      aria-label="Renewals"
      className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1 sm:hidden"
    >
      {VIEWS.map((view) => (
        <a
          key={view.path}
          href={buildHref(view.path)}
          aria-current={current === view.path ? 'page' : undefined}
          className={cn(
            'flex min-h-10 items-center justify-center rounded-lg text-[13px] font-medium',
            current === view.path ? 'bg-accent-tint text-accent' : 'text-text-muted',
          )}
        >
          {view.label}
        </a>
      ))}
    </nav>
  );
}
