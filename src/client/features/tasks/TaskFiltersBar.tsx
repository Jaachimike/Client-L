import { Search } from 'lucide-react';
import type { Client, DueFilter, Status } from '../../../shared/types';
import { FilterChip } from '../../components/ui/chip';
import { Input, Select } from '../../components/ui/form';

export interface TaskFilterState {
  clientId: string;
  status: string;
  due: DueFilter;
  search: string;
}

interface TaskFiltersBarProps {
  filters: TaskFilterState;
  clients: Client[];
  statuses: Status[];
  statusCounts: Map<string, number>;
  total: number;
  onChange: (next: Partial<TaskFilterState>) => void;
}

const DUE_OPTIONS: { value: DueFilter; label: string }[] = [
  { value: 'any', label: 'Any due date' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'week', label: 'Due this week' },
  { value: 'none', label: 'No due date' },
];

export function TaskFiltersBar({
  filters,
  clients,
  statuses,
  statusCounts,
  total,
  onChange,
}: TaskFiltersBarProps) {
  const shownStatuses = statuses.filter((s) => !s.retired || (statusCounts.get(s.name) ?? 0) > 0);
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_180px]">
        <div className="relative">
          <label htmlFor="task-search" className="sr-only">
            Search tasks
          </label>
          <Search
            aria-hidden
            size={16}
            strokeWidth={1.8}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-subtle"
          />
          <Input
            id="task-search"
            type="search"
            placeholder="Search titles and descriptions"
            className="pl-9"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="task-client-filter" className="sr-only">
            Client
          </label>
          <Select
            id="task-client-filter"
            value={filters.clientId}
            onChange={(e) => onChange({ clientId: e.target.value })}
          >
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {client.archived ? ' (archived)' : ''}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="task-due-filter" className="sr-only">
            Due date
          </label>
          <Select
            id="task-due-filter"
            value={filters.due}
            onChange={(e) => {
              const option = DUE_OPTIONS.find((o) => o.value === e.target.value);
              onChange({ due: option?.value ?? 'any' });
            }}
          >
            {DUE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          count={total}
          selected={filters.status === ''}
          onSelect={() => onChange({ status: '' })}
        />
        {shownStatuses.map((status) => (
          <FilterChip
            key={status.id}
            label={status.name}
            count={statusCounts.get(status.name) ?? 0}
            selected={filters.status === status.name}
            onSelect={() => onChange({ status: filters.status === status.name ? '' : status.name })}
          />
        ))}
      </div>
    </div>
  );
}
