export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  notes: string;
  archived: boolean;
  created: string;
}

export interface Task {
  id: string;
  clientId: string;
  title: string;
  description: string;
  links: string;
  dueDate: string;
  status: string;
  created: string;
  updated: string;
  deliveredOn: string;
}

export interface Status {
  id: string;
  name: string;
  color: string;
  done: boolean;
  retired: boolean;
}

export interface Bootstrap {
  email: string;
  appName: string;
  today: string;
  statuses: Status[];
  allowedEmails: string[];
  defaultCurrency: string;
  currencies: string[];
  warningDays: number;
  categories: string[];
  hasSampleData: boolean;
  /** The server code's version, so the page can spot a half-finished manual update. */
  version: string;
}

export type DueFilter = 'any' | 'overdue' | 'week' | 'none';

export interface TaskFilters {
  clientId?: string;
  status?: string;
  due?: DueFilter;
  search?: string;
}

export type ContractCycle = 'Monthly' | 'Quarterly' | 'Yearly';
export type SubscriptionCycle = 'Monthly' | 'Yearly';
export type PaidBy = 'Rebill' | 'Client card' | 'Contract';

export interface Contract {
  id: string;
  clientId: string;
  name: string;
  startDate: string;
  endDate: string;
  fee: number;
  currency: string;
  billingCycle: ContractCycle;
  renewedById: string;
  notes: string;
  created: string;
}

export type ContractState = 'Active' | 'Expiring soon' | 'Expired' | 'Renewed';

export interface Subscription {
  id: string;
  clientId: string;
  service: string;
  provider: string;
  plan: string;
  cost: number;
  currency: string;
  billingCycle: SubscriptionCycle;
  nextRenewal: string;
  billingDay: number;
  autoRenew: boolean;
  paidBy: PaidBy;
  accountEmail: string;
  rebillDue: string;
  cancelled: boolean;
  notes: string;
  created: string;
}

export type SubscriptionState = 'Active' | 'Renewing soon' | 'Overdue' | 'Cancelled';

export type TransactionType = 'Inflow' | 'Outflow';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  clientId: string;
  description: string;
  reference: string;
  voided: boolean;
  created: string;
}
