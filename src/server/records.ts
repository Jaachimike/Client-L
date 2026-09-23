import { toIsoDate } from '../shared/dates';
import type { Client, Task } from '../shared/types';
import type { Cell } from './store';
import type { Row } from './repository';

export function cellText(cell: Cell | undefined): string {
  return cell === undefined ? '' : String(cell).trim();
}

export function cellFlag(cell: Cell | undefined): boolean {
  if (typeof cell === 'boolean') return cell;
  return ['true', 'yes', 'y', '1'].includes(cellText(cell).toLowerCase());
}

export function rowToClient(row: Row): Client {
  return {
    id: cellText(row['ID']),
    name: cellText(row['Name']),
    contactPerson: cellText(row['Contact person']),
    email: cellText(row['Email']),
    phone: cellText(row['Phone']),
    notes: cellText(row['Notes']),
    archived: cellFlag(row['Archived']),
    created: cellText(row['Created']),
  };
}

export function clientToRow(client: Client): Row {
  return {
    ID: client.id,
    Name: client.name,
    'Contact person': client.contactPerson,
    Email: client.email,
    Phone: client.phone,
    Notes: client.notes,
    Archived: client.archived,
    Created: client.created,
  };
}

export function rowToTask(row: Row): Task {
  return {
    id: cellText(row['ID']),
    clientId: cellText(row['Client ID']),
    title: cellText(row['Title']),
    description: cellText(row['Description']),
    links: cellText(row['Links']),
    dueDate: toIsoDate(cellText(row['Due date'])),
    status: cellText(row['Status']),
    created: cellText(row['Created']),
    updated: cellText(row['Updated']),
    deliveredOn: toIsoDate(cellText(row['Delivered on'])),
  };
}

export function taskToRow(task: Task): Row {
  return {
    ID: task.id,
    'Client ID': task.clientId,
    Title: task.title,
    Description: task.description,
    Links: task.links,
    'Due date': task.dueDate,
    Status: task.status,
    Created: task.created,
    Updated: task.updated,
    'Delivered on': task.deliveredOn,
  };
}
