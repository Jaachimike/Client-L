import { describe, expect, it } from 'vitest';
import {
  canRenew,
  contractState,
  daysLeftLabel,
  filterContracts,
  inContractWindow,
  renewalDates,
} from './contracts';
import { addMonths } from './dates';
import { contractInputSchema, defaultsSchema, subscriptionInputSchema } from './renewalSchemas';
import {
  filterSubscriptions,
  inSubscriptionWindow,
  nextRenewalDate,
  subscriptionState,
} from './subscriptions';
import type { Contract, Subscription } from './types';

const ctx = { today: '2026-10-01', warningDays: 30 };

function contract(overrides: Partial<Contract>): Contract {
  return {
    id: 'c',
    clientId: 'client',
    name: 'Retainer',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fee: 100,
    currency: 'NGN',
    billingCycle: 'Monthly',
    renewedById: '',
    notes: '',
    created: '',
    ...overrides,
  };
}

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: 's',
    clientId: 'client',
    service: 'Hosting',
    provider: 'Acme Host',
    plan: '',
    cost: 5000,
    currency: 'NGN',
    billingCycle: 'Monthly',
    nextRenewal: '2026-12-01',
    billingDay: 1,
    autoRenew: false,
    paidBy: 'Rebill',
    accountEmail: '',
    rebillDue: '',
    cancelled: false,
    notes: '',
    created: '',
    ...overrides,
  };
}

describe('contract state', () => {
  it('with today as 1 October: 20 Oct is Expiring soon, 15 Nov Active, 30 Sep Expired', () => {
    expect(contractState(contract({ endDate: '2026-10-20' }), ctx)).toBe('Expiring soon');
    expect(contractState(contract({ endDate: '2026-11-15' }), ctx)).toBe('Active');
    expect(contractState(contract({ endDate: '2026-09-30' }), ctx)).toBe('Expired');
  });

  it('treats a contract ending today as Expiring soon and one renewed as Renewed', () => {
    expect(contractState(contract({ endDate: '2026-10-01' }), ctx)).toBe('Expiring soon');
    expect(daysLeftLabel('2026-10-01', ctx.today)).toBe('Ends today');
    expect(contractState(contract({ endDate: '2026-09-01', renewedById: 'new' }), ctx)).toBe(
      'Renewed',
    );
  });

  it('follows the warning window from Settings', () => {
    const end = contract({ endDate: '2026-11-15' });
    expect(contractState(end, { ...ctx, warningDays: 60 })).toBe('Expiring soon');
    expect(contractState(contract({ endDate: '2026-10-20' }), { ...ctx, warningDays: 7 })).toBe(
      'Active',
    );
  });

  it('includes the boundary day in the 30, 60 and 90 day filters', () => {
    expect(inContractWindow(contract({ endDate: '2026-10-31' }), '30', ctx)).toBe(true);
    expect(inContractWindow(contract({ endDate: '2026-11-01' }), '30', ctx)).toBe(false);
    expect(inContractWindow(contract({ endDate: '2026-11-30' }), '60', ctx)).toBe(true);
    expect(inContractWindow(contract({ endDate: '2026-12-30' }), '90', ctx)).toBe(true);
    expect(inContractWindow(contract({ endDate: '2026-12-31' }), '90', ctx)).toBe(false);
  });

  it('sorts by soonest end date and only offers Renew when expiring or expired', () => {
    const list = [
      contract({ id: 'b', endDate: '2027-01-01' }),
      contract({ id: 'a', endDate: '2026-10-05' }),
    ];
    expect(filterContracts(list, {}, ctx).map((c) => c.id)).toEqual(['a', 'b']);
    expect(canRenew(contract({ endDate: '2026-10-05' }), ctx)).toBe(true);
    expect(canRenew(contract({ endDate: '2027-01-01' }), ctx)).toBe(false);
  });
});

describe('renewalDates', () => {
  it('starts the day after and keeps the same number of months, even across leap years', () => {
    expect(renewalDates(contract({ startDate: '2027-01-01', endDate: '2027-12-31' }))).toEqual({
      startDate: '2028-01-01',
      endDate: '2028-12-31',
    });
    expect(renewalDates(contract({ startDate: '2026-04-15', endDate: '2026-07-14' }))).toEqual({
      startDate: '2026-07-15',
      endDate: '2026-10-14',
    });
  });

  it('keeps the same number of days when the period is not whole months', () => {
    expect(renewalDates(contract({ startDate: '2026-10-01', endDate: '2026-10-10' }))).toEqual({
      startDate: '2026-10-11',
      endDate: '2026-10-20',
    });
  });
});

