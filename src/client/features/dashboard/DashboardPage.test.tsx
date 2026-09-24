import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MockServer } from '../../mocks/mockServer';
import { created, renderApp } from '../../testing/renderApp';

/** Today in tests is 1 October 2026. */
function seed(server: MockServer, warningDays = 30) {
  server.api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['NGN'], warningDays });
  const acme = created(server.api.saveClient({ name: 'Acme' }));
  const task = (title: string, dueDate: string) =>
    created(server.api.saveTask({ clientId: acme.id, title, dueDate }));
  task('Late one', '2026-09-28');
  task('Late two', '2026-09-30');
  task('Soon', '2026-10-04');
  task('Later', '2026-10-20');
  const done = task('Done late', '2026-09-01');
  server.api.setTaskStatus(done.id, 'Delivered');
  const contract = (name: string, endDate: string) =>
    created(
      server.api.saveContract({
        clientId: acme.id,
        name,
        startDate: '2026-01-01',
        endDate,
        fee: 1000,
        currency: 'NGN',
        billingCycle: 'Monthly',
      }),
    );
  contract('Ends soon', '2026-10-20');
  contract('Ends in 40 days', '2026-11-10');
  contract('Ended', '2026-09-20');
  const sub = (service: string, nextRenewal: string) =>
    created(
      server.api.saveSubscription({
        clientId: acme.id,
        service,
        cost: 500,
        currency: 'NGN',
        billingCycle: 'Yearly',
        nextRenewal,
        paidBy: 'Client card',
      }),
    );
  sub('Domain', '2026-10-10');
  const cancelled = sub('Old hosting', '2026-10-12');
  server.api.setSubscriptionCancelled(cancelled.id, true);
  created(
    server.api.saveTransaction({
      date: '2026-10-01',
      type: 'Inflow',
      amount: 250000,
      currency: 'NGN',
      description: 'Deposit',
    }),
  );
}

async function card(label: RegExp) {
  await screen.findByRole('heading', { name: 'Dashboard', level: 1 });
  return screen.findByRole('link', { name: label });
}

describe('Dashboard', () => {
  it('shows counts that match the same filter on each tab', async () => {
    const { user } = renderApp({ hash: '/dashboard', seed: (s) => seed(s) });
    expect(await card(/^2 Overdue tasks/)).toBeInTheDocument();
    expect(await card(/^1 Tasks due in the next 7 days/)).toBeInTheDocument();
    expect(await card(/^1 Contracts ending within 30 days/)).toBeInTheDocument();
    expect(await card(/^1 Subscriptions renewing within 30 days/)).toBeInTheDocument();

    await user.click(await card(/Overdue tasks/));
    await screen.findByRole('heading', { name: 'Tasks', level: 1 });
    const rows = within(await screen.findByRole('table')).getAllByRole('row');
    expect(rows).toHaveLength(1 + 2);
    expect(screen.getByLabelText('Due date')).toHaveValue('overdue');
  });

  it('opens Contracts and Subscriptions with the matching window selected', async () => {
    const { user } = renderApp({ hash: '/dashboard', seed: (s) => seed(s) });
    await user.click(await card(/Contracts ending within 30 days/));
    await screen.findByRole('heading', { name: 'Contracts', level: 1 });
    expect(screen.getByRole('button', { name: /^30 days/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(await screen.findByRole('table')).getAllByRole('row')).toHaveLength(2);

    window.location.hash = '/dashboard';
    await user.click(await card(/Subscriptions renewing within 30 days/));
    await screen.findByRole('heading', { name: 'Subscriptions', level: 1 });
    const table = within(await screen.findByRole('table'));
    expect(table.getAllByRole('row')).toHaveLength(2);
    expect(table.queryByText('Old hosting')).not.toBeInTheDocument();
  });

  it('follows a custom warning window and the tabs get a matching chip', async () => {
    const { user } = renderApp({ hash: '/dashboard', seed: (s) => seed(s, 45) });
    await user.click(await card(/^2 Contracts ending within 45 days/));
    await screen.findByRole('heading', { name: 'Contracts', level: 1 });
    expect(screen.getByRole('button', { name: /^45 days/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(await screen.findByRole('table')).getAllByRole('row')).toHaveLength(3);
  });

  it('lists what needs attention and this month’s cash flow', async () => {
    renderApp({ hash: '/dashboard', seed: (s) => seed(s) });
    const attention = within(await screen.findByRole('region', { name: /Needs attention/ }));
    expect(attention.getByText('Late one')).toBeInTheDocument();
    expect(attention.getByText('Ended')).toBeInTheDocument();
    expect(attention.queryByText('Done late')).not.toBeInTheDocument();
    const cash = within(screen.getByRole('region', { name: 'Oct 2026 cash flow' }));
    expect(cash.getAllByText('₦250,000')).toHaveLength(2);
  });

  it('shows a friendly welcome instead of zeros when there is no data', async () => {
    renderApp({ hash: '/dashboard' });
    expect(await screen.findByText('Welcome. Nothing to show yet')).toBeInTheDocument();
    expect(screen.queryByText(/Overdue tasks/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try sample data' })).toBeInTheDocument();
  });

  it('adds sample data from Settings and the dashboard fills in', async () => {
    const { user } = renderApp({ hash: '/settings' });
    await user.click(await screen.findByRole('button', { name: 'Add sample data' }));
    expect(await screen.findByText(/Added 4 clients, 6 tasks/)).toBeInTheDocument();
    window.location.hash = '/dashboard';
    expect(await card(/Overdue tasks/)).toBeInTheDocument();
    window.location.hash = '/settings';
    await user.click(await screen.findByRole('button', { name: 'Clear sample data' }));
    await waitFor(() => expect(screen.getByText(/Removed 4 clients/)).toBeInTheDocument());
  });
});
