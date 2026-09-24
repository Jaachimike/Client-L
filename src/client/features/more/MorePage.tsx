import { ChevronRight, Settings, Wallet } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { buildHref } from '../../lib/router';

const LINKS = [
  {
    path: '/cashflow',
    label: 'Cash flow',
    detail: 'Money in and out, monthly totals and import',
    icon: Wallet,
  },
  {
    path: '/settings',
    label: 'Settings',
    detail: 'Statuses, access, currencies and warnings',
    icon: Settings,
  },
];

/** Phones have room for four tabs; the rest of the sections live here. */
export function MorePage() {
  return (
    <>
      <PageHeader title="More" />
      <ul className="overflow-hidden rounded-xl border border-border bg-surface">
        {LINKS.map(({ path, label, detail, icon: Icon }) => (
          <li key={path} className="border-b border-border last:border-b-0">
            <a
              href={buildHref(path)}
              className="flex min-h-16 items-center gap-3 px-4 hover:bg-surface-muted"
            >
              <Icon aria-hidden size={20} strokeWidth={1.8} className="text-text-muted" />
              <span className="flex-1">
                <span className="block font-medium">{label}</span>
                <span className="block text-[13px] text-text-muted">{detail}</span>
              </span>
              <ChevronRight aria-hidden size={18} strokeWidth={1.8} className="text-text-subtle" />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
