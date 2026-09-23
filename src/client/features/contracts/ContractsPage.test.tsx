import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MockServer } from '../../mocks/mockServer';
import { created, primaryAction, renderApp } from '../../testing/renderApp';

function seed(server: MockServer) {
  server.api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['NGN', 'USD'], warningDays: 30 });
  const client = created(server.api.saveClient({ name: 'Harbour Dental' }));
  const base = { clientId: client.id, fee: 150000, currency: 'NGN', billingCycle: 'Monthly' };
  created(
    server.api.saveContract({
      ...base,
      name: 'Care plan',
      startDate: '2025-10-21',
      endDate: '2026-10-20',
    }),
  );
  created(
    server.api.saveContract({
      ...base,
      name: 'Old retainer',
      startDate: '2025-10-01',
      endDate: '2026-09-30',
    }),
  );
  created(
    server.api.saveContract({
      ...base,
      name: 'Hosting',
      startDate: '2026-01-01',
      endDate: '2026-11-15',
    }),
  );
  created(
    server.api.saveContract({
      ...base,
      name: 'Boundary',
      startDate: '2026-01-01',
      endDate: '2026-10-31',
    }),
  );
  return client;
}

async function table() {
  await screen.findByRole('heading', { name: 'Contracts', level: 1 });
  return within(await screen.findByRole('table'));
}

function rowOf(name: string) {
  const row = within(screen.getByRole('table')).getByRole('button', { name }).closest('tr');
  if (!row) throw new Error(`No row for ${name}`);
  return within(row);
}

describe('Contracts screen', () => {
  it('shows each state in words with days left, sorted by soonest end date', async () => {
    renderApp({ hash: '/contracts', seed });
    const rows = await table();
    const names = rows
      .getAllByRole('button')
      .map((b) => b.textContent)
      .filter((t) => t && !t.includes('Renew'));
    expect(names).toEqual(['Old retainer', 'Care plan', 'Boundary', 'Hosting']);
    expect(rowOf('Care plan').getByText('Expiring soon')).toBeInTheDocument();
    expect(rowOf('Care plan').getByText('19 days left')).toBeInTheDocument();
    expect(rowOf('Hosting').getByText('Active')).toBeInTheDocument();
    expect(rowOf('Old retainer').getByText('Expired')).toBeInTheDocument();
    expect(rowOf('Care plan').getByText('₦150,000')).toBeInTheDocument();
  });

  it('includes the boundary day in the 30 day window', async () => {
    const { user } = renderApp({ hash: '/contracts', seed });
    await table();
    await user.click(screen.getByRole('button', { name: /^30 days/ }));
    const rows = await table();
    await waitFor(() => expect(rows.queryByText('Hosting')).not.toBeInTheDocument());
    expect(rows.getByText('Boundary')).toBeInTheDocument();
    expect(rows.getByText('Care plan')).toBeInTheDocument();
  });

  it('renews a contract with pre-filled dates and keeps the old one as Renewed', async () => {
    const { user, server } = renderApp({ hash: '/contracts', seed });
    await table();
    await user.click(rowOf('Care plan').getByRole('button', { name: 'Renew Care plan' }));
    const dialog = await screen.findByRole('dialog', { name: 'Renew contract' });
    expect(within(dialog).getByLabelText('Start date')).toHaveValue('2026-10-21');
    expect(within(dialog).getByLabelText('End date')).toHaveValue('2027-10-20');
    await user.click(within(dialog).getByRole('button', { name: 'Renew contract' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Renewed. “Care plan” now runs to 20 Oct 2027',
    );
    const rows = await table();
    const states = rows.getAllByText(/^(Renewed|Active)$/).map((el) => el.textContent);
    expect(states).toContain('Renewed');
    expect(server.deps.workbook.getTable('Contracts')?.rows).toHaveLength(6);
  });

  it('blocks an end date before the start date', async () => {
    const { user } = renderApp({ hash: '/contracts', seed });
    await table();
    await user.click(primaryAction('New contract'));
    const dialog = await screen.findByRole('dialog', { name: 'New contract' });
    await user.selectOptions(within(dialog).getByLabelText('Client'), 'Harbour Dental');
    await user.type(within(dialog).getByLabelText('Contract name'), 'Backwards');
    await user.type(within(dialog).getByLabelText('Start date'), '2026-10-10');
    await user.type(within(dialog).getByLabelText('End date'), '2026-10-01');
    await user.type(within(dialog).getByLabelText('Fee'), '5000');
    await user.click(within(dialog).getByRole('button', { name: 'Save contract' }));
    expect(
      await within(dialog).findByText('The end date must be on or after the start date.'),
    ).toBeInTheDocument();
  });
});
