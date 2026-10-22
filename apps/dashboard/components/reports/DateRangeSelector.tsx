'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateRangePreset, PRESET_LABELS, PRESET_ORDER, formatDateInput } from '../../lib/date-range';
import { Button, Input, cn } from '../ui';

interface DateRangeSelectorProps {
  preset: DateRangePreset;
  onChangePreset: (preset: DateRangePreset) => void;
  customFrom: string;
  customTo: string;
  onChangeCustomFrom: (v: string) => void;
  onChangeCustomTo: (v: string) => void;
  range: { from: Date; to: Date };
}

export function DateRangeSelector({ preset, onChangePreset, customFrom, customTo, onChangeCustomFrom, onChangeCustomTo, range }: DateRangeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const rangeLabel = preset === 'custom'
    ? `${formatDateInput(range.from)} – ${formatDateInput(range.to)}`
    : PRESET_LABELS[preset];

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" icon={Calendar} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
        {rangeLabel}
        <ChevronDown size={16} aria-hidden className={cn('transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')} />
      </Button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-64 rounded-card border border-border bg-surface p-2 shadow-modal sm:left-auto sm:right-0">
          {PRESET_ORDER.filter((p) => p !== 'custom').map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={preset === p}
              onClick={() => { onChangePreset(p); setOpen(false); }}
              className={cn(
                'flex min-h-11 w-full items-center rounded-control px-3 text-left text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                preset === p ? 'bg-primary-soft text-primary-hover' : 'text-text hover:bg-background',
              )}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
          <div className="mt-2 space-y-3 border-t border-border px-1 pb-1 pt-3">
            <p className="px-2 text-xs font-medium text-text-muted">Personalizado</p>
            <div className="space-y-3 px-2">
              <Input
                label="Desde"
                type="date"
                value={customFrom}
                onChange={(e) => { onChangeCustomFrom(e.target.value); onChangePreset('custom'); }}
              />
              <Input
                label="Hasta"
                type="date"
                value={customTo}
                onChange={(e) => { onChangeCustomTo(e.target.value); onChangePreset('custom'); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
