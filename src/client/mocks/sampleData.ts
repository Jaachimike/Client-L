import type { ServerHandlers } from '../../shared/api';
import { addDays } from '../../shared/dates';

function idOf(result: ReturnType<ServerHandlers['saveClient']>): string {
  if (!result.ok) throw new Error(result.error.message);
  return result.data.id;
}

export function seedSampleData(api: ServerHandlers, today: string): void {
  const northwind = idOf(
    api.saveClient({
      name: 'Northwind Bakery',
      contactPerson: 'Ada Obi',
      email: 'ada@northwind.test',
      phone: '+234 803 000 0000',
      notes: 'Prefers WhatsApp for quick questions.',
    }),
  );
  const harbour = idOf(
    api.saveClient({
      name: 'Harbour Dental',
      contactPerson: 'Sam Reyes',
      email: 'sam@harbour.test',
    }),
  );
  const lumen = idOf(api.saveClient({ name: 'Lumen Studio', contactPerson: 'Kai Lee' }));
  const archived = idOf(
    api.saveClient({ name: 'Old Mill Co', notes: 'Project finished in 2025.' }),
  );
  api.setClientArchived(archived, true);

  const tasks = [
    {
      clientId: northwind,
      title: 'Update holiday opening hours',
      description:
        'New hours are in the email thread. Also check https://northwind.test/hours renders on mobile.',
      dueDate: addDays(today, -4),
    },
    {
      clientId: northwind,
      title: 'Add online order form',
      links:
        'Brief | https://docs.google.com/document/d/example\nhttps://www.figma.com/file/example',
      dueDate: addDays(today, 3),
    },
    {
      clientId: harbour,
      title: 'Fix booking widget on Safari',
      description: 'Reported by two patients.',
      dueDate: addDays(today, 1),
    },
    { clientId: harbour, title: 'Monthly plugin updates', dueDate: addDays(today, 12) },
    {
      clientId: lumen,
      title: 'Portfolio gallery lightbox',
      description: 'Waiting on final images.',
    },
    { clientId: archived, title: 'Hand over site files' },
  ];
  const ids = tasks.map((task) => {
    const result = api.saveTask(task);
    if (!result.ok) throw new Error(result.error.message);
    return result.data.id;
  });
  const [, orderForm, , , , handover] = ids;
  if (orderForm) api.setTaskStatus(orderForm, 'In progress');
  if (handover) api.setTaskStatus(handover, 'Delivered');
}
