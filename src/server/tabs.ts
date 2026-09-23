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

export const ALL_TABS: TabDefinition[] = [CLIENTS_TAB, TASKS_TAB, SETTINGS_TAB];

export function headersOf(tab: TabDefinition): string[] {
  return tab.columns.map((c) => c.header);
}
