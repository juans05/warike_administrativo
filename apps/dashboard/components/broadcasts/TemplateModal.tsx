'use client';

import React from 'react';
import { ArrowRight, Lightbulb, Plus, Save, X } from 'lucide-react';
import {
  TemplateFormData, TemplateStep, TemplateCategory,
} from '../../hooks/useTemplates';
import { Button, Input, Select, Sheet, Tabs, cn } from '../ui';
import { controlStyles } from '../ui/Field';

const STEPS: TemplateStep[] = ['info', 'message', 'buttons'];
const STEP_LABELS: Record<TemplateStep, string> = { info: 'Plantilla', message: 'Mensaje', buttons: 'Botones' };

const CATEGORY_INFO: Record<TemplateCategory, { label: string; desc: string; example: string }> = {
  MARKETING: {
    label: 'Marketing',
    desc: 'Para promociones, ofertas, descuentos y anuncios comerciales.',
    example: '¡Hola {{1}}! Esta semana 2x1 en ceviche. Ven a El Huarique y disfruta.',
  },
  UTILITY: {
    label: 'Utilidad',
    desc: 'Para confirmaciones, recordatorios y actualizaciones de pedidos/reservas.',
    example: '{{1}}, tu reserva para {{2}} personas el {{3}} está confirmada. ¡Te esperamos!',
  },
  AUTHENTICATION: {
    label: 'Autenticación',
    desc: 'Para códigos de verificación de un solo uso (OTP). Raramente necesario.',
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

const chip = 'inline-flex items-center gap-1 rounded-control border border-border bg-background px-2 py-1 text-xs font-medium text-text';

/** Creación de una plantilla en tres pasos, en un panel lateral con vista previa abajo. */
export function TemplateModal({
  open, onClose, step, onStep, form, onChange, onSubmit, creating,
  bodyVariables, addVariable, removeVariable,
}: TemplateModalProps) {
  const vars = bodyVariables(form.body);
  const catInfo = CATEGORY_INFO[form.category];

  return (
    <Sheet open={open} onClose={onClose} title="Nueva plantilla de WhatsApp">
      {open && (
        <div className="flex min-h-full flex-col">
          <div className="px-2">
            <Tabs tabs={STEPS.map(s => ({ key: s, label: STEP_LABELS[s] }))} value={step} onChange={(k) => onStep(k as TemplateStep)} aria-label="Pasos de la plantilla" />
          </div>

          <div className="flex-1 space-y-5 px-4 py-4">
            {step === 'info' && <>
              <Input
                label="Nombre de la plantilla"
                hint="Solo minúsculas y guiones bajos."
                value={form.elementName}
                onChange={e => onChange(p => ({ ...p, elementName: e.target.value.replace(/\s+/g, '_').toLowerCase() }))}
                placeholder="promo_fin_semana"
              />
              <fieldset className="space-y-2">
                <legend className="mb-1.5 text-sm font-medium text-text">Categoría</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(['MARKETING', 'UTILITY', 'AUTHENTICATION'] as TemplateCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={form.category === cat}
                      onClick={() => onChange(p => ({ ...p, category: cat }))}
                      className={`h-11 rounded-control border px-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        form.category === cat ? 'border-primary bg-primary-soft text-primary-hover' : 'border-border text-text hover:bg-background'
                      }`}
                    >
                      {cat === 'AUTHENTICATION' ? 'Auth' : CATEGORY_INFO[cat].label}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5 rounded-control border border-border bg-background px-4 py-3">
                  <p className="text-sm font-medium text-text">{catInfo.label}</p>
                  <p className="text-xs leading-relaxed text-text-muted">{catInfo.desc}</p>
                  <p className="text-xs italic leading-relaxed text-text-muted">Ejemplo: &quot;{catInfo.example}&quot;</p>
                </div>
              </fieldset>
              <Select
                label="Idioma"
                value={form.language}
                onChange={e => onChange(p => ({ ...p, language: e.target.value }))}
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
                <option value="pt_BR">Portugués (Brasil)</option>
              </Select>
            </>}

            {step === 'message' && <>
              <Input
                label="Encabezado (opcional)"
                value={form.headerText}
                onChange={e => onChange(p => ({ ...p, headerText: e.target.value }))}
                placeholder="Título del mensaje"
              />
              <div className="space-y-1.5">
                <label htmlFor="template-body" className="text-sm font-medium text-text">Cuerpo del mensaje</label>
                <textarea
                  id="template-body"
                  value={form.body}
                  onChange={e => onChange(p => ({ ...p, body: e.target.value }))}
                  placeholder="Hola {{1}}, tenemos una oferta especial para ti hoy..."
                  rows={5}
                  maxLength={1024}
                  className={controlStyles(undefined, 'py-2.5')}
                />
                <div className="flex items-center justify-between gap-2">
                  <Button variant="secondary" size="sm" icon={Plus} onClick={addVariable}>Agregar variable</Button>
                  <span className="text-xs tabular-nums text-text-muted">{form.body.length} / 1024</span>
                </div>
                {vars.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {vars.map(n => (
                      <span key={n} className={chip}>
                        {`{{${n}}}`}
                        <button
                          type="button"
                          onClick={() => removeVariable(n)}
                          aria-label={`Quitar variable ${n}`}
                          className="relative rounded text-text-muted after:absolute after:-inset-3 hover:text-danger"
                        >
                          <X size={16} aria-hidden />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {vars.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-text">Valor de muestra para las variables</p>
                  <p className="flex items-start gap-2 rounded-control border border-secondary/40 bg-secondary/10 px-4 py-3 text-xs leading-relaxed text-text">
                    <Lightbulb size={16} className="mt-0.5 shrink-0 text-text-muted" aria-hidden />
                    Los valores de muestra ayudan a WhatsApp a evaluar y aprobar tu plantilla rápidamente.
                  </p>
                  {vars.map(n => (
                    <div key={n} className="space-y-2 rounded-control border border-border p-3">
                      <span className={chip}>{`{{${n}}}`}</span>
                      <Input
                        label="Valor de muestra"
                        value={form.variableSamples[n]?.value || ''}
                        onChange={e => onChange(p => ({
                          ...p,
                          variableSamples: { ...p.variableSamples, [n]: { ...p.variableSamples[n], value: e.target.value, type: p.variableSamples[n]?.type || '' } },
                        }))}
                      />
                      <Select
                        label="Tipo"
                        value={form.variableSamples[n]?.type || ''}
                        onChange={e => onChange(p => ({
                          ...p,
                          variableSamples: { ...p.variableSamples, [n]: { ...p.variableSamples[n], type: e.target.value, value: p.variableSamples[n]?.value || '' } },
                        }))}
                      >
                        <option value="">Seleccionar tipo</option>
                        {VARIABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </Select>
                    </div>
                  ))}
                </div>
              )}
              <Input
                label="Mensaje inferior (opcional)"
                value={form.footer}
                onChange={e => onChange(p => ({ ...p, footer: e.target.value }))}
                placeholder="Ej: Para no recibir más mensajes, escribe STOP"
              />
            </>}

            {step === 'buttons' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-text">Respuesta rápida</p>
                    <p className="text-xs text-text-muted">Hasta 3 respuestas rápidas y 2 llamadas a la acción.</p>
                  </div>
                  {form.quickReplies.map((qr, i) => (
                    <div key={i} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Input
                          label={`Título ${i + 1}`}
                          hint="Máx. 25 caracteres. No admite emojis."
                          value={qr.text}
                          maxLength={25}
                          onChange={e => {
                            const u = [...form.quickReplies];
                            u[i] = { text: e.target.value };
                            onChange(p => ({ ...p, quickReplies: u }));
                          }}
                          placeholder="Ej: Ver menú"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        icon={X}
                        aria-label={`Quitar respuesta rápida ${i + 1}`}
                        onClick={() => onChange(p => ({ ...p, quickReplies: p.quickReplies.filter((_, idx) => idx !== i) }))}
                        className="mb-6 w-11 px-0"
                      />
                    </div>
                  ))}
                  {form.quickReplies.length < 3 && (
                    <Button variant="secondary" size="sm" icon={Plus} onClick={() => onChange(p => ({ ...p, quickReplies: [...p.quickReplies, { text: '' }] }))}>
                      Respuesta rápida
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-text">Llamada a la acción</p>
                  {form.ctaButtons.map((cta, i) => (
                    <div key={i} className="space-y-2 rounded-control border border-border bg-background p-3">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Input
                            label="Texto del botón"
                            value={cta.text}
                            onChange={e => { const u = [...form.ctaButtons]; u[i] = { ...u[i], text: e.target.value }; onChange(p => ({ ...p, ctaButtons: u })); }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          icon={X}
                          aria-label={`Quitar llamada a la acción ${i + 1}`}
                          onClick={() => onChange(p => ({ ...p, ctaButtons: p.ctaButtons.filter((_, idx) => idx !== i) }))}
                          className="w-11 px-0"
                        />
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <Select
                          label="Tipo"
                          value={cta.type}
                          onChange={e => { const u = [...form.ctaButtons]; u[i] = { ...u[i], type: e.target.value as 'URL' | 'PHONE' }; onChange(p => ({ ...p, ctaButtons: u })); }}
                        >
                          <option value="URL">URL</option>
                          <option value="PHONE">Teléfono</option>
                        </Select>
                        <Input
                          label={cta.type === 'URL' ? 'Enlace' : 'Teléfono'}
                          value={cta.value}
                          onChange={e => { const u = [...form.ctaButtons]; u[i] = { ...u[i], value: e.target.value }; onChange(p => ({ ...p, ctaButtons: u })); }}
                          placeholder={cta.type === 'URL' ? 'https://...' : '+51 9...'}
                        />
                      </div>
                    </div>
                  ))}
                  {form.ctaButtons.length < 2 && (
                    <Button variant="secondary" size="sm" icon={Plus} onClick={() => onChange(p => ({ ...p, ctaButtons: [...p.ctaButtons, { text: '', type: 'URL', value: '' }] }))}>
                      Agregar llamada a la acción
                    </Button>
                  )}
                </div>
              </div>
            )}

            <section aria-label="Vista previa" className="space-y-2 border-t border-border pt-4">
              <p className="text-sm font-medium text-text-muted">Vista previa</p>
              <div className="min-h-32 rounded-card bg-background p-3">
                <div className="max-w-[92%] space-y-1.5 rounded-card border border-border bg-surface p-3">
                  {form.headerText && <p className="text-sm font-semibold text-text">{form.headerText}</p>}
                  {form.body ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                      {form.body.replace(/\{\{(\d+)\}\}/g, (_, n) => `[Variable ${n}]`)}
                    </p>
                  ) : (
                    <p className="text-sm italic text-text-muted">El mensaje aparecerá aquí...</p>
                  )}
                  {form.footer && <p className="mt-1 text-xs text-text-muted">{form.footer}</p>}
                  {(form.quickReplies.some(q => q.text) || form.ctaButtons.some(c => c.text)) && (
                    <div className="mt-2 border-t border-border pt-1">
                      {[...form.quickReplies.filter(q => q.text), ...form.ctaButtons.filter(c => c.text)].map((b, i) => (
                        <div key={i} className={cn('py-1 text-center text-xs font-medium text-primary', i > 0 && 'border-t border-border')}>{b.text}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 flex gap-2 border-t border-border bg-surface px-4 py-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            {step !== 'buttons' ? (
              <Button icon={ArrowRight} onClick={() => onStep(STEPS[STEPS.indexOf(step) + 1])} className="flex-1">Siguiente</Button>
            ) : (
              <Button icon={Save} onClick={onSubmit} loading={creating} className="flex-1">
                {creating ? 'Guardando...' : 'Guardar plantilla'}
              </Button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
