import { describe, expect, it } from 'vitest';
import { summariseDashboard } from './dashboard';
import { DEFAULT_STATUSES, doneStatusNames } from './statuses';
import type { Subscription, Task } from './types';

const today = '2026-10-01';
const taskCtx = { today, doneStatuses: doneStatusNames(DEFAULT_STATUSES) };
const renewalCtx = { today, warningDays: 30 };

const task = (id: string, dueDate: string): Task => ({
  id,
  clientId: 'c',
  title: id,
  description: '',
  links: '',
  dueDate,
  status: 'To do',
  created: '',
  updated: '',
  deliveredOn: '',
});

const sub = (overrides: Partial<Subscription>): Subscription => ({
  id: 's',
  clientId: 'c',
  service: 'Domain',
  provider: '',
  plan: '',
  cost: 1,
  currency: 'NGN',
  billingCycle: 'Yearly',
  nextRenewal: '2026-12-01',
  billingDay: 1,
  autoRenew: false,
  paidBy: 'Rebill',
  accountEmail: '',
  rebillDue: '',
  cancelled: false,
  notes: '',
  created: '',
  ...overrides,
});

describe('summariseDashboard', () => {
  it('orders attention items by date and includes charge-client reminders', () => {
    const summary = summariseDashboard({
      tasks: [task('b', '2026-09-29'), task('a', '2026-09-20')],
      contracts: [],
      subscriptions: [
        sub({ id: 'x', rebillDue: '2026-09-25' }),
        sub({ id: 'y', nextRenewal: '2026-09-28', autoRenew: true, paidBy: 'Client card' }),
      ],
      taskCtx,
      renewalCtx,
    });
    expect(summary.attention.map((i) => i.key)).toEqual(['task-a', 'charge-x', 'sub-y', 'task-b']);
    expect(summary.attention.find((i) => i.key === 'sub-y')?.label).toBe(
      'Auto-renew: confirm payment',
    );
  });

  it('links each count to the same window the tab uses', () => {
    const summary = summariseDashboard({
      tasks: [],
      contracts: [],
      subscriptions: [],
      taskCtx,
      renewalCtx: { today, warningDays: 45 },
    });
    expect(summary.window).toBe('45');
    expect(summary.counts).toEqual({
      overdueTasks: 0,
      dueThisWeek: 0,
      contractsExpiring: 0,
      subscriptionsRenewing: 0,
    });
  });
});
