import { cn } from '../../lib/cn';

interface FilterChipProps {
  label: string;
  count?: number;
  selected: boolean;
  onSelect: () => void;
}

export function FilterChip({ label, count, selected, onSelect }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium',
        selected
          ? 'border-text bg-text text-surface'
          : 'border-border-strong bg-surface text-text hover:bg-surface-muted',
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn('font-mono', selected ? 'text-surface' : 'text-text-muted')}>
          {count}
        </span>
      )}
    </button>
  );
}
