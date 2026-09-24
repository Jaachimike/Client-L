import { addDays } from '../shared/dates';

/** Demo records, dated relative to today so the dashboard always has something to show. */
export type SampleClientKey = 'northwind' | 'harbour' | 'lumen' | 'oldMill';

export const SAMPLE_CLIENTS: Record<SampleClientKey, Record<string, string>> = {
  northwind: {
    name: 'Northwind Bakery',
    contactPerson: 'Ada Obi',
    email: 'ada@northwind.example',
    phone: '+234 803 000 0000',
    notes: 'Prefers WhatsApp for quick questions.',
  },
  harbour: { name: 'Harbour Dental', contactPerson: 'Sam Reyes', email: 'sam@harbour.example' },
  lumen: { name: 'Lumen Studio', contactPerson: 'Kai Lee' },
  oldMill: { name: 'Old Mill Co', notes: 'Project finished last year.' },
};

type Ids = Record<SampleClientKey, string>;

export function sampleTasks(today: string, ids: Ids) {
  return [
    {
      clientId: ids.northwind,
      title: 'Update holiday opening hours',
      description:
        'New hours are in the email thread. Also check https://northwind.example/hours on mobile.',
      dueDate: addDays(today, -4),
    },
    {
      clientId: ids.northwind,
      title: 'Add online order form',
      links:
        'Brief | https://docs.google.com/document/d/example\nhttps://www.figma.com/file/example',
      dueDate: addDays(today, 3),
      status: 'In progress',
    },
    {
      clientId: ids.harbour,
      title: 'Fix booking widget on Safari',
      description: 'Reported by two patients.',
      dueDate: addDays(today, 1),
    },
    { clientId: ids.harbour, title: 'Monthly plugin updates', dueDate: addDays(today, 12) },
    {
      clientId: ids.lumen,
      title: 'Portfolio gallery lightbox',
      description: 'Waiting on final images.',
    },
    { clientId: ids.oldMill, title: 'Hand over site files', status: 'Delivered' },
  ];
}

export function sampleContracts(today: string, ids: Ids, currency: string) {
  return [
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
  ].map((c) => ({ ...c, currency }));
}

export function sampleSubscriptions(today: string, ids: Ids, currency: string) {
  return [
    {
      clientId: ids.northwind,
      service: 'Domain',
      provider: 'Whogohost',
      cost: 15000,
      billingCycle: 'Yearly',
      nextRenewal: addDays(today, 5),
      paidBy: 'Rebill',
    },
    {
      clientId: ids.harbour,
      service: 'Hosting',
      provider: 'DigitalOcean',
      cost: 18000,
      billingCycle: 'Monthly',
      nextRenewal: addDays(today, -2),
      autoRenew: true,
      paidBy: 'Rebill',
    },
    {
      clientId: ids.lumen,
      service: 'Google Workspace',
      provider: 'Google',
      cost: 10000,
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
      billingCycle: 'Yearly',
      nextRenewal: addDays(today, 120),
      paidBy: 'Contract',
    },
  ].map((s) => ({ ...s, currency }));
}

export function sampleTransactions(today: string, ids: Ids, currency: string) {
  return [
    {
      date: addDays(today, -150),
      type: 'Inflow',
      amount: 800000,
      clientId: ids.lumen,
      category: 'Client payment',
      description: 'Portfolio site deposit',
    },
    {
      date: addDays(today, -120),
      type: 'Outflow',
      amount: 150000,
      clientId: ids.lumen,
      category: 'UI design',
      description: 'UI design for portfolio',
    },
    {
      date: addDays(today, -95),
      type: 'Inflow',
      amount: 540000,
      clientId: ids.harbour,
      category: 'Client payment',
      description: '40% of booking site',
    },
    {
      date: addDays(today, -60),
      type: 'Outflow',
      amount: 225000,
      clientId: ids.harbour,
      category: 'Development',
      description: 'Booking widget development',
    },
    {
      date: addDays(today, -30),
      type: 'Inflow',
      amount: 810000,
      clientId: ids.harbour,
      category: 'Client payment',
      description: '60% of booking site',
    },
    {
      date: addDays(today, -3),
      type: 'Inflow',
      amount: 1000000,
      clientId: ids.northwind,
      category: 'Client payment',
      description: 'Online ordering deposit',
    },
    {
      date: addDays(today, -1),
      type: 'Outflow',
      amount: 200000,
      clientId: ids.northwind,
      category: 'UI design',
      description: 'Order form designs',
    },
    {
      date: '',
      type: 'Inflow',
      amount: 300000,
      clientId: ids.lumen,
      category: 'Client payment',
      description: 'Older payment, date unknown',
    },
  ].map((t) => ({ ...t, currency }));
}
