import type { Client } from '../../../shared/types';
import { FilterChip } from '../../components/ui/chip';
import { Select } from '../../components/ui/form';
import type { CashParams, TypeView } from './cashFilters';

const VIEWS: { value: TypeView; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'Inflow', label: 'Inflow' },
  { value: 'Outflow', label: 'Outflow' },
  { value: 'voided', label: 'Voided' },
];

interface EntryFiltersProps {
  params: CashParams;
  clients: Client[];
  categories: string[];
  onChange: (next: Partial<CashParams>) => void;
}

export function EntryFilters({ params, clients, categories, onChange }: EntryFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <FilterChip
            key={v.value || 'all'}
            label={v.label}
            selected={params.view === v.value}
            onSelect={() => onChange({ view: v.value })}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <label htmlFor="cash-client" className="sr-only">
          Client
        </label>
        <Select
          id="cash-client"
          value={params.client}
          onChange={(e) => onChange({ client: e.target.value })}
          className="sm:w-48"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <label htmlFor="cash-category" className="sr-only">
          Category
        </label>
        <Select
          id="cash-category"
          value={params.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="sm:w-44"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}
