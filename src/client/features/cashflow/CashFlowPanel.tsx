import type { ImportResult } from '../../../shared/api';
import type { Bootstrap, Client, Contract, Transaction } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert } from '../../components/ui/feedback';
import { SidePanel } from '../../components/ui/side-panel';
import { errorMessage } from '../../lib/api';
import { useSetVoided } from '../../lib/cashQueries';
import { EntryForm } from './EntryForm';
import { ImportPanel } from './ImportPanel';

export type CashPanelState =
  { mode: 'closed' } | { mode: 'new' } | { mode: 'edit'; entry: Transaction } | { mode: 'import' };

interface CashFlowPanelProps {
  state: CashPanelState;
  onClose: () => void;
  bootstrap: Bootstrap;
  clients: Client[];
  contracts: Contract[];
  transactions: Transaction[];
  onDone: (message: string) => void;
}

const TITLES = { closed: '', new: 'Add entry', edit: 'Edit entry', import: 'Import from CSV' };

function importMessage(result: ImportResult, skipped: number): string {
  const parts = [`Imported ${result.imported} ${result.imported === 1 ? 'entry' : 'entries'}.`];
  if (result.clientsCreated.length > 0)
    parts.push(`Created ${result.clientsCreated.length} new clients.`);
  if (result.duplicates > 0)
    parts.push(`${result.duplicates} were already here and were not added again.`);
  if (skipped > 0) parts.push(`${skipped} rows were skipped.`);
  return parts.join(' ');
}

export function CashFlowPanel({
  state,
  onClose,
  bootstrap,
  clients,
  contracts,
  transactions,
  onDone,
}: CashFlowPanelProps) {
  const voiding = useSetVoided();
  return (
    <SidePanel
      open={state.mode !== 'closed'}
      onOpenChange={(open) => !open && onClose()}
      title={TITLES[state.mode]}
    >
      {(state.mode === 'new' || state.mode === 'edit') && (
        <EntryForm
          key={state.mode === 'edit' ? state.entry.id : 'new'}
          entry={state.mode === 'edit' ? state.entry : undefined}
          clients={clients}
          contracts={contracts}
          currencies={bootstrap.currencies}
          categories={bootstrap.categories}
          defaultCurrency={bootstrap.defaultCurrency}
          today={bootstrap.today}
          onCancel={onClose}
          onSaved={(entry) =>
            onDone(
              state.mode === 'edit'
                ? `“${entry.description}” saved.`
                : `“${entry.description}” added.`,
            )
          }
        />
      )}
      {state.mode === 'edit' && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-[13px] text-text-muted">
            {state.entry.voided
              ? 'This entry is voided and left out of all totals.'
              : 'Voiding keeps the entry in the sheet but leaves it out of all totals.'}
          </p>
          {voiding.isError && <ErrorAlert>{errorMessage(voiding.error)}</ErrorAlert>}
          <Button
            variant={state.entry.voided ? 'secondary' : 'danger'}
            onClick={() =>
              voiding.mutate(
                { id: state.entry.id, voided: !state.entry.voided },
                {
                  onSuccess: (t) =>
                    onDone(
                      t.voided ? `“${t.description}” voided.` : `“${t.description}” restored.`,
                    ),
                },
              )
            }
          >
            {state.entry.voided ? 'Restore entry' : 'Void entry'}
          </Button>
        </div>
      )}
      {state.mode === 'import' && (
        <ImportPanel
          bootstrap={bootstrap}
          clients={clients}
          transactions={transactions}
          onCancel={onClose}
          onImported={(result, skipped) => onDone(importMessage(result, skipped))}
        />
      )}
    </SidePanel>
  );
}
