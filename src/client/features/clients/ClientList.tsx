import { Search } from 'lucide-react';
import { useState } from 'react';
import type { Client } from '../../../shared/types';
import { Input } from '../../components/ui/form';
import { cn } from '../../lib/cn';
import { buildHref } from '../../lib/router';

interface ClientListProps {
  clients: Client[];
  selectedId: string;
  openCounts: Map<string, number>;
}

export function ClientList({ clients, selectedId, openCounts }: ClientListProps) {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const term = search.trim().toLowerCase();
  const shown = clients.filter(
    (c) =>
      (showArchived || !c.archived || c.id === selectedId) &&
      (!term || `${c.name} ${c.contactPerson} ${c.email}`.toLowerCase().includes(term)),
  );
  const archivedCount = clients.filter((c) => c.archived).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label htmlFor="client-search" className="sr-only">
          Search clients
        </label>
        <Search
          aria-hidden
          size={16}
          strokeWidth={1.8}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-subtle"
        />
        <Input
          id="client-search"
          type="search"
          placeholder="Search clients"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {archivedCount > 0 && (
        <label className="flex min-h-10 items-center gap-2 text-[13px] text-text-muted">
          <input
            type="checkbox"
            className="size-4 accent-accent"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived ({archivedCount})
        </label>
      )}
      {shown.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-text-muted">
          No clients match “{search}”.
        </p>
      ) : (
        <ul
          className="overflow-hidden rounded-xl border border-border bg-surface"
          aria-label="Clients"
        >
          {shown.map((client) => {
            const selected = client.id === selectedId;
            const open = openCounts.get(client.id) ?? 0;
            return (
              <li key={client.id} className="border-b border-border last:border-b-0">
                <a
                  href={buildHref(`/clients/${client.id}`)}
                  aria-current={selected ? 'page' : undefined}
                  className={cn(
                    'flex min-h-14 items-center justify-between gap-3 px-4 py-2',
                    selected ? 'bg-accent-tint' : 'hover:bg-surface-muted',
                  )}
                >
                  <span className="min-w-0">
                    <span className={cn('block truncate font-medium', selected && 'text-accent')}>
                      {client.name}
                    </span>
                    {client.contactPerson && (
                      <span className="block truncate text-[13px] text-text-muted">
                        {client.contactPerson}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-text-muted">
                    {client.archived ? (
                      'Archived'
                    ) : (
                      <>
                        <span className="font-mono">{open}</span> open
                      </>
                    )}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
