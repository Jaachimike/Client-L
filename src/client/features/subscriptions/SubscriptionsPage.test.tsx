import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MockServer } from '../../mocks/mockServer';
import { created, primaryAction, renderApp } from '../../testing/renderApp';

function seed(server: MockServer) {
  server.api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['NGN', 'USD'], warningDays: 30 });
  const client = created(server.api.saveClient({ name: 'Northwind' }));
  const base = { clientId: client.id, currency: 'NGN', billingCycle: 'Yearly' };
  created(
    server.api.saveSubscription({
      ...base,
      service: 'Domain',
      provider: 'Whogohost',
      cost: 15000,
      nextRenewal: '2026-10-05',
      paidBy: 'Rebill',
    }),
  );
  created(
    server.api.saveSubscription({
      ...base,
      service: 'Hosting',
      provider: 'DO',
      cost: 12,
      currency: 'USD',
      billingCycle: 'Monthly',
      nextRenewal: '2026-09-29',
      autoRenew: true,
      paidBy: 'Client card',
    }),
  );
  const old = created(
    server.api.saveSubscription({
      ...base,
      service: 'Old SSL',
      cost: 9000,
      nextRenewal: '2026-10-10',
      paidBy: 'Contract',
    }),
  );
  server.api.setSubscriptionCancelled(old.id, true);
  return client;
}

async function table() {
  await screen.findByRole('heading', { name: 'Subscriptions', level: 1 });
  return within(await screen.findByRole('table'));
}

function rowOf(service: string) {
  const row = within(screen.getByRole('table'))
    .getByRole('button', { name: service })
    .closest('tr');
  if (!row) throw new Error(`No row for ${service}`);
  return within(row);
}

describe('Subscriptions screen', () => {
  it('flags auto-renew subscriptions past their date until you confirm payment', async () => {
    renderApp({ hash: '/subscriptions', seed });
    await table();
    expect(rowOf('Hosting').getByText('Overdue')).toBeInTheDocument();
    expect(rowOf('Hosting').getByText('Auto-renew: confirm payment')).toBeInTheDocument();
    expect(rowOf('Domain').getByText('Renews in 4 days')).toBeInTheDocument();
  });

  it('keeps cancelled subscriptions out of renewal windows but in the Cancelled view', async () => {
    const { user } = renderApp({ hash: '/subscriptions', seed });
    await table();
    await user.click(screen.getByRole('button', { name: /^30 days/ }));
    let rows = await table();
    await waitFor(() => expect(rows.queryByText('Old SSL')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^Cancelled/ }));
    rows = await table();
    expect(await rows.findByText('Old SSL')).toBeInTheDocument();
  });

  it('marks renewed, logs one outflow, then shows Charge client until marked charged', async () => {
    const { user, server } = renderApp({ hash: '/subscriptions', seed });
    await table();
    await user.click(rowOf('Domain').getByRole('button', { name: 'Mark Domain renewed' }));
    const dialog = await screen.findByRole('dialog', { name: 'Mark renewed' });
    expect(within(dialog).getByText('5 Oct 2027')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('checkbox', { name: /Log ₦15,000 as an outflow/ }),
    ).toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Mark renewed' }));

    expect(await screen.findByRole('status')).toHaveTextContent('₦15,000 logged as an outflow');
    const [header = [], row = [], extra] =
      server.deps.workbook.getTable('Transactions')?.rows ?? [];
    expect(extra).toBeUndefined();
    expect(row[header.indexOf('Type')]).toBe('Outflow');
    expect(row[header.indexOf('Amount')]).toBe(15000);
    expect(rowOf('Domain').getByText('Charge client')).toBeInTheDocument();

    await user.click(
      rowOf('Domain').getByRole('button', { name: 'Mark Domain charged to client' }),
    );
    await waitFor(() =>
      expect(rowOf('Domain').queryByText('Charge client')).not.toBeInTheDocument(),
    );
  });

  it('offers a client added in the app in the subscription and contract forms straight away', async () => {
    const { user } = renderApp({ hash: '/clients', seed });
    await screen.findByRole('heading', { name: 'Clients', level: 1 });
    await user.click(primaryAction('Add client'));
    const clientDialog = await screen.findByRole('dialog', { name: 'Add client' });
    await user.type(within(clientDialog).getByLabelText('Name'), 'Brand New Co');
    await user.click(within(clientDialog).getByRole('button', { name: 'Save client' }));
    await screen.findByRole('heading', { name: 'Brand New Co', level: 2 });

    for (const [path, action] of [
      ['/subscriptions', 'New subscription'],
      ['/contracts', 'New contract'],
    ] as const) {
      window.location.hash = path;
      await screen.findByRole('heading', {
        name: action.replace('New ', '').replace(/^./, (c) => c.toUpperCase()) + 's',
        level: 1,
      });
      await waitFor(() => expect(screen.queryByText(/^Loading/)).not.toBeInTheDocument());
      await user.click(primaryAction(action));
      const dialog = await screen.findByRole('dialog', { name: action });
      const options = within(within(dialog).getByLabelText('Client'))
        .getAllByRole('option')
        .map((o) => o.textContent);
      expect(options).toContain('Brand New Co');
      expect(dialog.querySelector('input[type="password"]')).toBeNull();
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    }
  });
});
