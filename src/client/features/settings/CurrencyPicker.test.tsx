import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { created, primaryAction, renderApp } from '../../testing/renderApp';

async function currencyGroup() {
  return within(await screen.findByRole('group', { name: 'Currencies you use' }));
}

describe('Currency choices in Settings', () => {
  it('starts a new copy with a few common currencies ticked and the default locked on', async () => {
    renderApp({ hash: '/settings' });
    const group = await currencyGroup();
    const usd = group.getByRole('checkbox', { name: /^USD/ });
    expect(usd).toBeChecked();
    expect(usd).toBeDisabled();
    expect(group.getByRole('checkbox', { name: /^GBP/ })).toBeChecked();
    expect(group.getByRole('checkbox', { name: /^NGN/ })).not.toBeChecked();
  });

  it('adds a common currency and a custom code, and forms offer both', async () => {
    const { user, server } = renderApp({
      hash: '/settings',
      seed: (s) => void created(s.api.saveClient({ name: 'Acme' })),
    });
    const group = await currencyGroup();
    await user.click(group.getByRole('checkbox', { name: /^KES/ }));
    await user.type(screen.getByLabelText(/Add another currency/), 'sek');
    await user.click(
      within(screen.getByRole('region', { name: 'Warnings and defaults' })).getByRole('button', {
        name: 'Add',
      }),
    );
    expect(group.getByRole('checkbox', { name: /^SEK/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Save defaults' }));
    expect(await screen.findByText('Defaults saved.')).toBeInTheDocument();
    const settings = server.api.getBootstrap();
    expect(settings.ok && settings.data.currencies).toEqual(
      expect.arrayContaining(['USD', 'EUR', 'GBP', 'KES', 'SEK']),
    );

    window.location.hash = '/cashflow';
    await screen.findByRole('heading', { name: 'Cash flow', level: 1 });
    await user.click(primaryAction('Add entry'));
    const dialog = await screen.findByRole('dialog', { name: 'Add entry' });
    const options = within(within(dialog).getByLabelText('Currency'))
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual(expect.arrayContaining(['KES', 'SEK']));
  });

  it('rejects a code that is not three letters', async () => {
    const { user } = renderApp({ hash: '/settings' });
    await currencyGroup();
    await user.type(screen.getByLabelText(/Add another currency/), 'US');
    await user.click(
      within(screen.getByRole('region', { name: 'Warnings and defaults' })).getByRole('button', {
        name: 'Add',
      }),
    );
    expect(screen.getByText('Enter a 3-letter currency code, such as SEK.')).toBeInTheDocument();
  });
});
