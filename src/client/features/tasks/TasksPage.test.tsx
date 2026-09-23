import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { created, primaryAction, renderApp } from '../../testing/renderApp';
import type { MockServer } from '../../mocks/mockServer';

function seedClients(server: MockServer) {
  const acme = created(server.api.saveClient({ name: 'Acme' }));
  const beta = created(server.api.saveClient({ name: 'Beta Ltd' }));
  return { acme, beta };
}

async function table() {
  return within(await screen.findByRole('table'));
}

describe('Tasks screen', () => {
  it('adds a task that appears in the list without a reload', async () => {
    const { user, server } = renderApp({ seed: (s) => void seedClients(s) });
    await screen.findByText('No tasks yet');
    await user.click(primaryAction('New task'));
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await user.selectOptions(within(dialog).getByLabelText('Client'), 'Acme');
    await user.type(within(dialog).getByLabelText('Task title'), 'Launch landing page');
    await user.type(
      within(dialog).getByLabelText(/Links/),
      'Brief | https://docs.example.com/brief',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save task' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Task “Launch landing page” added.',
    );
    expect(
      (await table()).getByRole('button', { name: 'Launch landing page' }),
    ).toBeInTheDocument();
    const rows = server.deps.workbook.getTable('Tasks')?.rows ?? [];
    expect(rows).toHaveLength(2);
  });

  it('blocks saving without a client or title and says what to fix', async () => {
    const { user } = renderApp({ seed: (s) => void seedClients(s) });
    await screen.findByText('No tasks yet');
    await user.click(primaryAction('New task'));
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await user.click(within(dialog).getByRole('button', { name: 'Save task' }));
    expect(await within(dialog).findByText('Choose a client.')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter a task title.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Task title')).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects a link that is not http or https', async () => {
    const { user } = renderApp({ seed: (s) => void seedClients(s) });
    await screen.findByText('No tasks yet');
    await user.click(primaryAction('New task'));
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await user.selectOptions(within(dialog).getByLabelText('Client'), 'Acme');
    await user.type(within(dialog).getByLabelText('Task title'), 'Bad link');
    await user.type(within(dialog).getByLabelText(/Links/), 'javascript:alert(1)');
    await user.click(within(dialog).getByRole('button', { name: 'Save task' }));
    expect(
      await within(dialog).findByText(/Line 1 of Links is not a web link/),
    ).toBeInTheDocument();
  });

  it('filters by client, then narrows further by status', async () => {
    const { user } = renderApp({
      seed: (s) => {
        const { acme, beta } = seedClients(s);
        created(s.api.saveTask({ clientId: acme.id, title: 'Acme open' }));
        const done = created(s.api.saveTask({ clientId: acme.id, title: 'Acme done' }));
        s.api.setTaskStatus(done.id, 'Delivered');
        created(s.api.saveTask({ clientId: beta.id, title: 'Beta open' }));
      },
    });
    await user.selectOptions(await screen.findByLabelText('Client'), 'Acme');
    let rows = await table();
    await waitFor(() => expect(rows.queryByText('Beta open')).not.toBeInTheDocument());
    expect(rows.getByText('Acme open')).toBeInTheDocument();
    expect(rows.getByText('Acme done')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Delivered/ }));
    rows = await table();
    await waitFor(() => expect(rows.queryByText('Acme open')).not.toBeInTheDocument());
    expect(rows.getByText('Acme done')).toBeInTheDocument();
  });

  it('searches words in titles and descriptions', async () => {
    const { user } = renderApp({
      seed: (s) => {
        const { acme } = seedClients(s);
        created(
          s.api.saveTask({
            clientId: acme.id,
            title: 'Logo',
            description: 'Needs the brand refresh',
          }),
        );
        created(s.api.saveTask({ clientId: acme.id, title: 'Invoice page' }));
      },
    });
    await user.type(await screen.findByLabelText('Search tasks'), 'brand');
    const rows = await table();
    await waitFor(() => expect(rows.queryByText('Invoice page')).not.toBeInTheDocument());
    expect(rows.getByText('Logo')).toBeInTheDocument();
  });

  it('shows overdue tasks in red with a plain-language label, and lists them first', async () => {
    renderApp({
      seed: (s) => {
        const { acme } = seedClients(s);
        created(s.api.saveTask({ clientId: acme.id, title: 'Undated' }));
        created(s.api.saveTask({ clientId: acme.id, title: 'Late', dueDate: '2026-09-27' }));
        created(s.api.saveTask({ clientId: acme.id, title: 'Soon', dueDate: '2026-10-03' }));
      },
    });
    const rows = await table();
    const label = rows.getByText('4 days overdue');
    expect(label.closest('span.text-danger')).not.toBeNull();
    const titles = rows.getAllByRole('button').map((b) => b.textContent);
    expect(titles.filter((t) => ['Late', 'Soon', 'Undated'].includes(t ?? ''))).toEqual([
      'Late',
      'Soon',
      'Undated',
    ]);
  });

  it('changes status inline, saves it, and records the delivery date', async () => {
    const { user, server } = renderApp({
      seed: (s) => {
        const { acme } = seedClients(s);
        created(s.api.saveTask({ clientId: acme.id, title: 'Homepage' }));
      },
    });
    const rows = await table();
    await user.click(
      rows.getByRole('button', { name: /Status: To do\. Change status of Homepage/ }),
    );
    await user.click(await screen.findByRole('menuitemradio', { name: 'Delivered' }));
    await waitFor(() => {
      const [header = [], row = []] = server.deps.workbook.getTable('Tasks')?.rows ?? [];
      expect(row[header.indexOf('Status')]).toBe('Delivered');
      expect(row[header.indexOf('Delivered on')]).toBe('2026-10-01');
    });
  });

  it('shows text with a script tag as plain text and makes links clickable in a new tab', async () => {
    const { user } = renderApp({
      seed: (s) => {
        const { acme } = seedClients(s);
        created(
          s.api.saveTask({
            clientId: acme.id,
            title: '<script>window.hacked=true</script>',
            description: 'Spec at https://example.com/spec.',
            links: 'Brief | https://docs.example.com/b\nhttps://www.figma.com/file/1',
          }),
        );
      },
    });
    const rows = await table();
    expect(
      rows.getByRole('button', { name: '<script>window.hacked=true</script>' }),
    ).toBeInTheDocument();
    expect(document.querySelector('script:not([src])')).toBeNull();
    expect(rows.getByRole('link', { name: 'Brief' })).toHaveAttribute(
      'href',
      'https://docs.example.com/b',
    );
    expect(rows.getByRole('link', { name: 'figma.com' })).toHaveAttribute('target', '_blank');

    await user.click(rows.getByRole('button', { name: '<script>window.hacked=true</script>' }));
    const dialog = await screen.findByRole('dialog');
    const inline = within(dialog).getByRole('link', { name: 'https://example.com/spec' });
    expect(inline).toHaveAttribute('target', '_blank');
    expect(inline).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('closes the side panel with Escape and returns focus to the button that opened it', async () => {
    const { user } = renderApp({ seed: (s) => void seedClients(s) });
    await screen.findByText('No tasks yet');
    const opener = primaryAction('New task');
    await user.click(opener);
    await screen.findByRole('dialog', { name: 'New task' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('asks for a client first when there is no data', async () => {
    renderApp();
    expect(await screen.findByText('Add a client first')).toBeInTheDocument();
  });
});
