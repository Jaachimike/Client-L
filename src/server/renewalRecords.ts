import { toIsoDate } from '../shared/dates';
import type {
  Contract,
  ContractCycle,
  PaidBy,
  Subscription,
  SubscriptionCycle,
  Transaction,
} from '../shared/types';
import type { Cell } from './store';
import { cellFlag, cellText } from './records';
import type { Row } from './repository';

export function cellNumber(cell: Cell | undefined): number {
  if (typeof cell === 'number') return cell;
  const parsed = Number(cellText(cell).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function pick<T extends string>(value: string, options: readonly T[], fallback: T): T {
  return options.find((o) => o.toLowerCase() === value.toLowerCase()) ?? fallback;
}

const CONTRACT_CYCLES: readonly ContractCycle[] = ['Monthly', 'Quarterly', 'Yearly'];
const SUBSCRIPTION_CYCLES: readonly SubscriptionCycle[] = ['Monthly', 'Yearly'];
const PAID_BY: readonly PaidBy[] = ['Rebill', 'Client card', 'Contract'];

export function rowToContract(row: Row): Contract {
  return {
    id: cellText(row['ID']),
    clientId: cellText(row['Client ID']),
    name: cellText(row['Name']),
    startDate: toIsoDate(cellText(row['Start date'])),
    endDate: toIsoDate(cellText(row['End date'])),
    fee: cellNumber(row['Fee']),
    currency: cellText(row['Currency']).toUpperCase(),
    billingCycle: pick(cellText(row['Billing cycle']), CONTRACT_CYCLES, 'Monthly'),
    renewedById: cellText(row['Renewed by ID']),
    notes: cellText(row['Notes']),
    created: cellText(row['Created']),
  };
}

export function contractToRow(c: Contract): Row {
  return {
    ID: c.id,
    'Client ID': c.clientId,
    Name: c.name,
    'Start date': c.startDate,
    'End date': c.endDate,
    Fee: c.fee,
    Currency: c.currency,
    'Billing cycle': c.billingCycle,
    'Renewed by ID': c.renewedById,
    Notes: c.notes,
    Created: c.created,
  };
}

export function rowToSubscription(row: Row): Subscription {
  const nextRenewal = toIsoDate(cellText(row['Next renewal']));
  return {
    id: cellText(row['ID']),
    clientId: cellText(row['Client ID']),
    service: cellText(row['Service']),
    provider: cellText(row['Provider']),
    plan: cellText(row['Plan']),
    cost: cellNumber(row['Cost']),
    currency: cellText(row['Currency']).toUpperCase(),
    billingCycle: pick(cellText(row['Billing cycle']), SUBSCRIPTION_CYCLES, 'Monthly'),
    nextRenewal,
    billingDay: cellNumber(row['Billing day']) || Number(nextRenewal.slice(8, 10)) || 0,
    autoRenew: cellFlag(row['Auto-renew']),
    paidBy: pick(cellText(row['Paid by']), PAID_BY, 'Rebill'),
    accountEmail: cellText(row['Account email']),
    rebillDue: toIsoDate(cellText(row['Rebill due'])),
    cancelled: cellFlag(row['Cancelled']),
    notes: cellText(row['Notes']),
    created: cellText(row['Created']),
  };
}

export function subscriptionToRow(s: Subscription): Row {
  return {
    ID: s.id,
    'Client ID': s.clientId,
    Service: s.service,
    Provider: s.provider,
    Plan: s.plan,
    Cost: s.cost,
    Currency: s.currency,
    'Billing cycle': s.billingCycle,
    'Next renewal': s.nextRenewal,
    'Billing day': s.billingDay,
    'Auto-renew': s.autoRenew,
    'Paid by': s.paidBy,
    'Account email': s.accountEmail,
    'Rebill due': s.rebillDue,
    Cancelled: s.cancelled,
    Notes: s.notes,
    Created: s.created,
  };
}

export function transactionToRow(t: Transaction): Row {
  return {
    ID: t.id,
    Date: t.date,
    Type: t.type,
    Amount: t.amount,
    Currency: t.currency,
    Category: t.category,
    'Client ID': t.clientId,
    Description: t.description,
    Reference: t.reference,
    Created: t.created,
  };
}
