import { useState } from 'react';
import { formatDisplayDate } from '../../../shared/dates';
import { nextRenewalDate } from '../../../shared/subscriptions';
import type { Subscription, Transaction } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert } from '../../components/ui/feedback';
import { errorMessage } from '../../lib/api';
import { formatMoney } from '../../lib/money';
import { useMarkRenewed } from '../../lib/renewalQueries';

interface MarkRenewedFormProps {
  subscription: Subscription;
  clientName: string;
  onDone: (sub: Subscription, transaction: Transaction | null) => void;
  onCancel: () => void;
}

/** Confirms the new renewal date and optionally logs the payment as one outflow. */
export function MarkRenewedForm({
  subscription: sub,
  clientName,
  onDone,
  onCancel,
}: MarkRenewedFormProps) {
  const mark = useMarkRenewed();
  const [logPayment, setLogPayment] = useState(sub.paidBy === 'Rebill');
  const cost = formatMoney(sub.cost, sub.currency);

  const confirm = () =>
    mark.mutate(
      { id: sub.id, logPayment },
      { onSuccess: ({ subscription, transaction }) => onDone(subscription, transaction) },
    );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
        <div>
          <dt className="text-xs text-text-muted">Renewal due</dt>
          <dd className="font-mono">{formatDisplayDate(sub.nextRenewal)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Next renewal becomes</dt>
          <dd className="font-mono">{formatDisplayDate(nextRenewalDate(sub))}</dd>
        </div>
      </dl>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-accent"
          checked={logPayment}
          onChange={(e) => setLogPayment(e.target.checked)}
        />
        <span>
          Log {cost} as an outflow in Cash flow
          <span className="block text-[13px] text-text-muted">
            Recorded today for {clientName}, category Subscriptions.
          </span>
        </span>
      </label>
      {sub.paidBy === 'Rebill' && (
        <p className="rounded-lg bg-warning-tint px-3 py-2 text-[13px] text-warning">
          You pay and rebill this one, so it will show a Charge client reminder until you mark it
          charged.
        </p>
      )}
      <div className="mt-auto flex flex-col gap-3 pt-4">
        {mark.isError && <ErrorAlert>{errorMessage(mark.error)}</ErrorAlert>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={mark.isPending}>
            {mark.isPending ? 'Saving…' : 'Mark renewed'}
          </Button>
        </div>
      </div>
    </div>
  );
}