describe('subscriptions', () => {
  it('moves a monthly renewal on 31 January to the end of February, not 3 March', () => {
    expect(nextRenewalDate(sub({ nextRenewal: '2027-01-31', billingDay: 31 }))).toBe('2027-02-28');
    expect(nextRenewalDate(sub({ nextRenewal: '2028-01-31', billingDay: 31 }))).toBe('2028-02-29');
  });

  it('returns to the original billing day after a short month', () => {
    expect(nextRenewalDate(sub({ nextRenewal: '2027-02-28', billingDay: 31 }))).toBe('2027-03-31');
  });

  it('moves a yearly renewal forward exactly one year', () => {
    expect(
      nextRenewalDate(sub({ billingCycle: 'Yearly', nextRenewal: '2026-10-15', billingDay: 15 })),
    ).toBe('2027-10-15');
    expect(addMonths('2028-02-29', 12)).toBe('2029-02-28');
  });

  it('works out state, treating a renewal today as Renewing soon', () => {
    expect(subscriptionState(sub({ nextRenewal: '2026-10-01' }), ctx)).toBe('Renewing soon');
    expect(subscriptionState(sub({ nextRenewal: '2026-09-30', autoRenew: true }), ctx)).toBe(
      'Overdue',
    );
    expect(subscriptionState(sub({ nextRenewal: '2026-12-01' }), ctx)).toBe('Active');
    expect(subscriptionState(sub({ cancelled: true, nextRenewal: '2026-09-01' }), ctx)).toBe(
      'Cancelled',
    );
  });

  it('keeps cancelled subscriptions out of renewal filters but in history', () => {
    const cancelled = sub({ id: 'x', cancelled: true, nextRenewal: '2026-10-03' });
    expect(inSubscriptionWindow(cancelled, '7', ctx)).toBe(false);
    expect(inSubscriptionWindow(cancelled, 'overdue', ctx)).toBe(false);
    expect(filterSubscriptions([cancelled], { window: 'all' }, ctx)).toHaveLength(1);
    expect(inSubscriptionWindow(sub({ nextRenewal: '2026-10-08' }), '7', ctx)).toBe(true);
    expect(inSubscriptionWindow(sub({ nextRenewal: '2026-10-09' }), '7', ctx)).toBe(false);
  });

  it('filters by provider and who pays', () => {
    const list = [
      sub({ id: '1', provider: 'A', paidBy: 'Rebill' }),
      sub({ id: '2', provider: 'B', paidBy: 'Client card' }),
    ];
    expect(filterSubscriptions(list, { provider: 'B' }, ctx).map((s) => s.id)).toEqual(['2']);
    expect(filterSubscriptions(list, { paidBy: 'Rebill' }, ctx).map((s) => s.id)).toEqual(['1']);
  });
});

describe('renewal schemas', () => {
  const base = {
    clientId: 'c',
    name: 'Retainer',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    fee: '150,000',
    currency: 'ngn',
    billingCycle: 'Monthly',
  };

  it('blocks a contract that ends before it starts', () => {
    const result = contractInputSchema.safeParse({ ...base, endDate: '2026-09-30' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['endDate']);
  });

  it('reads money typed with commas and normalises the currency', () => {
    expect(contractInputSchema.parse(base)).toMatchObject({ fee: 150000, currency: 'NGN' });
  });

  it('rejects negative and non-numeric amounts', () => {
    expect(contractInputSchema.safeParse({ ...base, fee: '-5' }).success).toBe(false);
    expect(contractInputSchema.safeParse({ ...base, fee: 'lots' }).success).toBe(false);
    expect(contractInputSchema.safeParse({ ...base, fee: '' }).success).toBe(false);
  });

  it('has no password field on subscriptions', () => {
    expect(Object.keys(subscriptionInputSchema.shape).some((k) => /pass/i.test(k))).toBe(false);
  });

  it('requires the default currency to be in the list', () => {
    expect(
      defaultsSchema.safeParse({ defaultCurrency: 'NGN', currencies: ['USD'], warningDays: 30 })
        .success,
    ).toBe(false);
    expect(
      defaultsSchema.safeParse({
        defaultCurrency: 'NGN',
        currencies: ['NGN', 'USD'],
        warningDays: '45',
      }).success,
    ).toBe(true);
  });
});
