export type ColumnKind = 'text' | 'date' | 'datetime' | 'boolean' | 'number';

export interface ColumnDefinition {
  header: string;
  kind: ColumnKind;
}

export interface TabDefinition {
  name: string;
  columns: ColumnDefinition[];
}

const text = (header: string): ColumnDefinition => ({ header, kind: 'text' });
const date = (header: string): ColumnDefinition => ({ header, kind: 'date' });
const datetime = (header: string): ColumnDefinition => ({ header, kind: 'datetime' });
const flag = (header: string): ColumnDefinition => ({ header, kind: 'boolean' });
const num = (header: string): ColumnDefinition => ({ header, kind: 'number' });

export const CLIENTS_TAB: TabDefinition = {
  name: 'Clients',
  columns: [
    text('ID'),
    text('Name'),
    text('Contact person'),
    text('Email'),
    text('Phone'),
    text('Notes'),
    flag('Archived'),
    datetime('Created'),
  ],
};

export const TASKS_TAB: TabDefinition = {
  name: 'Tasks',
  columns: [
    text('ID'),
    text('Client ID'),
    text('Title'),
    text('Description'),
    text('Links'),
    date('Due date'),
    text('Status'),
    datetime('Created'),
    datetime('Updated'),
    date('Delivered on'),
  ],
};

export const SETTINGS_TAB: TabDefinition = {
  name: 'Settings',
  columns: [text('Key'), text('Value')],
};

export const CONTRACTS_TAB: TabDefinition = {
  name: 'Contracts',
  columns: [
    text('ID'),
    text('Client ID'),
    text('Name'),
    date('Start date'),
    date('End date'),
    num('Fee'),
    text('Currency'),
    text('Billing cycle'),
    text('Renewed by ID'),
    text('Notes'),
    datetime('Created'),
  ],
};

export const SUBSCRIPTIONS_TAB: TabDefinition = {
  name: 'Subscriptions',
  columns: [
    text('ID'),
    text('Client ID'),
    text('Service'),
    text('Provider'),
    text('Plan'),
    num('Cost'),
    text('Currency'),
    text('Billing cycle'),
    date('Next renewal'),
    num('Billing day'),
    flag('Auto-renew'),
    text('Paid by'),
    text('Account email'),
    date('Rebill due'),
    flag('Cancelled'),
    text('Notes'),
    datetime('Created'),
  ],
};

export const TRANSACTIONS_TAB: TabDefinition = {
  name: 'Transactions',
  columns: [
    text('ID'),
    date('Date'),
    text('Type'),
    num('Amount'),
    text('Currency'),
    text('Category'),
    text('Client ID'),
    text('Description'),
    text('Reference'),
    flag('Voided'),
    datetime('Created'),
  ],
};

export const ALL_TABS: TabDefinition[] = [
  CLIENTS_TAB,
  TASKS_TAB,
  CONTRACTS_TAB,
  SUBSCRIPTIONS_TAB,
  TRANSACTIONS_TAB,
  SETTINGS_TAB,
];

export function headersOf(tab: TabDefinition): string[] {
  return tab.columns.map((c) => c.header);
}
