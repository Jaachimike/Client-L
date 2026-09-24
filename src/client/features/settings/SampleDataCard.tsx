import { useState } from 'react';
import type { SampleSummary } from '../../../shared/api';
import { Button } from '../../components/ui/button';
import { ErrorAlert, StatusBanner } from '../../components/ui/feedback';
import { errorMessage } from '../../lib/api';
import { useSampleData } from '../../lib/sampleQueries';

function describe(counts: SampleSummary): string {
  return `${counts.clients} clients, ${counts.tasks} tasks, ${counts.contracts} contracts, ${counts.subscriptions} subscriptions and ${counts.transactions} cash flow entries`;
}

export function SampleDataCard({ hasSampleData }: { hasSampleData: boolean }) {
  const { add, clear } = useSampleData();
  const [message, setMessage] = useState('');
  const failure = add.error ?? clear.error;
  const busy = add.isPending || clear.isPending;

  return (
    <section
      aria-labelledby="sample-heading"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <h2 id="sample-heading" className="font-heading text-2xl font-semibold">
        Sample data
      </h2>
      <p className="text-[13px] text-text-muted">
        Fill every tab with made-up clients, tasks, contracts, subscriptions and payments to see how
        the app works. Clearing removes only the sample records; anything you added yourself stays.
      </p>
      {failure && <ErrorAlert>{errorMessage(failure)}</ErrorAlert>}
      {message && <StatusBanner>{message}</StatusBanner>}
      <div className="flex flex-wrap gap-2">
        {hasSampleData ? (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() =>
              clear.mutate(undefined, { onSuccess: (c) => setMessage(`Removed ${describe(c)}.`) })
            }
          >
            {clear.isPending ? 'Clearing…' : 'Clear sample data'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              add.mutate(undefined, { onSuccess: (c) => setMessage(`Added ${describe(c)}.`) })
            }
          >
            {add.isPending ? 'Adding…' : 'Add sample data'}
          </Button>
        )}
      </div>
    </section>
  );
}
