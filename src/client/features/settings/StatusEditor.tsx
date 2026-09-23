import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Status } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert, StatusBanner } from '../../components/ui/feedback';
import { Input } from '../../components/ui/form';
import { StatusPill } from '../../components/ui/status-pill';
import { errorMessage } from '../../lib/api';
import { useSaveStatuses } from '../../lib/queries';

interface StatusEditorProps {
  statuses: Status[];
  usage: Map<string, number>;
}

function newStatus(): Status {
  return { id: crypto.randomUUID(), name: '', color: '#7A4209', done: false, retired: false };
}

export function StatusEditor({ statuses, usage }: StatusEditorProps) {
  const save = useSaveStatuses();
  const [draft, setDraft] = useState<Status[]>(statuses);
  const [saved, setSaved] = useState(false);

  const update = (index: number, patch: Partial<Status>) => {
    setSaved(false);
    setDraft((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };
  const move = (index: number, offset: number) => {
    setSaved(false);
    setDraft((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      if (item) next.splice(index + offset, 0, item);
      return next;
    });
  };
  const remove = (index: number) => {
    setSaved(false);
    setDraft((list) => list.filter((_, i) => i !== index));
  };
  const usedBy = (status: Status) =>
    usage.get(statuses.find((s) => s.id === status.id)?.name ?? '') ?? 0;

  return (
    <section
      aria-labelledby="statuses-heading"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <div>
        <h2 id="statuses-heading" className="font-heading text-2xl font-semibold">
          Task statuses
        </h2>
        <p className="mt-1 text-[13px] text-text-muted">
          The order here is the order in every status menu. Retired statuses stay on existing tasks
          but cannot be picked for others.
        </p>
      </div>
      <ol className="flex flex-col gap-3">
        {draft.map((status, index) => {
          const inUse = usedBy(status);
          const label = status.name || 'New status';
          return (
            <li key={status.id} className="flex flex-col gap-3 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`status-color-${status.id}`}>
                  Colour for {label}
                </label>
                <input
                  id={`status-color-${status.id}`}
                  type="color"
                  value={status.color}
                  onChange={(e) => update(index, { color: e.target.value.toUpperCase() })}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-border-strong bg-surface p-1"
                />
                <label className="sr-only" htmlFor={`status-name-${status.id}`}>
                  Name for status {index + 1}
                </label>
                <Input
                  id={`status-name-${status.id}`}
                  value={status.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                  className="min-w-0 flex-1"
                />
                <StatusPill name={label} statuses={[{ ...status, name: label }]} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex min-h-10 items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    className="size-4 accent-accent"
                    checked={status.done}
                    onChange={(e) => update(index, { done: e.target.checked })}
                  />
                  Counts as done
                </label>
                <label className="flex min-h-10 items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    className="size-4 accent-accent"
                    checked={status.retired}
                    onChange={(e) => update(index, { retired: e.target.checked })}
                  />
                  Retired
                </label>
                <span className="text-xs text-text-muted">
                  {inUse === 1 ? 'Used by 1 task' : `Used by ${inUse} tasks`}
                </span>
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${label} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp aria-hidden size={18} strokeWidth={1.8} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${label} down`}
                    disabled={index === draft.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown aria-hidden size={18} strokeWidth={1.8} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={
                      inUse > 0
                        ? `${label} is in use and cannot be deleted; retire it instead`
                        : `Delete ${label}`
                    }
                    disabled={inUse > 0}
                    onClick={() => remove(index)}
                  >
                    <Trash2 aria-hidden size={18} strokeWidth={1.8} />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-col gap-3">
        {save.isError && <ErrorAlert>{errorMessage(save.error)}</ErrorAlert>}
        {saved && <StatusBanner>Statuses saved.</StatusBanner>}
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="secondary" onClick={() => setDraft((list) => [...list, newStatus()])}>
            <Plus aria-hidden size={18} strokeWidth={2} /> Add status
          </Button>
          <Button
            disabled={save.isPending}
            onClick={() =>
              save.mutate(
                draft.map((s) => ({ ...s, name: s.name.trim() })),
                {
                  onSuccess: (list) => {
                    setDraft(list);
                    setSaved(true);
                  },
                },
              )
            }
          >
            {save.isPending ? 'Saving…' : 'Save statuses'}
          </Button>
        </div>
      </div>
    </section>
  );
}
