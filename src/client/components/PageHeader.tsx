import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './ui/button';

interface PageHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

/** Page title with the screen's one primary action: top right on wider screens, a floating + on phones. */
export function PageHeader({ title, actionLabel, onAction, children }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-heading text-[32px] leading-tight font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        {children}
        {actionLabel && onAction && (
          <>
            <Button onClick={onAction} className="hidden sm:inline-flex">
              <Plus aria-hidden size={18} strokeWidth={2} />
              {actionLabel}
            </Button>
            <Button
              onClick={onAction}
              aria-label={actionLabel}
              className="fixed right-4 bottom-20 z-30 size-14 rounded-full p-0 shadow-lg sm:hidden"
            >
              <Plus aria-hidden size={24} strokeWidth={2} />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
