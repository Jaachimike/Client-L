import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { created, primaryAction, renderApp } from '../../testing/renderApp';

async function openNewTaskForm(user: ReturnType<typeof renderApp>['user']) {
  window.location.hash = '/tasks';
  await screen.findByRole('heading', { name: 'Tasks', level: 1 });
  await waitFor(() => expect(screen.queryByText('Loading tasks…')).not.toBeInTheDocument());
  await user.click(primaryAction('New task'));
  return screen.findByRole('dialog', { name: 'New task' });
}

function optionNames(select: HTMLElement): string[] {
  return within(select)
    .getAllByRole('option')
    .map((o) => o.textContent ?? '');
}

describe('Clients screen', () => {
  it('blocks saving a client without a name', async () => {
    const { user } = renderApp({ hash: '/clients' });
    await screen.findByText('No clients yet');
    await user.click(primaryAction('Add client'));
    const dialog = await screen.findByRole('dialog', { name: 'Add client' });
    await user.click(within(dialog).getByRole('button', { name: 'Save client' }));
    expect(await within(dialog).findByText('Enter a client name.')).toBeInTheDocument();
  });

  it('offers a new client in the task form straight away', async () => {
    const { user } = renderApp({ hash: '/clients' });
    await screen.findByText('No clients yet');
    await user.click(primaryAction('Add client'));
    const dialog = await screen.findByRole('dialog', { name: 'Add client' });
    await user.type(within(dialog).getByLabelText('Name'), 'Fresh Client');
    await user.click(within(dialog).getByRole('button', { name: 'Save client' }));
    expect(
      await screen.findByRole('heading', { name: 'Fresh Client', level: 2 }),
    ).toBeInTheDocument();

    const taskDialog = await openNewTaskForm(user);
    expect(optionNames(within(taskDialog).getByLabelText('Client'))).toContain('Fresh Client');
  });

  it('shows a renamed client everywhere, because tasks link by ID', async () => {
    let clientId = '';
    const { user } = renderApp({
      seed: (s) => {
        const client = created(s.api.saveClient({ name: 'Acme' }));
        clientId = client.id;
        created(s.api.saveTask({ clientId: client.id, title: 'Homepage' }));
      },
    });
    await within(await screen.findByRole('table')).findByText('Acme');
    window.location.hash = `/clients/${clientId}`;
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit client' });
    const name = within(dialog).getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Acme Group');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('heading', { name: 'Acme Group', level: 2 });

    window.location.hash = '/tasks';
    await screen.findByRole('heading', { name: 'Tasks', level: 1 });
    const table = within(await screen.findByRole('table'));
    expect(await table.findByText('Acme Group')).toBeInTheDocument();
  });

  it('hides an archived client from the task form but keeps its name on its tasks', async () => {
    let clientId = '';
    const { user } = renderApp({
      seed: (s) => {
        created(s.api.saveClient({ name: 'Active Co' }));
        const old = created(s.api.saveClient({ name: 'Old Mill' }));
        clientId = old.id;
        created(s.api.saveTask({ clientId: old.id, title: 'Hand over files' }));
      },
      hash: '/clients',
    });
    window.location.hash = `/clients/${clientId}`;
    await user.click(await screen.findByRole('button', { name: 'Archive' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Old Mill archived');

    const dialog = await openNewTaskForm(user);
    expect(optionNames(within(dialog).getByLabelText('Client'))).not.toContain('Old Mill');
    await user.keyboard('{Escape}');
    const table = within(await screen.findByRole('table'));
    expect(table.getByText('Old Mill')).toBeInTheDocument();
  });

  it('pre-fills the client when adding a task from the client page', async () => {
    let clientId = '';
    const { user } = renderApp({
      seed: (s) => {
        created(s.api.saveClient({ name: 'Alpha' }));
        clientId = created(s.api.saveClient({ name: 'Zeta' })).id;
      },
    });
    await screen.findByText('No tasks yet');
    window.location.hash = `/clients/${clientId}`;
    await user.click(await screen.findByRole('button', { name: 'Task for this client' }));
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    expect(within(dialog).getByLabelText('Client')).toHaveValue(clientId);
  });
});
