import type { z } from 'zod';
import type { subscriptionInputSchema } from '../../../shared/renewalSchemas';
import type { Subscription } from '../../../shared/types';

export type SubscriptionFormValues = z.input<typeof subscriptionInputSchema>;
export type SubscriptionFieldName = Exclude<keyof SubscriptionFormValues, 'id' | 'autoRenew'>;

export const SUBSCRIPTION_FIELDS: SubscriptionFieldName[] = [
  'clientId',
  'service',
  'provider',
  'plan',
  'cost',
  'currency',
  'billingCycle',
  'nextRenewal',
  'paidBy',
  'accountEmail',
  'notes',
];

export function initialSubscriptionValues(
  sub: Subscription | undefined,
  defaultClientId: string | undefined,
  defaultCurrency: string,
): SubscriptionFormValues {
  return {
    id: sub?.id,
    clientId: sub?.clientId ?? defaultClientId ?? '',
    service: sub?.service ?? '',
    provider: sub?.provider ?? '',
    plan: sub?.plan ?? '',
    cost: sub ? String(sub.cost) : '',
    currency: sub?.currency ?? defaultCurrency,
    billingCycle: sub?.billingCycle ?? 'Yearly',
    nextRenewal: sub?.nextRenewal ?? '',
    autoRenew: sub?.autoRenew ?? false,
    paidBy: sub?.paidBy ?? 'Rebill',
    accountEmail: sub?.accountEmail ?? '',
    notes: sub?.notes ?? '',
  };
}
