'use client';

import { useId, type ReactNode } from 'react';
import { useDialog } from './useDialog';
import { CloseButton } from './CloseButton';

export type SheetProps = {
  open: boolean;
  onClose(): void;
  title?: string;
  side?: 'left' | 'right';
  children: ReactNode;
};

export function Sheet({ open, onClose, title, side = 'right', children }: SheetProps) {
  const dialog = useDialog(open, onClose);
  const titleId = useId();
  const sideClasses = side === 'right' ? 'ml-auto mr-0 open:slide-in-from-right' : 'mr-auto ml-0 open:slide-in-from-left';

  return (
    <dialog
      {...dialog}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Panel'}
      className={`my-0 h-dvh max-h-none w-full max-w-md bg-surface p-0 text-text shadow-modal backdrop:bg-black/40 open:animate-in open:duration-200 motion-reduce:open:animate-none ${sideClasses}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
          {title ? <h2 id={titleId} className="text-base font-semibold">{title}</h2> : <span />}
          <CloseButton onClose={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  );
}
