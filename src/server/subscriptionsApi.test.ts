import { describe, expect, it } from 'vitest';
import { needsCharging } from '../shared/subscriptions';
import { freshApp, tab, unwrap } from './testHelpers';

function withClient() {
  const app = freshApp();
  unwrap(
    app.api.saveDefaults({ defaultCurrency: 'NGN', currencies: ['NGN', 'USD'], warningDays: 30 }),
  );
  const client = unwrap(app.api.saveClient({ name: 'Acme' }));
  const base = {
    clientId: client.id,
    service: 'Hosting',
    provider: 'Acme Host',
    cost: 25000,
    currency: 'NGN',
    billingCycle: 'Monthly',
    nextRenewal: '2027-01-31',
    paidBy: 'Rebill',
  };
  return { ...app, client, base };
}

describe('subscriptions', () => {
  it('moves a monthly renewal on 31 January to the end of February, then back to the 31st', () => {
    const { api, base } = withClient();
    const sub = unwrap(api.saveSubscription(base));
    const feb = unwrap(api.markSubscriptionRenewed(sub.id, false)).subscription;
    expect(feb.nextRenewal).toBe('2027-02-28');
    expect(unwrap(api.markSubscriptionRenewed(sub.id, false)).subscription.nextRenewal).toBe(
      '2027-03-31',
    );
  });

  it('moves a yearly renewal forward exactly one year', () => {
    const { api, base } = withClient();
    const sub = unwrap(
      api.saveSubscription({ ...base, billingCycle: 'Yearly', nextRenewal: '2026-10-15' }),
    );
    expect(unwrap(api.markSubscriptionRenewed(sub.id, false)).subscription.nextRenewal).toBe(
      '2027-10-15',
    );
  });

  it('logs exactly one outflow with the cost, currency and client when asked', () => {
    const { deps, api, base, client } = withClient();
    const sub = unwrap(api.saveSubscription({ ...base, currency: 'USD', cost: 12.5 }));
    const { transaction } = unwrap(api.markSubscriptionRenewed(sub.id, true));
    expect(transaction).toMatchObject({
      type: 'Outflow',
      amount: 12.5,
      currency: 'USD',
      clientId: client.id,
    });
    const rows = tab(deps, 'Transactions').readAll();
    expect(rows).toHaveLength(2);
    const [header = [], row = []] = rows;
    expect(row[header.indexOf('Amount')]).toBe(12.5);
    expect(row[header.indexOf('Client ID')]).toBe(client.id);
  });

  it('logs nothing when the payment option is not chosen', () => {
    const { deps, api, base } = withClient();
    const sub = unwrap(api.saveSubscription(base));
    unwrap(api.markSubscriptionRenewed(sub.id, false));
    expect(tab(deps, 'Transactions').readAll()).toHaveLength(1);
  });

  it('shows a Charge client reminder for rebilled subscriptions until marked charged', () => {
    const { api, base } = withClient();
    const rebilled = unwrap(api.saveSubscription(base));
    const ownCard = unwrap(api.saveSubscription({ ...base, paidBy: 'Client card' }));
    expect(
      needsCharging(unwrap(api.markSubscriptionRenewed(rebilled.id, false)).subscription),
    ).toBe(true);
    expect(needsCharging(unwrap(api.markSubscriptionRenewed(ownCard.id, false)).subscription)).toBe(
      false,
    );
    expect(needsCharging(unwrap(api.markSubscriptionCharged(rebilled.id)))).toBe(false);
  });

  it('keeps cancelled subscriptions in history and blocks renewing them', () => {
    const { api, base } = withClient();
    const sub = unwrap(api.saveSubscription(base));
    unwrap(api.setSubscriptionCancelled(sub.id, true));
    expect(unwrap(api.listSubscriptions())[0]?.cancelled).toBe(true);
    expect(api.markSubscriptionRenewed(sub.id, false).ok).toBe(false);
  });

  it('keeps the billing day when other fields are edited, and resets it when the date changes', () => {
    const { api, base } = withClient();
    const sub = unwrap(api.saveSubscription(base));
    const feb = unwrap(api.markSubscriptionRenewed(sub.id, false)).subscription;
    const edited = unwrap(
      api.saveSubscription({ ...base, id: sub.id, nextRenewal: feb.nextRenewal, plan: 'Pro' }),
    );
    expect(edited.billingDay).toBe(31);
    const moved = unwrap(api.saveSubscription({ ...base, id: sub.id, nextRenewal: '2027-03-10' }));
    expect(moved.billingDay).toBe(10);
  });

  it('never accepts a password field', () => {
    const { api, base } = withClient();
    const sub = unwrap(api.saveSubscription({ ...base, password: 'hunter2' }));
    expect(JSON.stringify(sub)).not.toContain('hunter2');
  });
});
