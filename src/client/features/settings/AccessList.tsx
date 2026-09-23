import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/button';
import { ErrorAlert, StatusBanner } from '../../components/ui/feedback';
import { describedBy, Field, Input } from '../../components/ui/form';
import { errorMessage } from '../../lib/api';
import { useSaveAllowedEmails } from '../../lib/queries';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GMAIL_NOTE =
  'Google may not share the email of personal Gmail accounts other than yours with this app, so those people can be denied even when listed. Accounts on your own Google Workspace domain work.';

export function AccessList({
  allowedEmails,
  ownEmail,
}: {
  allowedEmails: string[];
  ownEmail: string;
}) {
  const save = useSaveAllowedEmails();
  const [draft, setDraft] = useState('');
  const [inputError, setInputError] = useState('');
  const [message, setMessage] = useState('');
  const own = ownEmail.toLowerCase();

  const commit = (emails: string[], done: string) => {
    setMessage('');
    save.mutate(emails, { onSuccess: () => setMessage(done) });
  };

  const add = (event: FormEvent) => {
    event.preventDefault();
    const email = draft.trim().toLowerCase();
    if (!EMAIL.test(email))
      return setInputError('Enter a full email address, such as name@example.com.');
    if (allowedEmails.includes(email)) return setInputError(`${email} is already on the list.`);
    setInputError('');
    setDraft('');
    commit([...allowedEmails, email], `${email} can now open the app on their next visit.`);
  };

  return (
    <section
      aria-labelledby="access-heading"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <div>
        <h2 id="access-heading" className="font-heading text-2xl font-semibold">
          Access
        </h2>
        <p className="mt-1 text-[13px] text-text-muted">
          Only these Google accounts can open the app. Changes apply on the next page load.
        </p>
      </div>
      <ul
        className="flex flex-col divide-y divide-border rounded-lg border border-border"
        aria-label="Allowed emails"
      >
        {allowedEmails.map((email) => (
          <li key={email} className="flex min-h-12 items-center justify-between gap-2 px-3">
            <span className="min-w-0 truncate">
              {email}
              {email === own && <span className="ml-2 text-xs text-text-muted">(you)</span>}
            </span>
            {email !== own && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${email}`}
                disabled={save.isPending}
                onClick={() =>
                  commit(
                    allowedEmails.filter((e) => e !== email),
                    `${email} removed.`,
                  )
                }
              >
                <X aria-hidden size={18} strokeWidth={1.8} />
              </Button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} noValidate className="flex flex-col gap-2">
        <Field id="allow-email" label="Add an email" error={inputError}>
          <div className="flex gap-2">
            <Input
              id="allow-email"
              type="email"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-invalid={Boolean(inputError)}
              aria-describedby={describedBy('allow-email', inputError)}
            />
            <Button type="submit" variant="secondary" disabled={save.isPending}>
              Add
            </Button>
          </div>
        </Field>
      </form>
      {save.isError && <ErrorAlert>{errorMessage(save.error)}</ErrorAlert>}
      {message && <StatusBanner>{message}</StatusBanner>}
      <p className="rounded-lg bg-warning-tint px-3 py-2 text-[13px] text-warning">{GMAIL_NOTE}</p>
    </section>
  );
}
