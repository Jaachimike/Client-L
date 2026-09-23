import type { Bootstrap, Client, Subscription, Transaction } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert } from '../../components/ui/feedback';
import { SidePanel } from '../../components/ui/side-panel';
import { errorMessage } from '../../lib/api';
import { useSetCancelled } from '../../lib/renewalQueries';
import { MarkRenewedForm } from './MarkRenewedForm';
import { SubscriptionForm } from './SubscriptionForm';

export type SubscriptionPanelState =
  | { mode: 'closed' }
  | { mode: 'new'; clientId?: string }
  | { mode: 'edit'; subscription: Subscription }
  | { mode: 'renew'; subscription: Subscription };

interface SubscriptionPanelProps {
  state: SubscriptionPanelState;
  onClose: () => void;
  bootstrap: Bootstrap;
  clients: Client[];
  clientName: (id: string) => string;
  onSaved: (message: string) => void;
  renewedMessage: (sub: Subscription, transaction: Transaction | null) => string;
}

const TITLES = {
  closed: '',
  new: 'New subscription',
  edit: 'Edit subscription',
  renew: 'Mark renewed',
};

export function SubscriptionPanel({
  state,
  onClose,
  bootstrap,
  clients,
  clientName,
  onSaved,
  renewedMessage,
}: SubscriptionPanelProps) {
  const cancel = useSetCancelled();
  return (
    <SidePanel
      open={state.mode !== 'closed'}
      onOpenChange={(open) => !open && onClose()}
      title={TITLES[state.mode]}
    >
      {(state.mode === 'new' || state.mode === 'edit') && (
        <SubscriptionForm
          key={state.mode === 'edit' ? state.subscription.id : 'new'}
          subscription={state.mode === 'edit' ? state.subscription : undefined}
          defaultClientId={state.mode === 'new' ? state.clientId : undefined}
          clients={clients}
          currencies={bootstrap.currencies}
          defaultCurrency={bootstrap.defaultCurrency}
          onCancel={onClose}
          onSaved={(sub) =>
            onSaved(state.mode === 'edit' ? `${sub.service} saved.` : `${sub.service} added.`)
          }
        />
      )}
      {state.mode === 'edit' && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
          {cancel.isError && <ErrorAlert>{errorMessage(cancel.error)}</ErrorAlert>}
          <Button
            variant={state.subscription.cancelled ? 'secondary' : 'danger'}
            onClick={() =>
              cancel.mutate(
                { id: state.subscription.id, cancelled: !state.subscription.cancelled },
                {
                  onSuccess: (s) =>
                    onSaved(
                      s.cancelled
                        ? `${s.service} cancelled. It stays in the history.`
                        : `${s.service} restored.`,
                    ),
                },
              )
            }
          >
            {state.subscription.cancelled ? 'Restore subscription' : 'Cancel subscription'}
          </Button>
        </div>
      )}
      {state.mode === 'renew' && (
        <MarkRenewedForm
          subscription={state.subscription}
          clientName={clientName(state.subscription.clientId)}
          onCancel={onClose}
          onDone={(sub, transaction) => onSaved(renewedMessage(sub, transaction))}
        />
      )}
    </SidePanel>
  );
}
