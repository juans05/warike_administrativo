'use client';

import React, { useState } from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/report-colors';
import type { ConversationBucket } from '../../hooks/useReports';

const ALL_STATUSES: ConversationBucket[] = ['attended', 'unassigned', 'pending', 'resolved'];

interface FiltersPanelProps {
  statusFilter: ConversationBucket[];
  onChangeStatusFilter: (statuses: ConversationBucket[]) => void;
}

export function FiltersPanel({ statusFilter, onChangeStatusFilter }: FiltersPanelProps) {
  const [open, setOpen] = useState(false);

  const toggleStatus = (status: ConversationBucket) => {
    onChangeStatusFilter(
      statusFilter.includes(status) ? statusFilter.filter(s => s !== status) : [...statusFilter, status],
    );
  };

  const clearAll = () => onChangeStatusFilter([]);
  const hasActiveFilters = statusFilter.length > 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5"
      >
        <span className="flex items-center gap-2 text-sm font-black text-gray-900">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {hasActiveFilters && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#F26122] text-white">{statusFilter.length}</span>
          )}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-gray-100 pt-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Estado de conversación</p>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map(status => {
              const active = statusFilter.includes(status);
              const c = STATUS_COLORS[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    active ? `${c.bg} ${c.text} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Filtra la tabla de "Conversaciones por teléfono" abajo. El rango de fechas del encabezado sigue controlando el resto de los indicadores.</p>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
              <span className="text-[11px] text-gray-400 font-bold">Filtros activos:</span>
              {statusFilter.map(s => (
                <span key={s} className="text-[10px] font-black px-2 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                  {STATUS_LABELS[s]}
                  <button type="button" onClick={() => toggleStatus(s)} className="hover:text-gray-900">×</button>
                </span>
              ))}
              <button type="button" onClick={clearAll} className="text-[11px] font-black text-[#F26122] hover:underline ml-auto">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
