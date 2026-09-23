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
  seedRenewals(api, today, { northwind, harbour, lumen });

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

function seedRenewals(
  api: ServerHandlers,
  today: string,
  ids: Record<'northwind' | 'harbour' | 'lumen', string>,
): void {
  api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['NGN', 'USD'], warningDays: 30 });
  const contracts = [
    {
      clientId: ids.harbour,
      name: 'Website care plan',
      startDate: addDays(today, -345),
      endDate: addDays(today, 20),
      fee: 150000,
      billingCycle: 'Monthly',
    },
    {
      clientId: ids.northwind,
      name: 'Menu updates retainer',
      startDate: addDays(today, -190),
      endDate: addDays(today, -10),
      fee: 90000,
      billingCycle: 'Quarterly',
    },
    {
      clientId: ids.lumen,
      name: 'Hosting and support',
      startDate: addDays(today, -30),
      endDate: addDays(today, 335),
      fee: 400000,
      billingCycle: 'Yearly',
    },
  ];
  for (const contract of contracts) api.saveContract({ ...contract, currency: 'NGN' });
  const subscriptions = [
    {
      clientId: ids.northwind,
      service: 'Domain',
      provider: 'Whogohost',
      cost: 15000,
      currency: 'NGN',
      billingCycle: 'Yearly',
      nextRenewal: addDays(today, 5),
      paidBy: 'Rebill',
    },
    {
      clientId: ids.harbour,
      service: 'Hosting',
      provider: 'DigitalOcean',
      cost: 12,
      currency: 'USD',
      billingCycle: 'Monthly',
      nextRenewal: addDays(today, -2),
      autoRenew: true,
      paidBy: 'Rebill',
    },
    {
      clientId: ids.lumen,
      service: 'Google Workspace',
      provider: 'Google',
      cost: 7,
      currency: 'USD',
      billingCycle: 'Monthly',
      nextRenewal: addDays(today, 18),
      autoRenew: true,
      paidBy: 'Client card',
    },
    {
      clientId: ids.harbour,
      service: 'SSL certificate',
      provider: 'Namecheap',
      cost: 9000,
      currency: 'NGN',
      billingCycle: 'Yearly',
      nextRenewal: addDays(today, 120),
      paidBy: 'Contract',
    },
  ];
  for (const sub of subscriptions) api.saveSubscription(sub);
}
