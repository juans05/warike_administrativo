'use client';

import React from 'react';
import {
  TemplateFormData, TemplateStep, TemplateCategory,
} from '../../hooks/useTemplates';

const STEPS: TemplateStep[] = ['info', 'message', 'buttons'];
const STEP_LABELS: Record<TemplateStep, string> = { info: 'Plantilla', message: 'Mensaje', buttons: 'Botones' };

const CATEGORY_INFO: Record<TemplateCategory, { icon: string; color: string; desc: string; example: string }> = {
  MARKETING: {
    icon: '📣', color: 'amber',
    desc: 'Para promociones, ofertas, descuentos y anuncios comerciales.',
    example: '¡Hola {{1}}! Esta semana 2x1 en ceviche. Ven a El Huarique y disfruta.',
  },
  UTILITY: {
    icon: '🔧', color: 'blue',
    desc: 'Para confirmaciones, recordatorios y actualizaciones de pedidos/reservas.',
    example: '{{1}}, tu reserva para {{2}} personas el {{3}} está confirmada. ¡Te esperamos!',
  },
  AUTHENTICATION: {
    icon: '🔒', color: 'purple',
    desc: 'Para códigos de verificación de un solo uso (OTP). Raramente necesario en restaurantes.',
    example: 'Tu código de verificación de El Huarique es: {{1}}. Caduca en 10 minutos.',
  },
};

const VARIABLE_TYPES = [
  'Nombre del contacto', 'Teléfono del contacto', 'Celular del contacto',
  'Email del contacto', 'País del contacto', 'Nombre del agente',
];

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  step: TemplateStep;
  onStep: (step: TemplateStep) => void;
  form: TemplateFormData;
  onChange: React.Dispatch<React.SetStateAction<TemplateFormData>>;
  onSubmit: () => void;
  creating: boolean;
  bodyVariables: (body: string) => number[];
  addVariable: () => void;
  removeVariable: (n: number) => void;
}

