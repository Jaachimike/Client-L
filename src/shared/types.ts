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
}

export type DueFilter = 'any' | 'overdue' | 'week' | 'none';

export interface TaskFilters {
  clientId?: string;
  status?: string;
  due?: DueFilter;
  search?: string;
}
