'use client';

import React from 'react';
import { Template, TemplateStatus } from '../../hooks/useTemplates';

const STATUS_CONFIG: Record<TemplateStatus, { label: string; color: string; icon: string }> = {
  PENDING:   { label: 'Pendiente',   color: 'bg-gray-100 text-gray-600 border-gray-200',      icon: '⏳' },
  SUBMITTED: { label: 'En revisión', color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: '📤' },
  APPROVED:  { label: 'Aprobada',    color: 'bg-green-50 text-green-700 border-green-200',    icon: '✅' },
  REJECTED:  { label: 'Rechazada',   color: 'bg-red-50 text-red-700 border-red-200',          icon: '❌' },
  FAILED:    { label: 'Error envío', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: '⚠️' },
};

function Spinner() {
  return (
    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

interface TemplateListProps {
  templates: Template[];
  search: string;
  onSearch: (s: string) => void;
  syncing: boolean;
  onSync: () => void;
  onNew: () => void;
  resendingId: string | null;
  deletingId: string | null;
  togglingId: string | null;
  onResend: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export function TemplateList({
  templates, search, onSearch, syncing, onSync, onNew,
  resendingId, deletingId, togglingId, onResend, onDelete, onToggle,
}: TemplateListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
          />
          <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sincronizar
        </button>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E73BE] text-white rounded-xl text-xs font-black hover:opacity-90 transition-all"
        >
          + Agregar Plantilla
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center space-y-4">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-black text-gray-700 text-lg">Sin plantillas aún</p>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">Crea una plantilla, se guardará en la base de datos y se enviará a Meta para aprobación.</p>
          <button onClick={onNew} className="px-6 py-3 bg-[#1E73BE] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all">
            + Agregar Plantilla
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(t => {
            const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.PENDING;
            const isResendable = t.status === 'FAILED' || t.status === 'REJECTED' || t.status === 'SUBMITTED';
            return (
              <div key={t.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-gray-900 text-sm font-mono">{t.name}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                        t.category === 'MARKETING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        t.category === 'UTILITY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>{t.category}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {t.languageCode?.toUpperCase()} · {new Date(t.createdAt).toLocaleDateString('es-PE')}
                    </p>
                    {t.errorMessage && (
                      <p className="text-[11px] text-red-500 mt-1 bg-red-50 px-2 py-1 rounded-lg">{t.errorMessage}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      <span>{cfg.icon}</span>{cfg.label}
                    </span>
                    {isResendable && (
                      <button
                        onClick={() => onResend(t.id)}
                        disabled={resendingId === t.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50"
                      >
                        {resendingId === t.id ? <Spinner /> : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        Reenviar
                      </button>
                    )}
                    {t.status === 'APPROVED' && (
                      <button
                        onClick={() => onToggle(t.id)}
                        disabled={togglingId === t.id}
                        title="Activar / Desactivar en PlazBot"
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-[10px] font-black rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                      >
                        {togglingId === t.id ? <Spinner /> : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                          </svg>
                        )}
                        Activar
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(t.id)}
                      disabled={deletingId === t.id}
                      title="Eliminar plantilla"
                      className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                    >
                      {deletingId === t.id ? <Spinner /> : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
