import { X } from 'lucide-react';

export function CloseButton({ onClose, label = 'Cerrar' }: { onClose(): void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-text-muted transition-colors duration-200 motion-reduce:transition-none hover:bg-background hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <X size={20} aria-hidden />
    </button>
  );
}
