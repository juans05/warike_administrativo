'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DateRangePreset, PRESET_LABELS, PRESET_ORDER, formatDateInput } from '../../lib/date-range';

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
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const rangeLabel = preset === 'custom'
    ? `${formatDateInput(range.from)} – ${formatDateInput(range.to)}`
    : PRESET_LABELS[preset];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {rangeLabel}
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 p-2">
          {PRESET_ORDER.filter(p => p !== 'custom').map(p => (
            <button
              key={p}
              type="button"
              onClick={() => { onChangePreset(p); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                preset === p ? 'bg-orange-50 text-[#F26122]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 px-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Personalizado</p>
            <div className="flex flex-col gap-2 px-2">
              <input
                type="date"
                value={customFrom}
                onChange={e => { onChangeCustomFrom(e.target.value); onChangePreset('custom'); }}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
              />
              <input
                type="date"
                value={customTo}
                onChange={e => { onChangeCustomTo(e.target.value); onChangePreset('custom'); }}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
