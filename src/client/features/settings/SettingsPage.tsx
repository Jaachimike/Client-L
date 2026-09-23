import { useMemo } from 'react';
import { countByStatus } from '../../../shared/tasks';
import type { Bootstrap } from '../../../shared/types';
import { PageHeader } from '../../components/PageHeader';
import { ErrorState, LoadingState } from '../../components/ui/feedback';
import { errorMessage } from '../../lib/api';
import { useTasks } from '../../lib/queries';
import { AccessList } from './AccessList';
import { StatusEditor } from './StatusEditor';

export function SettingsPage({ bootstrap }: { bootstrap: Bootstrap }) {
  const tasksQuery = useTasks();
  const usage = useMemo(() => countByStatus(tasksQuery.data ?? []), [tasksQuery.data]);

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {tasksQuery.isPending ? (
          <LoadingState label="Loading statuses…" />
        ) : tasksQuery.isError ? (
          <ErrorState
            message={errorMessage(tasksQuery.error)}
            onRetry={() => void tasksQuery.refetch()}
          />
        ) : (
          <StatusEditor statuses={bootstrap.statuses} usage={usage} />
        )}
        <div className="flex flex-col gap-5">
          <AccessList allowedEmails={bootstrap.allowedEmails} ownEmail={bootstrap.email} />
          <section className="rounded-xl border border-border bg-surface p-5 text-[13px] text-text-muted sm:p-6">
            <h2 className="mb-1 font-heading text-2xl font-semibold text-text">
              Warnings and defaults
            </h2>
            Default currency, the expiry warning window and the app name live in the Settings tab of
            the sheet.
          </section>
        </div>
      </div>
    </>
  );
}
