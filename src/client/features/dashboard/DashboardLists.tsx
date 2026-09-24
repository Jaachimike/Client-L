import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import type { DashboardItem } from '../../../shared/dashboard';
import { cn } from '../../lib/cn';
import { buildHref } from '../../lib/router';

const KIND_LABEL: Record<DashboardItem['kind'], string> = {
  task: 'Task',
  contract: 'Contract',
  subscription: 'Subscription',
  charge: 'Rebill',
};

const TONE: Record<DashboardItem['tone'], string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  neutral: 'text-text-muted',
};

const MAX_ROWS = 6;

interface ItemListProps {
  title: string;
  items: DashboardItem[];
  empty: string;
  clientName: (id: string) => string;
}

export function ItemList({ title, items, empty, clientName }: ItemListProps) {
  const shown = items.slice(0, MAX_ROWS);
  const hidden = items.length - shown.length;
  const headingId = `${title.toLowerCase().replace(/\s+/g, '-')}-heading`;
  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-border bg-surface">
      <h2 id={headingId} className="border-b border-border px-5 py-4 font-medium">
        {title} <span className="font-mono text-text-muted">{items.length}</span>
      </h2>
      {shown.length === 0 ? (
        <p className="px-5 py-6 text-text-muted">{empty}</p>
      ) : (
        <ul>
          {shown.map((item) => {
            const Icon = item.tone === 'danger' ? AlertTriangle : Clock;
            return (
              <li key={item.key} className="border-b border-border last:border-b-0">
                <a
                  href={buildHref(item.link.path, item.link.params)}
                  className="flex min-h-14 items-center gap-3 px-5 py-2 hover:bg-surface-muted"
                >
                  <Icon
                    aria-hidden
                    size={16}
                    strokeWidth={1.8}
                    className={cn('shrink-0', TONE[item.tone])}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="block truncate text-[13px] text-text-muted">
                      {KIND_LABEL[item.kind]} · {clientName(item.clientId)}
                    </span>
                  </span>
                  <span className={cn('shrink-0 text-right text-[13px]', TONE[item.tone])}>
                    {item.label}
                  </span>
                  <ChevronRight
                    aria-hidden
                    size={16}
                    strokeWidth={1.8}
                    className="shrink-0 text-text-subtle"
                  />
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {hidden > 0 && (
        <p className="border-t border-border px-5 py-3 text-[13px] text-text-muted">
          And {hidden} more in their tabs.
        </p>
      )}
    </section>
  );
}

interface CountCardProps {
  label: string;
  count: number;
  href: string;
  tone: 'danger' | 'warning' | 'neutral';
}

export function CountCard({ label, count, href, tone }: CountCardProps) {
  return (
    <a
      href={href}
      aria-label={`${count} ${label}`}
      className="group flex flex-col gap-1 rounded-xl border border-border bg-surface p-5 hover:border-border-strong"
    >
      <span className="font-mono text-[32px] leading-none font-medium">{count}</span>
      <span className={cn('text-[13px]', count > 0 ? TONE[tone] : 'text-text-muted')}>{label}</span>
      <span className="mt-auto pt-2 text-xs text-accent group-hover:underline">View</span>
    </a>
  );
}
