import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { Button } from './button';

interface SidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Slides in from the right. Radix traps focus and closes on Escape; because panels are opened
 * from many buttons rather than one Dialog.Trigger, focus is returned to the opener here.
 */
export function SidePanel({ open, onOpenChange, title, description, children }: SidePanelProps) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-text/30" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col overflow-y-auto bg-surface p-6 shadow-2xl"
          onOpenAutoFocus={() => {
            opener.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            if (opener.current?.isConnected) {
              event.preventDefault();
              opener.current.focus();
            }
          }}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-heading text-2xl font-semibold">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-[13px] text-text-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close panel">
                <X aria-hidden size={20} strokeWidth={1.8} />
              </Button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
