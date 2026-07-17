'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { EmailCampaignFormData } from '../../hooks/useEmailCampaigns';
import { EMAIL_TEMPLATES, EmailTemplateOption } from '../../lib/email-templates';

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

function ToolbarButton({ active, onClick, label, children }: { active?: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all ${
        active ? 'bg-[#F26122] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

export function EmailCampaignModal({ open, onClose, form, onChange, onSubmit, creating, audienceCount, isEditing }: EmailCampaignModalProps) {
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

  const previewHtml = (form.bodyHtml || '<p style="color:#9ca3af;padding:16px;">Escribe el contenido del correo para ver la vista previa aquí.</p>')
    .replace(/\{nombre\}/g, 'Juan');

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-black text-gray-900">{isEditing ? 'Editar Campaña de Email' : 'Nueva Campaña de Email'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{isEditing ? 'Actualiza el contenido de tu borrador' : 'Completa los campos para crear tu campaña'}</p>
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
              placeholder="Ej: Promo fin de semana julio"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Asunto del Correo</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => onChange(p => ({ ...p, subject: e.target.value }))}
              placeholder="Ej: 🍽️ ¡Oferta especial para ti, {nombre}!"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Empezar desde una plantilla</label>
            <div className="grid grid-cols-3 gap-2">
              {EMAIL_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="text-left px-3 py-3 rounded-xl border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all"
                >
                  <div className="text-sm font-black text-gray-900">{t.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Contenido del Correo</label>
              <button
                type="button"
                onClick={insertNombre}
                className="text-[10px] font-black text-orange-600 hover:underline"
              >
                ➕ Insertar {'{nombre}'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-2 py-2 border-b border-gray-100 bg-gray-50">
                  <ToolbarButton label="Negrita" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}>B</ToolbarButton>
                  <ToolbarButton label="Cursiva" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></ToolbarButton>
                  <ToolbarButton label="Título" active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
                  <ToolbarButton label="Lista" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}>•</ToolbarButton>
                  <ToolbarButton label="Enlace" active={editor?.isActive('link')} onClick={toggleLink}>🔗</ToolbarButton>
                </div>
                <EditorContent editor={editor} />
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <div className="px-3 py-2 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Vista Previa
                </div>
                <iframe
                  srcDoc={previewHtml}
                  title="Vista previa del email"
                  className="w-full min-h-[220px] bg-white"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">Así se verá aproximadamente en la bandeja de entrada de tu cliente.</p>
          </div>

          <div className={`rounded-xl px-4 py-3 border ${audienceCount > 0 ? 'bg-orange-50 border-orange-100' : 'bg-amber-50 border-amber-200'}`}>
            {audienceCount > 0 ? (
              <p className="text-xs font-bold text-orange-700">📬 Esta campaña llegará a <strong>{audienceCount}</strong> cliente{audienceCount === 1 ? '' : 's'} que aceptaron recibir promociones por email.</p>
            ) : (
              <p className="text-xs font-bold text-amber-700">⚠️ Ningún cliente ha aceptado recibir promociones por email todavía. Aun así puedes guardar el borrador.</p>
            )}
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">¿Cuándo enviar?</label>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
                {([['now', '⚡ Enviar ahora'], ['schedule', '🕐 Programar']] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChange(p => ({ ...p, sendMode: id }))}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      form.sendMode === id ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {form.sendMode === 'schedule' && (
                <div className="mt-3">
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    min={minScheduleValue()}
                    onChange={e => onChange(p => ({ ...p, scheduledAt: e.target.value }))}
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">La campaña se enviará automáticamente en esta fecha y hora (zona horaria: Lima).</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-7 py-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={creating}
            className="flex-1 py-3 bg-[#F26122] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isEditing
              ? (creating ? 'Guardando...' : 'Guardar Cambios')
              : (creating ? 'Creando...' : form.sendMode === 'now' ? 'Crear y Enviar' : 'Programar Campaña')}
          </button>
        </div>
      </div>
    </div>
  );
}
