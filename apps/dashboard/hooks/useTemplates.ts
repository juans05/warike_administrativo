import { useState, useCallback } from 'react';
import { plazbotApi } from '../lib/api-client';
import { toast } from 'sonner';

export type TemplateStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'FAILED';
export type TemplateStep = 'info' | 'message' | 'buttons';
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

export interface Template {
  id: string;
  name: string;
  languageCode: string;
  category: string;
  status: TemplateStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuickReply { text: string }
export interface CtaButton { text: string; type: 'URL' | 'PHONE'; value: string }
export interface VariableSample { value: string; type: string }

export interface TemplateFormData {
  elementName: string;
  category: TemplateCategory;
  language: string;
  headerText: string;
  body: string;
  footer: string;
  quickReplies: QuickReply[];
  ctaButtons: CtaButton[];
  variableSamples: Record<number, VariableSample>;
}

export const makeEmptyTemplate = (): TemplateFormData => ({
  elementName: '',
  category: 'MARKETING',
  language: 'es',
  headerText: '',
  body: '',
  footer: '',
  quickReplies: [],
  ctaButtons: [],
  variableSamples: {},
});

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateStep, setTemplateStep] = useState<TemplateStep>('info');
  const [templateForm, setTemplateForm] = useState<TemplateFormData>(makeEmptyTemplate);
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const ts = await plazbotApi.getTemplates();
      setTemplates(Array.isArray(ts) ? ts : []);
    } catch { /* carga silenciosa */ }
  }, []);

  const syncTemplates = async () => {
    setSyncing(true);
    try {
      const ts = await plazbotApi.syncTemplates();
      setTemplates(Array.isArray(ts) ? ts : []);
      toast.success('Estados sincronizados con Meta');
    } catch { toast.error('Error al sincronizar estados'); }
    finally { setSyncing(false); }
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      const updated = await plazbotApi.resendTemplate(id);
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
      if (updated?.status === 'SUBMITTED') {
        toast.success('Plantilla reenviada a revisión de Meta');
      } else {
        toast.error(`Error al reenviar: ${updated?.errorMessage || 'Error desconocido'}`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al reenviar plantilla');
    } finally { setResendingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla? Se eliminará también en PlazBot si ya fue enviada.')) return;
    setDeletingId(id);
    try {
      await plazbotApi.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Plantilla eliminada');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar plantilla');
    } finally { setDeletingId(null); }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await plazbotApi.toggleTemplate(id);
      toast.success('Estado de plantilla actualizado en PlazBot');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cambiar estado');
    } finally { setTogglingId(null); }
  };

  const bodyVariables = (body: string): number[] => {
    const matches = Array.from(body.matchAll(/\{\{(\d+)\}\}/g));
    return Array.from(new Set(matches.map(m => parseInt(m[1])))).sort((a, b) => a - b);
  };

  const addVariable = () => {
    const existing = bodyVariables(templateForm.body);
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    setTemplateForm(p => ({ ...p, body: p.body + `{{${next}}}` }));
  };

  const removeVariable = (n: number) => {
    setTemplateForm(p => {
      const newBody = p.body.replace(new RegExp(`\\{\\{${n}\\}\\}`, 'g'), '');
      const newSamples = { ...p.variableSamples };
      delete newSamples[n];
      return { ...p, body: newBody, variableSamples: newSamples };
    });
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.elementName.trim()) { toast.warning('Escribe el nombre de la plantilla'); return; }
    if (!templateForm.body.trim()) { toast.warning('Escribe el cuerpo del mensaje'); return; }

    const vars = bodyVariables(templateForm.body);
    for (const n of vars) {
      if (!templateForm.variableSamples[n]?.value?.trim()) {
        toast.warning(`Escribe un valor de muestra para la variable {{${n}}}`);
        setTemplateStep('message');
        return;
      }
    }

    setCreatingTemplate(true);
    try {
      const result = await plazbotApi.createTemplate({
        elementName: templateForm.elementName,
        category: templateForm.category,
        languageCode: templateForm.language,
        headerText: templateForm.headerText || undefined,
        body: templateForm.body,
        footer: templateForm.footer || undefined,
        quickReplies: templateForm.quickReplies.filter(q => q.text.trim()),
        ctaButtons: templateForm.ctaButtons.filter(c => c.text.trim()),
        variableSamples: templateForm.variableSamples,
      });

      if (result?.status === 'FAILED') {
        toast.error(`Error al enviar a Meta: ${result.errorMessage || 'Error desconocido'}`);
      } else {
        toast.success('Plantilla guardada y enviada a revisión de Meta');
        setShowTemplateModal(false);
        setTemplateForm(makeEmptyTemplate());
        setTemplateStep('info');
      }
      const ts = await plazbotApi.getTemplates();
      setTemplates(Array.isArray(ts) ? ts : []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al crear plantilla');
    } finally { setCreatingTemplate(false); }
  };

  const filteredTemplates = templates.filter(t =>
    !templateSearch || t.name?.toLowerCase().includes(templateSearch.toLowerCase())
  );

  return {
    templates,
    filteredTemplates,
    templateSearch,
    setTemplateSearch,
    syncing,
    resendingId,
    deletingId,
    togglingId,
    showTemplateModal,
    setShowTemplateModal,
    templateStep,
    setTemplateStep,
    templateForm,
    setTemplateForm,
    creatingTemplate,
    loadTemplates,
    syncTemplates,
    handleResend,
    handleDelete,
    handleToggle,
    handleCreateTemplate,
    bodyVariables,
    addVariable,
    removeVariable,
  };
}
