'use client';

import React, { useEffect, useId } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { AlertTriangle, Bold, Clock, Heading2, Italic, Link2, List, Mail, Plus, Zap } from 'lucide-react';
import { EmailCampaignFormData, AudienceSource } from '../../hooks/useEmailCampaigns';
import { EMAIL_TEMPLATES, EmailTemplateOption } from '../../lib/email-templates';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';
import { Button, CloseButton, Input } from '../ui';

interface EmailCampaignModalProps {
  open: boolean;
  onClose: () => void;
  form: EmailCampaignFormData;
  onChange: React.Dispatch<React.SetStateAction<EmailCampaignFormData>>;
  onSubmit: () => void;
  creating: boolean;
  audienceCount: number;
  isEditing: boolean;
}

function minScheduleValue() {
  const now = new Date(Date.now() + 5 * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function ToolbarButton({ active, onClick, label, icon: Icon }: { active?: boolean; onClick: () => void; label: string; icon: React.ElementType }) {
  return (
    <Button size="sm" variant={active ? 'primary' : 'ghost'} onClick={onClick} aria-label={label} aria-pressed={!!active} title={label} className="w-9 px-0">
      <Icon size={16} aria-hidden />
    </Button>
  );
}

const groupLabel = 'mb-1.5 block text-sm font-medium text-text';

export function EmailCampaignModal({ open, onClose, form, onChange, onSubmit, creating, audienceCount, isEditing }: EmailCampaignModalProps) {
  const { customer, customers } = useCustomerLabels();
  const titleId = useId();
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: form.bodyHtml,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(p => ({ ...p, bodyHtml: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[220px] px-4 py-3 focus:outline-none',
        'aria-label': 'Contenido del correo',
      },
    },
  });

  useEffect(() => {
    if (open && editor) {
      editor.commands.setContent(form.bodyHtml || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const applyTemplate = (template: EmailTemplateOption) => {
    editor?.commands.setContent(template.html);
    onChange(p => ({ ...p, bodyHtml: template.html }));
  };

  const insertNombre = () => {
    editor?.chain().focus().insertContent('{nombre}').run();
  };

  const previewHtml = (form.bodyHtml || '<p style="color:gray;padding:16px;font-family:sans-serif;">Escribe el contenido del correo para ver la vista previa aquí.</p>')
    .replace(/\{nombre\}/g, 'Juan');

  const toggleAudienceSource = (source: AudienceSource) => {
    onChange(p => ({
      ...p,
      audienceSources: p.audienceSources.includes(source)
        ? p.audienceSources.filter(s => s !== source)
        : [...p.audienceSources, source],
    }));
  };

  const toggleLink = () => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('URL del enlace:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-card bg-surface text-text shadow-modal">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3">
          <div>
            <h2 id={titleId} className="text-base font-semibold">{isEditing ? 'Editar campaña de email' : 'Nueva campaña de email'}</h2>
            <p className="mt-0.5 text-sm text-text-muted">{isEditing ? 'Actualiza el contenido de tu borrador' : 'Completa los campos para crear tu campaña'}</p>
          </div>
          <CloseButton onClose={onClose} />
        </div>

        <div className="space-y-5 px-5 py-5">
          <Input
            label="Nombre de la campaña"
            value={form.campaignName}
            onChange={e => onChange(p => ({ ...p, campaignName: e.target.value }))}
            placeholder="Ej: Promo fin de semana julio"
          />

          <Input
            label="Asunto del correo"
            value={form.subject}
            onChange={e => onChange(p => ({ ...p, subject: e.target.value }))}
            placeholder="Ej: ¡Oferta especial para ti, {nombre}!"
          />

          <div>
            <p className={groupLabel}>Empezar desde una plantilla</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {EMAIL_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="rounded-control border border-border px-3 py-3 text-left transition-colors duration-200 motion-reduce:transition-none hover:border-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="block text-sm font-semibold text-text">{t.label}</span>
                  <span className="mt-0.5 block text-xs text-text-muted">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-text">Contenido del correo</p>
              <Button size="sm" variant="ghost" icon={Plus} onClick={insertNombre}>Insertar {'{nombre}'}</Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-control border border-border">
                <div className="flex items-center gap-1 border-b border-border bg-background px-2 py-1.5" role="toolbar" aria-label="Formato">
                  <ToolbarButton label="Negrita" icon={Bold} active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} />
                  <ToolbarButton label="Cursiva" icon={Italic} active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} />
                  <ToolbarButton label="Título" icon={Heading2} active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
                  <ToolbarButton label="Lista" icon={List} active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
                  <ToolbarButton label="Enlace" icon={Link2} active={editor?.isActive('link')} onClick={toggleLink} />
                </div>
                <EditorContent editor={editor} />
              </div>

              <div className="overflow-hidden rounded-control border border-border bg-background">
                <div className="border-b border-border px-3 py-2 text-xs font-medium text-text-muted">Vista previa</div>
                <iframe srcDoc={previewHtml} title="Vista previa del email" className="min-h-[220px] w-full bg-surface" />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-text-muted">Así se verá aproximadamente en la bandeja de entrada de tu {customer}.</p>
          </div>

          <fieldset>
            <legend className={groupLabel}>¿A quién le llega?</legend>
            <div className="flex flex-wrap gap-x-6">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-text">
                <input type="checkbox" checked={form.audienceSources.includes('feedback')} onChange={() => toggleAudienceSource('feedback')} className="h-4 w-4 accent-primary" />
                Fidelización
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-text">
                <input type="checkbox" checked={form.audienceSources.includes('contacts')} onChange={() => toggleAudienceSource('contacts')} className="h-4 w-4 accent-primary" />
                Contactos
              </label>
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              Fidelización: {customers} que dejaron su email y aceptaron promociones al dejar una reseña. Contactos: tu agenda de WhatsApp/importados con email y consentimiento. Si marcas los dos, se manda a la unión de ambos (sin duplicados).
            </p>
          </fieldset>

          <div aria-live="polite" className={`flex items-start gap-2 rounded-control border px-4 py-3 text-sm ${
            form.audienceSources.length === 0 ? 'border-danger/30 bg-danger/10 text-danger'
              : audienceCount > 0 ? 'border-primary/20 bg-primary-soft text-text'
              : 'border-secondary/60 bg-secondary/10 text-text'
          }`}>
            {form.audienceSources.length === 0 ? (
              <><AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" /> Elige al menos una fuente de destinatarios arriba.</>
            ) : audienceCount > 0 ? (
              <><Mail size={16} aria-hidden className="mt-0.5 shrink-0" /> <span>Esta campaña llegará a <strong className="tabular-nums">{audienceCount}</strong> {audienceCount === 1 ? customer : customers}.</span></>
            ) : (
              <><AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" /> Nadie en esa(s) fuente(s) aceptó recibir promociones por email todavía. Aun así puedes guardar el borrador.</>
            )}
          </div>

          {!isEditing && (
            <div>
              <p className={groupLabel}>¿Cuándo enviar?</p>
              <div className="inline-flex gap-1 rounded-control bg-background p-1" role="group" aria-label="¿Cuándo enviar?">
                {([['now', 'Enviar ahora', Zap], ['schedule', 'Programar', Clock]] as const).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={form.sendMode === id}
                    onClick={() => onChange(p => ({ ...p, sendMode: id }))}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-control px-4 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      form.sendMode === id ? 'bg-surface text-primary shadow-card' : 'text-text-muted hover:text-text'
                    }`}
                  >
                    <Icon size={16} aria-hidden /> {label}
                  </button>
                ))}
              </div>

              {form.sendMode === 'schedule' && (
                <div className="mt-3 max-w-xs">
                  <Input
                    label="Fecha y hora de envío"
                    type="datetime-local"
                    value={form.scheduledAt}
                    min={minScheduleValue()}
                    onChange={e => onChange(p => ({ ...p, scheduledAt: e.target.value }))}
                    hint="La campaña se enviará automáticamente en esta fecha y hora (zona horaria: Lima)."
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-surface px-5 py-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={onSubmit} loading={creating}>
            {isEditing
              ? (creating ? 'Guardando...' : 'Guardar cambios')
              : (creating ? 'Creando...' : form.sendMode === 'now' ? 'Crear y enviar' : 'Programar campaña')}
          </Button>
        </div>
      </div>
    </div>
  );
}