export function TemplateModal({
  open, onClose, step, onStep, form, onChange, onSubmit, creating,
  bodyVariables, addVariable, removeVariable,
}: TemplateModalProps) {
  if (!open) return null;

  const vars = bodyVariables(form.body);
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    blue:  'bg-blue-50 border-blue-200 text-blue-800',
    purple:'bg-purple-50 border-purple-200 text-purple-800',
  };
  const exColorMap: Record<string, string> = {
    amber: 'bg-amber-100/60 text-amber-700',
    blue:  'bg-blue-100/60 text-blue-700',
    purple:'bg-purple-100/60 text-purple-700',
  };
  const catInfo = CATEGORY_INFO[form.category];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-black text-gray-900">Nueva Plantilla de WhatsApp</h3>
            <p className="text-xs text-gray-400 mt-0.5">Completa los campos para comenzar</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar de pasos */}
          <div className="w-44 border-r border-gray-100 py-4 shrink-0 overflow-y-auto">
            {STEPS.map(s => (
              <button
                key={s}
                onClick={() => onStep(s)}
                className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-colors border-r-2 ${
                  step === s ? 'bg-blue-50 text-blue-700 border-blue-600' : 'text-gray-500 hover:bg-gray-50 border-transparent'
                }`}
              >
                {STEP_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Formulario central */}
          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

            {/* Paso 1: Info */}
            {step === 'info' && <>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Nombre de la Plantilla</label>
                <input
                  type="text"
                  value={form.elementName}
                  onChange={e => onChange(p => ({ ...p, elementName: e.target.value.replace(/\s+/g, '_').toLowerCase() }))}
                  placeholder="promo_fin_semana"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Solo minúsculas y guiones bajos.</p>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Categoría</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(['MARKETING', 'UTILITY', 'AUTHENTICATION'] as TemplateCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => onChange(p => ({ ...p, category: cat }))}
                      className={`py-3 px-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                        form.category === cat ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {CATEGORY_INFO[cat].icon} {cat === 'AUTHENTICATION' ? 'Auth' : cat === 'UTILITY' ? 'Utilidad' : 'Marketing'}
                    </button>
                  ))}
                </div>
                <div className={`rounded-xl border px-4 py-3 space-y-1.5 ${colorMap[catInfo.color]}`}>
                  <p className="text-xs font-black">{catInfo.icon} {form.category === 'AUTHENTICATION' ? 'Autenticación' : form.category === 'UTILITY' ? 'Utilidad' : 'Marketing'}</p>
                  <p className="text-xs font-medium leading-relaxed">{catInfo.desc}</p>
                  <div className={`rounded-lg px-3 py-2 mt-1 ${exColorMap[catInfo.color]}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">Ejemplo:</p>
                    <p className="text-xs italic leading-relaxed">"{catInfo.example}"</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Idioma</label>
                <select
                  value={form.language}
                  onChange={e => onChange(p => ({ ...p, language: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="pt_BR">Portugués (Brasil)</option>
                </select>
              </div>
            </>}

            {/* Paso 2: Mensaje */}
            {step === 'message' && <>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Encabezado <span className="normal-case font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.headerText}
                  onChange={e => onChange(p => ({ ...p, headerText: e.target.value }))}
                  placeholder="Título del mensaje"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-1">Cuerpo del Mensaje</label>
                <p className="text-xs text-gray-400 mb-2">Ingresa el texto para tu mensaje.</p>
                <div className="relative border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-400">
                  <textarea
                    value={form.body}
                    onChange={e => onChange(p => ({ ...p, body: e.target.value }))}
                    placeholder="Hola {{1}}, tenemos una oferta especial para ti hoy..."
                    rows={5}
                    maxLength={1024}
                    className="w-full px-4 pt-3 pb-8 text-sm outline-none resize-none rounded-xl"
                  />
                  <div className="absolute bottom-2 right-3 text-[10px] text-gray-400 font-mono">
                    {form.body.length} / 1024
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addVariable}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-black text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar variable
                </button>
                {vars.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {vars.map(n => (
                      <span key={n} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-black text-blue-700">
                        {`{{${n}}}`}
                        <button type="button" onClick={() => removeVariable(n)} className="text-blue-400 hover:text-red-500 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {vars.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-black text-gray-700">Valor de muestra para las variables</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">💡</span>
                      <p className="text-xs text-amber-700 leading-relaxed">Los valores de muestra ayudan a WhatsApp a evaluar y aprobar tu plantilla rápidamente.</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Variables del Cuerpo</p>
                      {vars.map(n => (
                        <div key={n} className="flex items-center gap-2">
                          <span className="shrink-0 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-black text-blue-700 font-mono">{`{{${n}}}`}</span>
                          <input
                            type="text"
                            placeholder="Ingresa el valor de muestra"
                            value={form.variableSamples[n]?.value || ''}
                            onChange={e => onChange(p => ({
                              ...p,
                              variableSamples: { ...p.variableSamples, [n]: { ...p.variableSamples[n], value: e.target.value, type: p.variableSamples[n]?.type || '' } },
                            }))}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                          <select
                            value={form.variableSamples[n]?.type || ''}
                            onChange={e => onChange(p => ({
                              ...p,
                              variableSamples: { ...p.variableSamples, [n]: { ...p.variableSamples[n], type: e.target.value, value: p.variableSamples[n]?.value || '' } },
                            }))}
                            className="shrink-0 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                          >
                            <option value="">Seleccionar tipo</option>
                            {VARIABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Mensaje Inferior <span className="normal-case font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.footer}
                  onChange={e => onChange(p => ({ ...p, footer: e.target.value }))}
                  placeholder="Ej: Para no recibir más mensajes, escribe STOP"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
            </>}

            {/* Paso 3: Botones */}
            {step === 'buttons' && (
              <div className="space-y-6">
                <div>
                  <div className="mb-3">
                    <p className="text-sm font-black text-gray-700">Respuesta Rápida</p>
                    <p className="text-xs text-gray-400 mt-0.5">Hasta 3 respuestas rápidas y 2 CTAs.</p>
                  </div>
                  {form.quickReplies.map((qr, i) => (
                    <div key={i} className="flex items-start gap-2 mb-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Título</label>
                        <input
                          type="text"
                          value={qr.text}
                          maxLength={25}
                          onChange={e => {
                            const u = [...form.quickReplies];
                            u[i] = { text: e.target.value };
                            onChange(p => ({ ...p, quickReplies: u }));
                          }}
                          placeholder="Ej: Ver menú"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                        <p className="text-[10px] text-gray-400">Max. 25 caracteres — No admite emojis.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange(p => ({ ...p, quickReplies: p.quickReplies.filter((_, idx) => idx !== i) }))}
                        className="mt-7 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {form.quickReplies.length < 3 && (
                    <button
                      type="button"
                      onClick={() => onChange(p => ({ ...p, quickReplies: [...p.quickReplies, { text: '' }] }))}
                      className="text-blue-600 text-xs font-black hover:text-blue-800 transition-colors"
                    >
                      + Respuesta Rápida
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-700 mb-3">Llamada a la Acción</p>
                  {form.ctaButtons.map((cta, i) => (
                    <div key={i} className="flex items-start gap-2 mb-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={cta.text}
                          onChange={e => { const u = [...form.ctaButtons]; u[i] = { ...u[i], text: e.target.value }; onChange(p => ({ ...p, ctaButtons: u })); }}
                          placeholder="Texto del botón"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                        <div className="flex gap-2">
                          <select
                            value={cta.type}
                            onChange={e => { const u = [...form.ctaButtons]; u[i] = { ...u[i], type: e.target.value as 'URL' | 'PHONE' }; onChange(p => ({ ...p, ctaButtons: u })); }}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                          >
                            <option value="URL">URL</option>
                            <option value="PHONE">Teléfono</option>
                          </select>
                          <input
                            type="text"
                            value={cta.value}
                            onChange={e => { const u = [...form.ctaButtons]; u[i] = { ...u[i], value: e.target.value }; onChange(p => ({ ...p, ctaButtons: u })); }}
                            placeholder={cta.type === 'URL' ? 'https://...' : '+51 9...'}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </div>
                      </div>
                      <button type="button" onClick={() => onChange(p => ({ ...p, ctaButtons: p.ctaButtons.filter((_, idx) => idx !== i) }))} className="mt-1 text-gray-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {form.ctaButtons.length < 2 && (
                    <button
                      type="button"
                      onClick={() => onChange(p => ({ ...p, ctaButtons: [...p.ctaButtons, { text: '', type: 'URL', value: '' }] }))}
                      className="text-blue-600 text-xs font-black hover:text-blue-800 transition-colors"
                    >
                      + Agregar CTA
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vista previa */}
          <div className="w-72 border-l border-gray-100 bg-gray-50 p-5 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Vista previa</p>
              <span className="text-[10px] text-gray-400">{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="bg-[#ECE5DD] rounded-2xl p-3 min-h-48">
              <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[92%] space-y-1.5">
                {form.headerText && <p className="font-black text-gray-900 text-sm">{form.headerText}</p>}
                {form.body ? (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {form.body.replace(/\{\{(\d+)\}\}/g, (_, n) => `[Variable ${n}]`)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-300 italic">El mensaje aparecerá aquí...</p>
                )}
                {form.footer && <p className="text-[10px] text-gray-400 mt-1">{form.footer}</p>}
                {(form.quickReplies.some(q => q.text) || form.ctaButtons.some(c => c.text)) && (
                  <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                    {form.quickReplies.filter(q => q.text).map((q, i) => (
                      <div key={i} className="text-center text-blue-600 text-xs font-bold py-1 border-t border-gray-100 first:border-t-0">→ {q.text}</div>
                    ))}
                    {form.ctaButtons.filter(c => c.text).map((c, i) => (
                      <div key={i} className="text-center text-blue-600 text-xs font-bold py-1 border-t border-gray-100">→ {c.text}</div>
                    ))}
                  </div>
                )}
              </div>
              {(form.body || form.headerText) && (
                <div className="flex justify-end mt-1">
                  <span className="text-[9px] text-gray-400 bg-yellow-50 px-2 py-0.5 rounded-full font-bold">Plantilla de mensaje ●●</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex gap-1.5">
            {STEPS.map(s => (
              <button key={s} onClick={() => onStep(s)} className={`w-2 h-2 rounded-full transition-all ${step === s ? 'bg-blue-600' : 'bg-gray-200 hover:bg-gray-300'}`} />
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-all">
              Cancelar
            </button>
            {step !== 'buttons' ? (
              <button
                onClick={() => onStep(STEPS[STEPS.indexOf(step) + 1])}
                className="px-5 py-2.5 bg-[#1E73BE] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={creating}
                className="px-5 py-2.5 bg-[#1E73BE] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all disabled:opacity-50"
              >
                {creating ? 'Guardando...' : 'Guardar Plantilla'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
