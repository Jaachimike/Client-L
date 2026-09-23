import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';

export function StatusBanner({
  children,
  onDismiss,
}: {
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl border border-border bg-success-tint px-4 py-3 text-success"
    >
      <CheckCircle2 aria-hidden size={18} strokeWidth={1.8} />
      <p className="flex-1">{children}</p>
      {onDismiss && (
        <Button variant="ghost" size="dense" onClick={onDismiss}>
          Dismiss
        </Button>
      )}
    </div>
  );
}

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-danger-tint px-3 py-2 text-[13px] text-danger"
    >
      <AlertCircle aria-hidden size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-text-muted">{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <p
      role="status"
      className="rounded-xl border border-border bg-surface px-6 py-10 text-center text-text-muted"
    >
      {label}
    </p>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-6">
      <ErrorAlert>{message}</ErrorAlert>
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
