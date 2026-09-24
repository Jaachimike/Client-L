import { useState, type ChangeEvent } from 'react';
import type { ImportResult } from '../../../shared/api';
import { duplicateKey } from '../../../shared/cashflow';
import { previewImport, type ImportPreview } from '../../../shared/importPreview';
import type { Bootstrap, Client, Transaction } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert } from '../../components/ui/feedback';
import { Field } from '../../components/ui/form';
import { errorMessage } from '../../lib/api';
import { useImportTransactions } from '../../lib/cashQueries';
import { formatMoney } from '../../lib/money';

interface ImportPanelProps {
  bootstrap: Bootstrap;
  clients: Client[];
  transactions: Transaction[];
  onImported: (result: ImportResult, skipped: number) => void;
  onCancel: () => void;
}

function totalsByCurrency(preview: Extract<ImportPreview, { ok: true }>): string[] {
  const byCurrency = new Map<string, { inflow: number; outflow: number }>();
  for (const row of preview.rows) {
    const t = byCurrency.get(row.currency) ?? { inflow: 0, outflow: 0 };
    if (row.type === 'Inflow') t.inflow += row.amount;
    else t.outflow += row.amount;
    byCurrency.set(row.currency, t);
  }
  return [...byCurrency].map(
    ([code, t]) => `${formatMoney(t.inflow, code)} in, ${formatMoney(t.outflow, code)} out`,
  );
}

/** Reads a CSV in the browser and shows exactly what will happen before anything is saved. */
export function ImportPanel({
  bootstrap,
  clients,
  transactions,
  onImported,
  onCancel,
}: ImportPanelProps) {
  const importRows = useImportTransactions();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState('');

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPreview(
      previewImport(await file.text(), {
        defaultCurrency: bootstrap.defaultCurrency,
        existingClientNames: clients.map((c) => c.name),
        existingKeys: new Set(transactions.map(duplicateKey)),
      }),
    );
  };

  const confirm = () => {
    if (!preview?.ok) return;
    importRows.mutate(preview.rows, {
      onSuccess: (result) => onImported(result, preview.skipped.length),
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-[13px] text-text-muted">
        Export your sheet as CSV (File &gt; Download &gt; Comma-separated values) and choose it
        here. Columns are matched by their headers: Description, Inflow, Outflow, Project Name or
        Client, Date (day first) and Comments.
      </p>
      <Field id="import-file" label="CSV file">
        <input
          id="import-file"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void onFile(e)}
          className="text-[13px] file:mr-3 file:min-h-10 file:rounded-lg file:border file:border-border-strong file:bg-surface file:px-3 file:font-medium"
        />
      </Field>
      {preview && !preview.ok && <ErrorAlert>{preview.message}</ErrorAlert>}
      {preview?.ok && (
        <section
          aria-label={`Preview of ${fileName}`}
          className="flex flex-col gap-3 rounded-lg border border-border p-3 text-[13px]"
        >
          <p>
            <span className="font-semibold">{preview.rows.length}</span>{' '}
            {preview.rows.length === 1 ? 'entry' : 'entries'} will be added
            {preview.rows.filter((r) => !r.date).length > 0 &&
              ` (${preview.rows.filter((r) => !r.date).length} without a date)`}
            .
          </p>
          {totalsByCurrency(preview).map((line) => (
            <p key={line} className="font-mono">
              {line}
            </p>
          ))}
          {preview.newClients.length > 0 && (
            <div>
              <p className="font-medium">
                {preview.newClients.length} new{' '}
                {preview.newClients.length === 1 ? 'client' : 'clients'} will be created:
              </p>
              <p className="text-text-muted">{preview.newClients.join(', ')}</p>
            </div>
          )}
          {preview.skipped.length > 0 && (
            <div>
              <p className="font-medium">
                {preview.skipped.length} {preview.skipped.length === 1 ? 'row' : 'rows'} will be
                skipped:
              </p>
              <ul className="mt-1 flex flex-col gap-1" aria-label="Skipped rows">
                {preview.skipped.map((s) => (
                  <li key={s.line}>
                    <span className="font-mono">Row {s.line}</span>: {s.reason}
                    {s.text.replace(/[,\s]/g, '') && (
                      <span className="block truncate text-text-muted">{s.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
      <div className="mt-auto flex flex-col gap-3 pt-4">
        {importRows.isError && <ErrorAlert>{errorMessage(importRows.error)}</ErrorAlert>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={!preview?.ok || preview.rows.length === 0 || importRows.isPending}
          >
            {importRows.isPending
              ? 'Importing…'
              : preview?.ok
                ? `Import ${preview.rows.length} ${preview.rows.length === 1 ? 'entry' : 'entries'}`
                : 'Import'}
          </Button>
        </div>
      </div>
    </div>
  );
}
