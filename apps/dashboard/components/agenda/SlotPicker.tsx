'use client';

import { time12 } from '../../lib/agenda';

/** Horarios libres como botones grandes (pensado para el dedo en el celular). */
export function SlotPicker({ slots, value, onChange, loading }: { slots: string[]; value: string | null; onChange(t: string): void; loading?: boolean }) {
  if (loading) return <p className="text-sm text-text-muted">Buscando horarios libres...</p>;
  if (!slots.length) return <p className="text-sm text-text-muted">No hay horarios libres ese día. Prueba otro día u otra persona.</p>;
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Horarios libres">
      {slots.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          onClick={() => onChange(t)}
          className={`min-h-11 rounded-control border text-sm font-medium tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${value === t ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-text hover:border-primary'}`}
        >
          {time12(t)}
        </button>
      ))}
    </div>
  );
}
