import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatDisplayDate } from '../../../shared/dates';
import type { Transaction } from '../../../shared/types';
import { cn } from '../../lib/cn';
import { formatMoney } from '../../lib/money';

interface EntryListProps {
  entries: Transaction[];
  clientName: (id: string) => string;
  onOpen: (entry: Transaction) => void;
}

function Amount({ entry }: { entry: Transaction }) {
  const inflow = entry.type === 'Inflow';
  const Icon = inflow ? ArrowDownLeft : ArrowUpRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono whitespace-nowrap',
        inflow ? 'text-success' : 'text-outflow-text',
        entry.voided && 'line-through opacity-70',
      )}
    >
      <Icon aria-hidden size={14} strokeWidth={2} />
      <span className="sr-only">{entry.type}</span>
      {formatMoney(entry.amount, entry.currency)}
    </span>
  );
}

function Title({ entry, onOpen }: { entry: Transaction; onOpen: (e: Transaction) => void }) {
  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="text-left font-medium hover:text-accent hover:underline"
      >
        {entry.description}
      </button>
      {entry.reference && <p className="text-xs break-words text-text-muted">{entry.reference}</p>}
      {entry.voided && <p className="text-xs font-medium text-text-muted">Voided</p>}
    </div>
  );
}

export function EntryList({ entries, clientName, onOpen }: EntryListProps) {
  const client = (id: string) => (id ? clientName(id) : '—');
  const date = (iso: string) => (iso ? formatDisplayDate(iso) : 'No date');
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface sm:block">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-surface-muted text-xs tracking-[0.04em] text-text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Date
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Description
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Client
              </th>
              <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">
                Category
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-border align-top">
                <td
                  className={cn(
                    'px-4 py-3 font-mono text-[13px] whitespace-nowrap',
                    !entry.date && 'text-text-subtle',
                  )}
                >
                  {date(entry.date)}
                </td>
                <td className="max-w-md px-4 py-3">
                  <Title entry={entry} onOpen={onOpen} />
                </td>
                <td className="px-4 py-3 text-text-muted">{client(entry.clientId)}</td>
                <td className="hidden px-4 py-3 text-text-muted lg:table-cell">
                  {entry.category || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Amount entry={entry} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 sm:hidden" aria-label="Entries">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <Title entry={entry} onOpen={onOpen} />
              <Amount entry={entry} />
            </div>
            <p className="text-xs text-text-muted">
              {date(entry.date)} · {client(entry.clientId)}
              {entry.category && ` · ${entry.category}`}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
