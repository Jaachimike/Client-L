import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { created, renderApp } from '../../testing/renderApp';

describe('Settings screen', () => {
  it('adds a status that then appears in every task status menu, in the set order', async () => {
    const { user } = renderApp({
      hash: '/settings',
      seed: (s) => {
        const client = created(s.api.saveClient({ name: 'Acme' }));
        created(s.api.saveTask({ clientId: client.id, title: 'Homepage' }));
      },
    });
    await user.click(await screen.findByRole('button', { name: 'Add status' }));
    const nameInput = screen.getByLabelText('Name for status 4');
    await user.type(nameInput, 'Waiting on client');
    await user.click(screen.getByRole('button', { name: 'Move Waiting on client up' }));
    await user.click(screen.getByRole('button', { name: 'Save statuses' }));
    expect(await screen.findByText('Statuses saved.')).toBeInTheDocument();

    window.location.hash = '/tasks';
    const table = within(await screen.findByRole('table'));
    await user.click(table.getByRole('button', { name: /Change status of Homepage/ }));
    const items = await screen.findAllByRole('menuitemradio');
    expect(items.map((i) => i.textContent)).toEqual([
      'To do',
      'In progress',
      'Waiting on client',
      'Delivered',
    ]);
  });

  it('does not let you delete a status that is in use', async () => {
    renderApp({
      hash: '/settings',
      seed: (s) => {
        const client = created(s.api.saveClient({ name: 'Acme' }));
        created(s.api.saveTask({ clientId: client.id, title: 'Homepage' }));
      },
    });
    const button = await screen.findByRole('button', {
      name: /To do is in use and cannot be deleted/,
    });
    expect(button).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Delivered' })).toBeEnabled();
  });

  it('adds an email to the access list', async () => {
    const { user, server } = renderApp({ hash: '/settings' });
    await user.type(await screen.findByLabelText('Add an email'), 'Partner@Example.com');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() =>
      expect(screen.getByRole('list', { name: 'Allowed emails' })).toHaveTextContent(
        'partner@example.com',
      ),
    );
    server.deps.email = 'partner@example.com';
    expect(server.api.listClients().ok).toBe(true);
  });
});
