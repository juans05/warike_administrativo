'use client';

import React from 'react';
import { CampaignFormData, WaNumber } from '../../hooks/useBroadcasts';
import { Template } from '../../hooks/useTemplates';

interface CampaignModalProps {
  open: boolean;
  onClose: () => void;
  form: CampaignFormData;
  onChange: React.Dispatch<React.SetStateAction<CampaignFormData>>;
  onSubmit: () => void;
  creating: boolean;
  waNumbers: WaNumber[];
  approvedTemplates: Template[];
}

export function CampaignModal({ open, onClose, form, onChange, onSubmit, creating, waNumbers, approvedTemplates }: CampaignModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Nueva Campaña WhatsApp</h3>
            <p className="text-xs text-gray-400 mt-0.5">Completa los campos para crear tu campaña</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-7 py-6 space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Nombre de la Campaña</label>
            <input
              type="text"
              value={form.campaignName}
              onChange={e => onChange(p => ({ ...p, campaignName: e.target.value }))}
              placeholder="Ej: Promo fin de semana"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Número de WhatsApp</label>
            {waNumbers.length === 0 ? (
              <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-3 rounded-xl">
                No hay números activos. Ve a PlazBot para registrar uno.
              </p>
            ) : (
              <select
                value={form.whatsappNumberId}
                onChange={e => onChange(p => ({ ...p, whatsappNumberId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              >
                <option value="">Seleccionar número...</option>
                {waNumbers.map(n => <option key={n.id} value={n.id}>{n.phoneNumber}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Plantilla a enviar</label>
            {approvedTemplates.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
                No hay plantillas aprobadas por Meta. Ve a la pestaña <strong>Plantilla</strong>, crea una y espera aprobación (24-72h).
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {approvedTemplates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChange(p => ({ ...p, templateId: t.id, templateName: t.name }))}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      form.templateId === t.id ? 'bg-orange-50 border-orange-400' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-gray-900">{t.name}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        t.category === 'MARKETING' ? 'bg-orange-100 text-orange-700' :
                        t.category === 'UTILITY' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>{t.category}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t.languageCode?.toUpperCase()}</p>
                  </button>
                ))}
              </div>
            )}
            {form.templateName && (
              <p className="text-[10px] text-orange-600 font-black mt-1.5">✓ Seleccionada: {form.templateName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Segmento de Clientes</label>
            <select
              value={form.segment}
              onChange={e => onChange(p => ({ ...p, segment: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="all">Todos los clientes</option>
              <option value="vip">Clientes VIP</option>
              <option value="inactive">Inactivos (+30 días)</option>
            </select>
          </div>
        </div>

        <div className="px-7 py-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={creating}
            className="flex-1 py-3 bg-[#F26122] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all disabled:opacity-50"
          >
            {creating ? 'Creando...' : 'Guardar Borrador'}
          </button>
        </div>
      </div>
    </div>
  );
}
