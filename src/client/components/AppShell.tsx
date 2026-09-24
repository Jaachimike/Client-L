import {
  CalendarClock,
  Ellipsis,
  FileText,
  ListChecks,
  RefreshCw,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { buildHref } from '../lib/router';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Other sections that also mark this item as current. */
  alsoActive?: string[];
}

const MAIN_NAV: NavItem[] = [
  { path: '/tasks', label: 'Tasks', icon: ListChecks },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/contracts', label: 'Contracts', icon: FileText },
  { path: '/subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { path: '/cashflow', label: 'Cash flow', icon: Wallet },
];
const SETTINGS_NAV: NavItem = { path: '/settings', label: 'Settings', icon: Settings };

/** Phones have room for fewer tabs, so contracts and subscriptions share one Renewals tab. */
const PHONE_NAV: NavItem[] = [
  { path: '/tasks', label: 'Tasks', icon: ListChecks },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/contracts', label: 'Renewals', icon: CalendarClock, alsoActive: ['/subscriptions'] },
  { path: '/more', label: 'More', icon: Ellipsis, alsoActive: ['/cashflow', '/settings'] },
];

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <a
      href={buildHref(item.path)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex min-h-11 items-center gap-3 rounded-lg px-3 font-medium',
        active ? 'bg-accent-tint text-accent' : 'text-text-muted hover:bg-surface hover:text-text',
      )}
    >
      <Icon aria-hidden size={20} strokeWidth={1.8} className="shrink-0" />
      <span
        className={cn(
          'whitespace-nowrap',
          'sm:pointer-events-none sm:absolute sm:left-full sm:z-10 sm:ml-2 sm:rounded-md sm:bg-text sm:px-2 sm:py-1 sm:text-xs sm:text-surface sm:opacity-0',
          'sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100',
          'lg:pointer-events-auto lg:static lg:ml-0 lg:bg-transparent lg:p-0 lg:text-sm lg:text-inherit lg:opacity-100',
        )}
      >
        {item.label}
      </span>
    </a>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <a
      href={buildHref(item.path)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium',
        active ? 'bg-accent-tint text-accent' : 'text-text-muted',
      )}
    >
      <Icon aria-hidden size={20} strokeWidth={1.8} />
      {item.label}
    </a>
  );
}

interface AppShellProps {
  appName: string;
  email: string;
  activePath: string;
  children: ReactNode;
}

export function AppShell({ appName, email, activePath, children }: AppShellProps) {
  const isActive = (item: NavItem) =>
    [item.path, ...(item.alsoActive ?? [])].some(
      (path) => activePath === path || activePath.startsWith(`${path}/`),
    );
  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
      >
        Skip to content
      </a>
      <nav
        aria-label="Main"
        className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-border bg-surface-muted p-3 sm:flex lg:w-[232px]"
      >
        <p className="mb-6 truncate px-3 pt-2 font-heading text-lg font-semibold lg:block sm:hidden">
          {appName}
        </p>
        <div className="flex flex-col gap-1">
          {MAIN_NAV.map((item) => (
            <SideLink key={item.path} item={item} active={isActive(item)} />
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <SideLink item={SETTINGS_NAV} active={isActive(SETTINGS_NAV)} />
          <p className="hidden truncate px-3 pb-2 text-xs text-text-muted lg:block" title={email}>
            {email}
          </p>
        </div>
      </nav>
      <main
        id="main"
        className="px-4 pt-6 pb-28 sm:pl-[calc(72px+40px)] sm:pr-10 sm:pt-8 sm:pb-8 lg:pl-[calc(232px+40px)]"
      >
        {children}
      </main>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface sm:hidden"
      >
        {PHONE_NAV.map((item) => (
          <TabLink key={item.path} item={item} active={isActive(item)} />
        ))}
      </nav>
    </div>
  );
}
