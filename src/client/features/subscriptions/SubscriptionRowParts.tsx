import { CheckCircle2, RefreshCw } from 'lucide-react';
import type { RenewalContext } from '../../../shared/contracts';
import { needsCharging, subscriptionState } from '../../../shared/subscriptions';
import type { Subscription } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { Tag } from '../../components/ui/state-badge';
import type { SubscriptionActions } from './SubscriptionList';

export function Actions({
  sub,
  ctx,
  onMarkRenewed,
  onMarkCharged,
}: { sub: Subscription; ctx: RenewalContext } & Omit<SubscriptionActions, 'onOpen'>) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {needsCharging(sub) && (
        <Button
          variant="secondary"
          size="dense"
          onClick={() => onMarkCharged(sub)}
          aria-label={`Mark ${sub.service} charged to client`}
        >
          <CheckCircle2 aria-hidden size={16} strokeWidth={1.8} /> Mark charged
        </Button>
      )}
      {subscriptionState(sub, ctx) !== 'Cancelled' && (
        <Button
          variant="secondary"
          size="dense"
          onClick={() => onMarkRenewed(sub)}
          aria-label={`Mark ${sub.service} renewed`}
        >
          <RefreshCw aria-hidden size={16} strokeWidth={1.8} /> Mark renewed
        </Button>
      )}
    </div>
  );
}

export function Title({
  sub,
  clientName,
  onOpen,
}: {
  sub: Subscription;
  clientName: string;
  onOpen: (s: Subscription) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onOpen(sub)}
        className="text-left font-medium hover:text-accent hover:underline"
      >
        {sub.service}
      </button>
      <p className="text-xs text-text-muted">{clientName}</p>
      {needsCharging(sub) && <Tag>Charge client</Tag>}
    </div>
  );
}
