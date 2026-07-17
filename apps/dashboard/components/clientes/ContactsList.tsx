'use client';

import React from 'react';
import { Contact } from '../../lib/api-client';
import { maskPhone } from '../../lib/mask';

const SOURCE_LABEL: Record<Contact['source'], string> = {
  whatsapp: '💬 WhatsApp',
  feedback: '💭 Feedback',
  import: '📤 Importado',
};

interface ContactsListProps {
  contacts: Contact[];
  meta: { total: number; page: number; totalPages: number };
  loading: boolean;
  onPageChange: (page: number) => void;
  onNew: () => void;
}

export function ContactsList({ contacts, meta, loading, onPageChange, onNew }: ContactsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-800">Contactos ({meta.total})</h2>
        <button onClick={onNew} className="px-5 py-2.5 bg-[#F26122] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all">
          📤 Subir Clientes
        </button>
      </div>

      {loading ? (
        <div className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
      ) : contacts.length === 0 ? (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-16 text-center space-y-3">
          <p className="text-5xl">👥</p>
          <p className="font-black text-gray-700 text-lg">No hay contactos aún</p>
          <p className="text-sm text-gray-400">Sube un archivo con tu base de clientes para empezar</p>
          <button onClick={onNew} className="mt-2 px-6 py-3 bg-[#F26122] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all">
            📤 Subir Clientes
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Nombre</th>
                  <th className="px-5 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Celular</th>
                  <th className="px-5 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                  <th className="px-5 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">DNI</th>
                  <th className="px-5 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Origen</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-bold text-gray-900">{c.name || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{c.phone ? maskPhone(c.phone) : '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{c.email || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{c.dni || '—'}</td>
                    <td className="px-5 py-3 text-xs font-bold text-gray-500">{SOURCE_LABEL[c.source]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => onPageChange(Math.max(1, meta.page - 1))} disabled={meta.page === 1} className="px-5 py-3 rounded-xl bg-white border border-border font-black text-xs disabled:opacity-40">← Anterior</button>
              <span className="px-5 py-3 font-black text-xs text-text-muted">{meta.page} / {meta.totalPages}</span>
              <button onClick={() => onPageChange(Math.min(meta.totalPages, meta.page + 1))} disabled={meta.page === meta.totalPages} className="px-5 py-3 rounded-xl bg-white border border-border font-black text-xs disabled:opacity-40">Siguiente →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
