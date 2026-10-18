'use client';

import { useEffect, useRef, type MouseEvent, type SyntheticEvent } from 'react';

// Shared across all dialogs so stacked dialogs restore body scroll only when the last one closes.
let openCount = 0;
let savedOverflow = '';

/**
 * Drives a native <dialog> (focus trap, Esc, top layer for free) from an `open` prop.
 * Esc, backdrop clicks and any native close call onClose, so the parent's `open` stays in sync.
 */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (openCount++ === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (--openCount === 0) document.body.style.overflow = savedOverflow;
    };
  }, [open]);

  return {
    ref,
    onCancel: (e: SyntheticEvent) => { e.preventDefault(); onClose(); },
    onClick: (e: MouseEvent<HTMLDialogElement>) => { if (e.target === e.currentTarget) onClose(); },
    // Fires for any close (e.g. a <form method="dialog">); skipped when the parent already set open=false.
    onClose: () => { if (openRef.current) onClose(); },
  };
}
