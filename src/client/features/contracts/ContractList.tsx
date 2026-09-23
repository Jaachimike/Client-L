import { RefreshCw } from 'lucide-react';
import {
  canRenew,
  contractState,
  daysLeftLabel,
  type RenewalContext,
} from '../../../shared/contracts';
import { formatDisplayDate } from '../../../shared/dates';
import type { Contract } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { StateBadge } from '../../components/ui/state-badge';
import { cn } from '../../lib/cn';
import { formatMoney } from '../../lib/money';

interface ContractListProps {
  contracts: Contract[];
  clientName: (id: string) => string;
  ctx: RenewalContext;
  onOpen: (contract: Contract) => void;
  onRenew: (contract: Contract) => void;
  showClient?: boolean;
}

function Period({ contract, ctx }: { contract: Contract; ctx: RenewalContext }) {
  const state = contractState(contract, ctx);
  const urgent =
    state === 'Expired'
      ? 'text-danger'
      : state === 'Expiring soon'
        ? 'text-warning'
        : 'text-text-muted';
  return (
    <span className="inline-flex flex-col">
      <span className="font-mono text-[13px]">
        {formatDisplayDate(contract.startDate)} – {formatDisplayDate(contract.endDate)}
      </span>
      {state !== 'Renewed' && (
        <span className={cn('text-xs', urgent)}>{daysLeftLabel(contract.endDate, ctx.today)}</span>
      )}
    </span>
  );
}

function NameButton({ contract, onOpen }: { contract: Contract; onOpen: (c: Contract) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(contract)}
      className="text-left font-medium hover:text-accent hover:underline"
    >
      {contract.name}
    </button>
  );
}

function RenewButton({
  contract,
  ctx,
  onRenew,
}: {
  contract: Contract;
  ctx: RenewalContext;
  onRenew: (c: Contract) => void;
}) {
  if (!canRenew(contract, ctx)) return null;
  return (
    <Button
      variant="secondary"
      size="dense"
      onClick={() => onRenew(contract)}
      aria-label={`Renew ${contract.name}`}
    >
      <RefreshCw aria-hidden size={16} strokeWidth={1.8} /> Renew
    </Button>
  );
}

export function ContractList({
  contracts,
  clientName,
  ctx,
  onOpen,
  onRenew,
  showClient = true,
}: ContractListProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface sm:block">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-surface-muted text-xs tracking-[0.04em] text-text-muted uppercase">
            <tr>
              {showClient && (
                <th scope="col" className="px-4 py-3 font-medium">
                  Client
                </th>
              )}
              <th scope="col" className="px-4 py-3 font-medium">
                Contract
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Period
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Fee
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                State
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr key={contract.id} className="border-t border-border align-middle">
                {showClient && (
                  <td className="px-4 py-3 text-text-muted">{clientName(contract.clientId)}</td>
                )}
                <td className="px-4 py-3">
                  <NameButton contract={contract} onOpen={onOpen} />
                  <p className="text-xs text-text-muted">{contract.billingCycle}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Period contract={contract} ctx={ctx} />
                </td>
                <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                  {formatMoney(contract.fee, contract.currency)}
                </td>
                <td className="px-4 py-3">
                  <StateBadge state={contractState(contract, ctx)} />
                </td>
                <td className="px-4 py-2 text-right">
                  <RenewButton contract={contract} ctx={ctx} onRenew={onRenew} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 sm:hidden" aria-label="Contracts">
        {contracts.map((contract) => (
          <li
            key={contract.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4"
          >
            {showClient && (
              <p className="text-xs text-text-muted">{clientName(contract.clientId)}</p>
            )}
            <div className="flex items-start justify-between gap-2">
              <NameButton contract={contract} onOpen={onOpen} />
              <StateBadge state={contractState(contract, ctx)} />
            </div>
            <Period contract={contract} ctx={ctx} />
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono">{formatMoney(contract.fee, contract.currency)}</span>
              <RenewButton contract={contract} ctx={ctx} onRenew={onRenew} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
