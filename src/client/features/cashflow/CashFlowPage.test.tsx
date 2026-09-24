import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SAMPLE_CSV } from '../../mocks/sampleCsv';
import type { MockServer } from '../../mocks/mockServer';
import { created, primaryAction, renderApp } from '../../testing/renderApp';

function seed(server: MockServer) {
  server.api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['NGN', 'USD'], warningDays: 30 });
  const acme = created(server.api.saveClient({ name: 'Acme' }));
  const beta = created(server.api.saveClient({ name: 'Beta' }));
  const base = { currency: 'NGN', date: '2026-10-05' };
  created(
    server.api.saveTransaction({
      ...base,
      type: 'Inflow',
      amount: 500000,
      clientId: acme.id,
      description: 'Acme deposit',
      category: 'Client payment',
    }),
  );
  created(
    server.api.saveTransaction({
      ...base,
      type: 'Outflow',
      amount: 150000,
      clientId: acme.id,
      description: 'Designer',
      category: 'UI design',
    }),
  );
  created(
    server.api.saveTransaction({
      ...base,
      type: 'Inflow',
      amount: 200000,
      clientId: beta.id,
      description: 'Beta deposit',
      category: 'Client payment',
    }),
  );
  created(
    server.api.saveTransaction({
      ...base,
      type: 'Outflow',
      amount: 12,
      currency: 'USD',
      clientId: beta.id,
      description: 'Hosting',
    }),
  );
  created(
    server.api.saveTransaction({
      type: 'Inflow',
      amount: 9000,
      currency: 'NGN',
      description: 'Undated payment',
    }),
  );
}

async function cards() {
  await screen.findByRole('heading', { name: 'Cash flow', level: 1 });
  return within(await screen.findByRole('region', { name: /^Totals for/ }));
}

describe('Cash flow screen', () => {
  it('shows this month’s totals per currency and never mixes currencies', async () => {
    const { user } = renderApp({ hash: '/cashflow', seed });
    const totals = await cards();
    expect(totals.getByText('₦700,000')).toBeInTheDocument();
    expect(totals.getByText('₦150,000')).toBeInTheDocument();
    expect(totals.getByText('₦550,000')).toBeInTheDocument();
    expect(totals.getByText(/also has entries in USD/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Currency'), 'USD');
    const usd = await cards();
    await waitFor(() => expect(usd.getByText('−US$12')).toBeInTheDocument());
  });

  it('updates totals to match only the filtered rows', async () => {
    const { user } = renderApp({ hash: '/cashflow', seed });
    await cards();
    await user.selectOptions(screen.getByLabelText('Client'), 'Beta');
    const totals = await cards();
    await waitFor(() => expect(totals.getAllByText('₦200,000')).toHaveLength(2));
    const table = within(screen.getByRole('table'));
    expect(table.queryByText('Acme deposit')).not.toBeInTheDocument();
  });

  it('keeps undated entries out of months but shows them under No date', async () => {
    const { user } = renderApp({ hash: '/cashflow', seed });
    await cards();
    expect(
      within(screen.getByRole('table')).queryByText('Undated payment'),
    ).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Period'), 'undated');
    expect(
      await within(await screen.findByRole('table')).findByText('Undated payment'),
    ).toBeInTheDocument();
  });

  it('adds an entry, rejects a negative amount, and voids an entry out of the totals', async () => {
    const { user } = renderApp({ hash: '/cashflow', seed });
    await cards();
    await user.click(primaryAction('Add entry'));
    const dialog = await screen.findByRole('dialog', { name: 'Add entry' });
    await user.type(within(dialog).getByLabelText('Amount'), '-500');
    await user.type(within(dialog).getByLabelText('Description'), 'Refund');
    await user.click(within(dialog).getByRole('button', { name: 'Save entry' }));
    expect(await within(dialog).findByText(/must be more than zero/)).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText('Amount'));
    await user.type(within(dialog).getByLabelText('Amount'), '50000');
    await user.click(within(dialog).getByRole('button', { name: 'Save entry' }));
    expect(await screen.findByRole('status')).toHaveTextContent('“Refund” added.');
    expect((await cards()).getByText('₦750,000')).toBeInTheDocument();

    await user.click(within(screen.getByRole('table')).getByRole('button', { name: 'Refund' }));
    const edit = await screen.findByRole('dialog', { name: 'Edit entry' });
    await user.click(within(edit).getByRole('button', { name: 'Void entry' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((await cards()).getByText('₦700,000')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Voided' }));
    expect(await within(await screen.findByRole('table')).findByText('Refund')).toBeInTheDocument();
  });

  it('previews a CSV, reports skipped rows, then imports and creates missing clients', async () => {
    const { user, server } = renderApp({ hash: '/cashflow', seed });
    await cards();
    await user.click(screen.getByRole('button', { name: 'Import CSV' }));
    const dialog = await screen.findByRole('dialog', { name: 'Import from CSV' });
    const file = new File([SAMPLE_CSV], 'sheet.csv', { type: 'text/csv' });
    await user.upload(within(dialog).getByLabelText('CSV file'), file);

    const preview = within(
      await within(dialog).findByRole('region', { name: 'Preview of sheet.csv' }),
    );
    expect(preview.getByText(/will be added/)).toHaveTextContent(
      '4 entries will be added (1 without a date).',
    );
    expect(preview.getByText('₦1,250,000 in, ₦200,000 out')).toBeInTheDocument();
    expect(preview.getByText('Acme Foods, Beta Clinic')).toBeInTheDocument();
    const skipped = within(preview.getByRole('list', { name: 'Skipped rows' }));
    expect(skipped.getAllByRole('listitem')).toHaveLength(6);
    expect(skipped.getByText(/is not a real date/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Import 4 entries' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Imported 4 entries. Created 2 new clients. 6 rows were skipped.',
    );
    expect(server.deps.workbook.getTable('Transactions')?.rows).toHaveLength(10);
  });

  it('offers the chart as a table', async () => {
    const { user } = renderApp({ hash: '/cashflow', seed });
    await cards();
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    const chart = within(screen.getByRole('region', { name: 'Last 6 months (NGN)' }));
    expect(chart.getAllByRole('row')).toHaveLength(7);
    expect(chart.getByText('Oct 2026')).toBeInTheDocument();
  });
});
