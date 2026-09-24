import { z } from 'zod';
import { dayOfMonth } from '../shared/dates';
import { subscriptionInputSchema } from '../shared/renewalSchemas';
import { AppError } from '../shared/result';
import { nextRenewalDate } from '../shared/subscriptions';
import type { Subscription, Transaction } from '../shared/types';
import { requireUsableClient } from './clientsService';
import { parseInput, type RequestContext } from './context';
import { requireCurrency } from './currency';
import { rowToSubscription, subscriptionToRow, transactionToRow } from './renewalRecords';

export const SUBSCRIPTION_CATEGORY = 'Subscriptions';

const idSchema = z.string().trim().min(1, 'Missing subscription ID.');

function requireSubscription(ctx: RequestContext, id: string): Subscription {
  const row = ctx.subscriptions().findById(id);
  if (!row) {
    throw new AppError('NOT_FOUND', 'That subscription no longer exists. Reload and try again.');
  }
  return rowToSubscription(row);
}

function saveSubscription(ctx: RequestContext, [input]: unknown[]): Subscription {
  const data = parseInput(subscriptionInputSchema, input);
  return ctx.deps.withLock(() => {
    const existing = data.id ? requireSubscription(ctx, data.id) : null;
    requireUsableClient(ctx, data.clientId, existing?.clientId);
    requireCurrency(ctx, data.currency, existing?.currency);
    const dateUnchanged = existing !== null && existing.nextRenewal === data.nextRenewal;
    const billingDay = dateUnchanged ? existing.billingDay : dayOfMonth(data.nextRenewal);
    if (existing) {
      const sub: Subscription = { ...existing, ...data, id: existing.id, billingDay };
      ctx.subscriptions().update(sub.id, subscriptionToRow(sub));
      return sub;
    }
    const sub: Subscription = {
      ...data,
      id: ctx.deps.newId(),
      billingDay,
      rebillDue: '',
      cancelled: false,
      created: ctx.deps.now(),
    };
    ctx.subscriptions().insert(subscriptionToRow(sub));
    return sub;
  });
}

function paymentFor(ctx: RequestContext, sub: Subscription): Transaction {
  const label = [sub.service, sub.provider].filter(Boolean).join(', ');
  return {
    id: ctx.deps.newId(),
    date: ctx.deps.today(),
    type: 'Outflow',
    amount: sub.cost,
    currency: sub.currency,
    category: SUBSCRIPTION_CATEGORY,
    clientId: sub.clientId,
    description: `${label} renewal`,
    reference: `Renewal due ${sub.nextRenewal}`,
    voided: false,
    created: ctx.deps.now(),
  };
}

const renewedArgs = z.tuple([idSchema, z.boolean().default(false)]);

/** Moves the renewal on one cycle, flags a rebill, and can log the payment as one outflow. */
function markSubscriptionRenewed(
  ctx: RequestContext,
  args: unknown[],
): { subscription: Subscription; transaction: Transaction | null } {
  const [id, logPayment] = parseInput(renewedArgs, args);
  return ctx.deps.withLock(() => {
    const existing = requireSubscription(ctx, id);
    if (existing.cancelled) {
      throw new AppError(
        'VALIDATION',
        'This subscription is cancelled. Restore it before marking it renewed.',
      );
    }
    const subscription: Subscription = {
      ...existing,
      nextRenewal: nextRenewalDate(existing),
      rebillDue: existing.paidBy === 'Rebill' ? existing.nextRenewal : existing.rebillDue,
    };
    ctx.subscriptions().update(id, subscriptionToRow(subscription));
    const transaction = logPayment ? paymentFor(ctx, existing) : null;
    if (transaction) ctx.transactions().insert(transactionToRow(transaction));
    return { subscription, transaction };
  });
}

function markSubscriptionCharged(ctx: RequestContext, args: unknown[]): Subscription {
  const [id] = parseInput(z.tuple([idSchema]), args);
  return ctx.deps.withLock(() => {
    const subscription = { ...requireSubscription(ctx, id), rebillDue: '' };
    ctx.subscriptions().update(id, { 'Rebill due': '' });
    return subscription;
  });
}

function setSubscriptionCancelled(ctx: RequestContext, args: unknown[]): Subscription {
  const [id, cancelled] = parseInput(z.tuple([idSchema, z.boolean()]), args);
  return ctx.deps.withLock(() => {
    const subscription = { ...requireSubscription(ctx, id), cancelled };
    ctx.subscriptions().update(id, { Cancelled: cancelled });
    return subscription;
  });
}

function listSubscriptions(ctx: RequestContext): Subscription[] {
  return ctx
    .subscriptions()
    .list()
    .map(rowToSubscription)
    .filter((s) => s.id !== '');
}

export const subscriptionHandlers = {
  listSubscriptions,
  saveSubscription,
  markSubscriptionRenewed,
  markSubscriptionCharged,
  setSubscriptionCancelled,
};
