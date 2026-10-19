'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical, type LucideIcon } from 'lucide-react';
import { Button } from '../../ui';

export type QrAction = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

/**
 * Acciones de un QR: botones con ícono desde md (hay espacio) y, en celular, un menú que se cierra
 * al elegir una opción, al tocar afuera o con Esc.
 */
export function QrRowActions({ actions }: { actions: QrAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div className="hidden shrink-0 flex-wrap justify-end gap-1 md:flex">
        {actions.map(({ label, icon, onClick }) => (
          <Button key={label} size="sm" variant="ghost" icon={icon} aria-label={label} title={label} className="w-9 px-0" onClick={onClick} />
        ))}
      </div>

      <div ref={ref} className="relative shrink-0 md:hidden">
        <Button size="sm" variant="secondary" icon={MoreVertical} aria-label="Más acciones" aria-expanded={open} className="w-9 px-0" onClick={() => setOpen((o) => !o)} />
        {open && (
          <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-card border border-border bg-surface py-1 shadow-modal">
            {actions.map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  onClick();
                  setOpen(false);
                }}
                className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-sm text-text hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
              >
                <Icon size={16} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
