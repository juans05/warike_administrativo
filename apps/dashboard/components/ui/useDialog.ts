'use client';

import { useEffect, useRef, type MouseEvent, type SyntheticEvent } from 'react';

/**
 * Drives a native <dialog> (focus trap, Esc, top layer for free) from an `open` prop.
 * Esc and backdrop clicks call onClose instead of closing directly, so the parent stays in control.
 */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Native modal dialogs don't lock page scroll.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return {
    ref,
    onCancel: (e: SyntheticEvent) => { e.preventDefault(); onClose(); },
    onClick: (e: MouseEvent<HTMLDialogElement>) => { if (e.target === e.currentTarget) onClose(); },
  };
}
