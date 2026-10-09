'use client';

import React from 'react';
import { CampaignFormData, ContactImportItem, MetaTemplate, WaNumber } from '../../hooks/useBroadcasts';
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
  metaTemplates: MetaTemplate[];
  /** Flag del local: sin él no se muestra nada de Meta. */
  metaEnabled: boolean;
  imports: ContactImportItem[];
}

export function CampaignModal({ open, onClose, form, onChange, onSubmit, creating, waNumbers, approvedTemplates, metaTemplates, metaEnabled, imports }: CampaignModalProps) {
  if (!open) return null;

  // El número elegido decide de dónde salen las plantillas: la cuenta de Meta o PlazBot.
  const selected = waNumbers.find(n => n.id === form.whatsappNumberId);
  const useMeta = metaEnabled && selected?.provider === 'meta';
  const approvedMeta = metaTemplates.filter(t => t.status === 'APPROVED');
  const chosenMeta = useMeta ? approvedMeta.find(t => t.name === form.templateName) : undefined;

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
                onChange={e => onChange(p => ({ ...p, whatsappNumberId: e.target.value, templateId: '', templateName: '', bodyVariables: [], segment: 'all' }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              >
                <option value="">Seleccionar número...</option>
                {waNumbers.map(n => <option key={n.id} value={n.id}>{n.phoneNumber}{metaEnabled ? (n.provider === 'meta' ? ' · API de Meta' : ' · PlazBot') : ''}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Plantilla a enviar</label>
            {useMeta ? (
              approvedMeta.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
                  No hay plantillas <strong>aprobadas</strong> en tu cuenta de WhatsApp. Créalas en la pestaña <strong>Plantilla</strong> y espera la aprobación de Meta.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {approvedMeta.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChange(p => ({ ...p, templateId: t.id, templateName: t.name, templateLanguage: t.language, bodyVariables: Array.from({ length: t.variableCount }, () => '') }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${form.templateName === t.name ? 'bg-orange-50 border-orange-400' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <span className="text-sm font-black text-gray-900">{t.name}</span>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.body}</p>
                    </button>
                  ))}
                </div>
              )
            ) : approvedTemplates.length === 0 ? (
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
            {chosenMeta && chosenMeta.variableCount > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valores de las variables (usa {'{nombre}'} para el nombre del cliente)</p>
                {form.bodyVariables.map((v, i) => (
                  <input
                    key={i}
                    value={v}
                    onChange={e => onChange(p => ({ ...p, bodyVariables: p.bodyVariables.map((x, j) => (j === i ? e.target.value : x)) }))}
                    placeholder={`{{${i + 1}}}  ej. ${i === 0 ? '{nombre}' : 'ceviches'}`}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  />
                ))}
              </div>
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
              {useMeta ? (
                <>
                  <option value="excel">Lista de Excel (elegir cuál)</option>
                  <option value="loyalty">Fidelización (por nivel)</option>
                  <option value="inactive">Inactivos: sin visitar hace 30 días</option>
                  <option value="normal">Clientes sin tarjeta de fidelización</option>
                </>
              ) : (
                <>
                  <option value="vip">Clientes VIP</option>
                  <option value="inactive">Inactivos (+30 días)</option>
                </>
              )}
            </select>

            {useMeta && form.segment === 'excel' && (
              <div className="mt-3">
                {imports.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    Todavía no subiste ninguna lista de Excel. Súbela en <strong>Clientes CRM</strong> y vuelve aquí.
                  </p>
                ) : (
                  <select
                    value={form.csvImportId}
                    onChange={e => onChange(p => ({ ...p, csvImportId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  >
                    <option value="">Elige la lista...</option>
                    {imports.map(i => <option key={i.id} value={i.id}>{i.filename} · {i.importedRows} contactos</option>)}
                  </select>
                )}
              </div>
            )}

            {useMeta && form.segment === 'loyalty' && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Niveles (sin marcar = todos)</p>
                <div className="flex flex-wrap gap-2">
                  {['BRONCE', 'PLATA', 'ORO', 'VIP'].map(l => {
                    const on = form.levels.includes(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => onChange(p => ({ ...p, levels: on ? p.levels.filter(x => x !== l) : [...p.levels, l] }))}
                        className={`px-4 py-2 rounded-xl border text-xs font-black transition-all ${on ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {useMeta && (form.segment === 'loyalty' || form.segment === 'inactive') && (
              <p className="mt-3 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 leading-relaxed">
                Solo reciben quienes <strong>aceptaron recibir promociones</strong> al unirse a la fidelización. Quienes se unieron antes de que existiera esa casilla no aparecen hasta que la marquen en su próxima visita.
              </p>
            )}
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
