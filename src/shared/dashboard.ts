import {
  contractState,
  daysLeftLabel,
  inContractWindow,
  type DayWindow,
  type RenewalContext,
} from './contracts';
import { dueLabel } from './dates';
import {
  inSubscriptionWindow,
  needsCharging,
  renewalLabel,
  subscriptionState,
} from './subscriptions';
import { filterTasks, type TaskContext } from './tasks';
import type { Contract, Subscription, Task } from './types';

export interface DashboardItem {
  key: string;
  kind: 'task' | 'contract' | 'subscription' | 'charge';
  title: string;
  clientId: string;
  date: string;
  label: string;
  tone: 'danger' | 'warning' | 'neutral';
  /** Where the item opens: a tab plus the filters that show it. */
  link: { path: string; params: Record<string, string> };
}

export interface DashboardSummary {
  counts: {
    overdueTasks: number;
    dueThisWeek: number;
    contractsExpiring: number;
    subscriptionsRenewing: number;
  };
  window: DayWindow;
  attention: DashboardItem[];
  comingUp: DashboardItem[];
}

interface Inputs {
  tasks: Task[];
  contracts: Contract[];
  subscriptions: Subscription[];
  taskCtx: TaskContext;
  renewalCtx: RenewalContext;
}

const byDate = (a: DashboardItem, b: DashboardItem) =>
  a.date < b.date ? -1 : a.date > b.date ? 1 : 0;

function taskItem(
  task: Task,
  today: string,
  tone: DashboardItem['tone'],
  due: string,
): DashboardItem {
  return {
    key: `task-${task.id}`,
    kind: 'task',
    title: task.title,
    clientId: task.clientId,
    date: task.dueDate,
    label: dueLabel(task.dueDate, today),
    tone,
    link: { path: '/tasks', params: { due, client: task.clientId } },
  };
}

function contractItem(c: Contract, ctx: RenewalContext, window: string): DashboardItem {
  const expired = contractState(c, ctx) === 'Expired';
  return {
    key: `contract-${c.id}`,
    kind: 'contract',
    title: c.name,
    clientId: c.clientId,
    date: c.endDate,
    label: daysLeftLabel(c.endDate, ctx.today),
    tone: expired ? 'danger' : 'warning',
    link: {
      path: '/contracts',
      params: { window: expired ? 'expired' : window, client: c.clientId },
    },
  };
}

function subscriptionItem(s: Subscription, ctx: RenewalContext, window: string): DashboardItem {
  const overdue = subscriptionState(s, ctx) === 'Overdue';
  return {
    key: `sub-${s.id}`,
    kind: 'subscription',
    title: s.provider ? `${s.service} (${s.provider})` : s.service,
    clientId: s.clientId,
    date: s.nextRenewal,
    label:
      overdue && s.autoRenew
        ? 'Auto-renew: confirm payment'
        : renewalLabel(s.nextRenewal, ctx.today),
    tone: overdue ? 'danger' : 'warning',
    link: {
      path: '/subscriptions',
      params: { window: overdue ? 'overdue' : window, client: s.clientId },
    },
  };
}

/** Everything the dashboard shows, using the same filters as each tab so the numbers match. */
export function summariseDashboard({
  tasks,
  contracts,
  subscriptions,
  taskCtx,
  renewalCtx,
}: Inputs): DashboardSummary {
  const window: DayWindow = `${renewalCtx.warningDays}`;
  const overdue = filterTasks(tasks, { due: 'overdue' }, taskCtx);
  const thisWeek = filterTasks(tasks, { due: 'week' }, taskCtx);
  const expiring = contracts.filter((c) => inContractWindow(c, window, renewalCtx));
  const expired = contracts.filter((c) => inContractWindow(c, 'expired', renewalCtx));
  const renewing = subscriptions.filter((s) => inSubscriptionWindow(s, window, renewalCtx));
  const overdueSubs = subscriptions.filter((s) => inSubscriptionWindow(s, 'overdue', renewalCtx));
  const charges = subscriptions.filter(needsCharging).map<DashboardItem>((s) => ({
    key: `charge-${s.id}`,
    kind: 'charge',
    title: `Charge client for ${s.service}`,
    clientId: s.clientId,
    date: s.rebillDue,
    label: 'Charge client',
    tone: 'warning',
    link: { path: '/subscriptions', params: { paidBy: 'Rebill', client: s.clientId } },
  }));

  return {
    counts: {
      overdueTasks: overdue.length,
      dueThisWeek: thisWeek.length,
      contractsExpiring: expiring.length,
      subscriptionsRenewing: renewing.length,
    },
    window,
    attention: [
      ...overdue.map((t) => taskItem(t, taskCtx.today, 'danger', 'overdue')),
      ...expired.map((c) => contractItem(c, renewalCtx, window)),
      ...overdueSubs.map((s) => subscriptionItem(s, renewalCtx, window)),
      ...charges,
    ].sort(byDate),
    comingUp: [
      ...thisWeek.map((t) => taskItem(t, taskCtx.today, 'neutral', 'week')),
      ...expiring.map((c) => contractItem(c, renewalCtx, window)),
      ...renewing.map((s) => subscriptionItem(s, renewalCtx, window)),
    ].sort(byDate),
  };
}
