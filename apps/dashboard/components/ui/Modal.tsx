'use client';

import { useId, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useDialog } from './useDialog';

export type ModalProps = {
  open: boolean;
  onClose(): void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const dialog = useDialog(open, onClose);
  const titleId = useId();

  return (
    <dialog
      {...dialog}
      aria-labelledby={titleId}
      className="w-[calc(100%-2rem)] max-w-lg rounded-card bg-surface p-0 text-text shadow-modal backdrop:bg-black/40 open:animate-in open:fade-in open:zoom-in-95 open:duration-200 motion-reduce:open:animate-none"
    >
      {/* Inner wrapper fills the dialog so only real backdrop clicks hit the dialog element. */}
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-2">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <CloseButton onClose={onClose} />
        </div>
        <div className="overflow-y-auto px-5 py-4 text-sm">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </dialog>
  );
}

export function CloseButton({ onClose }: { onClose(): void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar"
      className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-text-muted transition-colors duration-200 motion-reduce:transition-none hover:bg-background hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <X size={20} aria-hidden />
    </button>
  );
}
