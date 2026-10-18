'use client';

import React from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { CampaignFormData, ContactImportItem, MetaTemplate, WaNumber } from '../../hooks/useBroadcasts';
import { Template } from '../../hooks/useTemplates';
import { useRestaurant } from '../../context/RestaurantContext';
import { plural } from '../../lib/modules';
import { Badge, Button, Input, Select, Sheet } from '../ui';

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

const notice = 'rounded-control border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm text-text';

function optionStyles(selected: boolean) {
  return `w-full rounded-control border px-4 py-3 text-left transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
    selected ? 'border-primary bg-primary-soft' : 'border-border hover:bg-background'
  }`;
}

/** Creación de una campaña en un panel lateral. Se guarda como borrador; se envía desde la lista. */
export function CampaignModal({ open, onClose, form, onChange, onSubmit, creating, waNumbers, approvedTemplates, metaTemplates, metaEnabled, imports }: CampaignModalProps) {
  const { activePlace } = useRestaurant();
  const customer = activePlace?.verticalConfig?.labels.customer ?? 'Cliente';
  const Customers = plural(customer);
  const customers = Customers.toLowerCase();

  // El número elegido decide de dónde salen las plantillas: la cuenta de Meta o PlazBot.
  const selected = waNumbers.find(n => n.id === form.whatsappNumberId);
  const useMeta = metaEnabled && selected?.provider === 'meta';
  const approvedMeta = metaTemplates.filter(t => t.status === 'APPROVED');
  const chosenMeta = useMeta ? approvedMeta.find(t => t.name === form.templateName) : undefined;

  return (
    <Sheet open={open} onClose={onClose} title="Nueva campaña de WhatsApp">
      {open && (
        <div className="flex min-h-full flex-col">
          <div className="flex-1 space-y-5 px-4 py-4">
            <Input
              label="Nombre de la campaña"
              value={form.campaignName}
              onChange={e => onChange(p => ({ ...p, campaignName: e.target.value }))}
              placeholder="Ej: Promo fin de semana"
            />

            {waNumbers.length === 0 ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-text">Número de WhatsApp</p>
                <p className="rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  No hay números activos. Conecta uno en la sección WhatsApp.
                </p>
              </div>
            ) : (
              <Select
                label="Número de WhatsApp"
                value={form.whatsappNumberId}
                onChange={e => onChange(p => ({ ...p, whatsappNumberId: e.target.value, templateId: '', templateName: '', bodyVariables: [], segment: 'all' }))}
              >
                <option value="">Seleccionar número...</option>
                {waNumbers.map(n => <option key={n.id} value={n.id}>{n.phoneNumber}{metaEnabled ? (n.provider === 'meta' ? ' · API de Meta' : ' · PlazBot') : ''}</option>)}
              </Select>
            )}

            <fieldset className="space-y-2">
              <legend className="mb-1.5 text-sm font-medium text-text">Plantilla a enviar</legend>
              {useMeta ? (
                approvedMeta.length === 0 ? (
                  <p className={notice}>
                    No hay plantillas <strong>aprobadas</strong> en tu cuenta de WhatsApp. Créalas en la pestaña <strong>Plantillas</strong> y espera la aprobación de Meta.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {approvedMeta.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={form.templateName === t.name}
                        onClick={() => onChange(p => ({ ...p, templateId: t.id, templateName: t.name, templateLanguage: t.language, bodyVariables: Array.from({ length: t.variableCount }, () => '') }))}
                        className={optionStyles(form.templateName === t.name)}
                      >
                        <span className="text-sm font-semibold text-text">{t.name}</span>
                        <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{t.body}</p>
                      </button>
                    ))}
                  </div>
                )
              ) : approvedTemplates.length === 0 ? (
                <p className={notice}>
                  No hay plantillas aprobadas por Meta. Ve a la pestaña <strong>Plantillas</strong>, crea una y espera la aprobación (24-72 h).
                </p>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {approvedTemplates.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={form.templateId === t.id}
                      onClick={() => onChange(p => ({ ...p, templateId: t.id, templateName: t.name }))}
                      className={optionStyles(form.templateId === t.id)}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-text">{t.name}</span>
                        <Badge>{t.category}</Badge>
                      </span>
                      <p className="mt-0.5 text-xs text-text-muted">{t.languageCode?.toUpperCase()}</p>
                    </button>
                  ))}
                </div>
              )}
              {form.templateName && (
                <p className="flex items-center gap-1 text-xs font-medium text-success">
                  <CheckCircle2 size={16} aria-hidden /> Seleccionada: {form.templateName}
                </p>
              )}
              {chosenMeta && chosenMeta.variableCount > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-text-muted">Valores de las variables (usa {'{nombre}'} para el nombre del {customer.toLowerCase()})</p>
                  {form.bodyVariables.map((v, i) => (
                    <Input
                      key={i}
                      label={`Variable {{${i + 1}}}`}
                      value={v}
                      onChange={e => onChange(p => ({ ...p, bodyVariables: p.bodyVariables.map((x, j) => (j === i ? e.target.value : x)) }))}
                      placeholder={`ej. ${i === 0 ? '{nombre}' : 'ceviches'}`}
                    />
                  ))}
                </div>
              )}
            </fieldset>

            <div className="space-y-3">
              <Select
                label={`Segmento de ${customers}`}
                value={form.segment}
                onChange={e => onChange(p => ({ ...p, segment: e.target.value }))}
              >
                <option value="all">Todos los {customers}</option>
                {useMeta ? (
                  <>
                    <option value="excel">Lista de Excel (elegir cuál)</option>
                    <option value="loyalty">Fidelización (por nivel)</option>
                    <option value="inactive">Inactivos: sin visitar hace 30 días</option>
                    <option value="normal">{Customers} sin tarjeta de fidelización</option>
                  </>
                ) : (
                  <>
                    <option value="vip">{Customers} VIP</option>
                    <option value="inactive">Inactivos (+30 días)</option>
                  </>
                )}
              </Select>

              {useMeta && form.segment === 'excel' && (
                imports.length === 0 ? (
                  <p className={notice}>
                    Todavía no subiste ninguna lista de Excel. Súbela en <strong>{Customers}</strong> y vuelve aquí.
                  </p>
                ) : (
                  <Select
                    label="Lista de Excel"
                    value={form.csvImportId}
                    onChange={e => onChange(p => ({ ...p, csvImportId: e.target.value }))}
                  >
                    <option value="">Elige la lista...</option>
                    {imports.map(i => <option key={i.id} value={i.id}>{i.filename} · {i.importedRows} contactos</option>)}
                  </Select>
                )
              )}

              {useMeta && form.segment === 'loyalty' && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-text">Niveles (sin marcar = todos)</legend>
                  <div className="flex flex-wrap gap-2">
                    {['BRONCE', 'PLATA', 'ORO', 'VIP'].map(l => {
                      const on = form.levels.includes(l);
                      return (
                        <button
                          key={l}
                          type="button"
                          aria-pressed={on}
                          onClick={() => onChange(p => ({ ...p, levels: on ? p.levels.filter(x => x !== l) : [...p.levels, l] }))}
                          className={`inline-flex h-11 items-center gap-1.5 rounded-control border px-4 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            on ? 'border-primary bg-primary-soft text-primary-hover' : 'border-border text-text hover:bg-background'
                          }`}
                        >
                          {on && <CheckCircle2 size={16} aria-hidden />}
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {useMeta && (form.segment === 'loyalty' || form.segment === 'inactive') && (
                <p className="rounded-control border border-border bg-background px-4 py-3 text-xs leading-relaxed text-text-muted">
                  Solo reciben quienes <strong className="text-text">aceptaron recibir promociones</strong> al unirse a la fidelización. Quienes se unieron antes de que existiera esa casilla no aparecen hasta que la marquen en su próxima visita.
                </p>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 flex gap-2 border-t border-border bg-surface px-4 py-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button icon={Save} onClick={onSubmit} loading={creating} className="flex-1">
              {creating ? 'Creando...' : 'Guardar borrador'}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
