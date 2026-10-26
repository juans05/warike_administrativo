import { useState, useCallback } from 'react';
import { businessApi, BroadcastPayload } from '../lib/api-client';
import { useRestaurant } from '../context/RestaurantContext';
import { toast } from 'sonner';

export type BroadcastStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';

export interface MetaTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  body: string;
  variableCount: number;
}

export interface Broadcast {
  id: string;
  campaignName: string;
  templateBody: string;
  status: BroadcastStatus;
  messagesSent: number;
  messagesFailed?: number;
  totalRecipients?: number;
  templateName?: string | null;
  createdAt: string;
  whatsappNumber?: { phoneNumber: string };
  whatsappNumberId?: string;
  templateLanguage?: string | null;
  bodyVariables?: string[] | null;
  segmentFilter?: { type?: string; templateId?: string; levels?: string[] } | null;
  csvImportId?: string | null;
  /** 'reminder' = recordatorio de cita: SCHEDULED es "activa" y DRAFT es "pausada". */
  kind?: 'mass' | 'reminder';
  reminderOffsetMin?: number | null;
}

/** Recordatorio de cita: solo para el rubro belleza (mismo criterio que el backend). */
export const allowsReminder = (businessType?: string) => ['barberia', 'peluqueria', 'spa'].includes(businessType ?? '');
export const REMINDER_UNITS = { min: 1, h: 60, d: 1440 } as const;
export type ReminderUnit = keyof typeof REMINDER_UNITS;

export function formatOffset(min?: number | null) {
  if (!min) return '';
  if (min % 1440 === 0) return `${min / 1440} ${min === 1440 ? 'día' : 'días'}`;
  if (min % 60 === 0) return `${min / 60} ${min === 60 ? 'hora' : 'horas'}`;
  return `${min} minutos`;
}

export interface ContactImportItem {
  id: string;
  filename: string;
  importedRows: number;
  status: string;
}

export interface WaNumber {
  id: string;
  phoneNumber: string;
  isActive: boolean;
  provider?: 'meta' | 'plazbot';
}

export interface CampaignFormData {
  campaignName: string;
  whatsappNumberId: string;
  templateId: string;
  templateName: string;
  templateLanguage: string;
  bodyVariables: string[];
  /** all | excel | loyalty | inactive | normal (los dos últimos de fidelización solo con el flag de Meta). */
  segment: string;
  /** Niveles de fidelización elegidos (vacío = todos). */
  levels: string[];
  /** Lista de Excel elegida. */
  csvImportId: string;
  kind: 'mass' | 'reminder';
  /** Tiempo antes de la cita, en la unidad elegida (mínimo 15 min, máximo 7 días). */
  offsetValue: string;
  offsetUnit: ReminderUnit;
}

const makeEmptyCampaign = (): CampaignFormData => ({
  campaignName: '',
  whatsappNumberId: '',
  templateId: '',
  templateName: '',
  templateLanguage: 'es',
  bodyVariables: [],
  segment: 'all',
  levels: [],
  csvImportId: '',
  kind: 'mass',
  offsetValue: '1',
  offsetUnit: 'd',
});

const formFrom = (b: Broadcast): CampaignFormData => {
  const min = b.reminderOffsetMin ?? 1440;
  const offsetUnit: ReminderUnit = min % 1440 === 0 ? 'd' : min % 60 === 0 ? 'h' : 'min';
  return {
    campaignName: b.campaignName,
    whatsappNumberId: b.whatsappNumberId ?? '',
    templateId: b.segmentFilter?.templateId ?? '',
    templateName: b.templateName ?? '',
    templateLanguage: b.templateLanguage ?? 'es',
    bodyVariables: b.bodyVariables ?? [],
    segment: b.segmentFilter?.type ?? 'all',
    levels: b.segmentFilter?.levels ?? [],
    csvImportId: b.csvImportId ?? '',
    kind: b.kind ?? 'mass',
    offsetValue: String(min / REMINDER_UNITS[offsetUnit]),
    offsetUnit,
  };
};

export function useBroadcasts() {
  const { activePlaceId } = useRestaurant();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [waNumbers, setWaNumbers] = useState<WaNumber[]>([]);
  const [metaTemplates, setMetaTemplates] = useState<MetaTemplate[]>([]);
  // Flag por local (checkbox de "WhatsApp con Facebook"): sin él todo sigue por el flujo anterior.
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [imports, setImports] = useState<ContactImportItem[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState<CampaignFormData>(makeEmptyCampaign);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  /** Campaña que se está editando (null = nueva). */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<string | null>(null);

  const loadBroadcasts = useCallback(async (placeId: string) => {
    const [bs, nums] = await Promise.allSettled([
      businessApi.getBroadcasts(placeId),
      businessApi.getWhatsappNumbers(placeId),
    ]);
    if (bs.status === 'fulfilled') {
      setBroadcasts(bs.value || []);
    } else if (bs.reason?.message?.includes('suscripción activa') || bs.reason?.message?.includes('requiere el plan')) {
      setSubscriptionBlocked(bs.reason.message);
    }
    if (nums.status === 'fulfilled') {
      setWaNumbers((nums.value?.data || []).filter((n: WaNumber) => n.isActive));
    }
  }, []);

  // Las plantillas viven en la cuenta de WhatsApp del local; si no tiene número de Meta, no hay nada que cargar.
  const loadMetaTemplates = useCallback(async (placeId: string) => {
    try {
      const channel = await businessApi.getWhatsappChannel(placeId);
      setMetaEnabled(channel.metaEnabled);
      if (!channel.metaEnabled) { setMetaTemplates([]); return; }
      const res = await businessApi.getMetaTemplates(placeId);
      setMetaTemplates(res.data || []);
      // Listas de Excel ya subidas, para elegir a cuál enviar.
      const lists = await businessApi.getContactImports(placeId).catch(() => []);
      setImports((Array.isArray(lists) ? lists : []).filter((i: ContactImportItem) => i.status === 'completed'));
    } catch {
      setMetaTemplates([]);
    }
  }, []);

  const handleSendBroadcast = async (broadcastId: string) => {
    try {
      await businessApi.sendBroadcast(broadcastId);
      // Un recordatorio no se envía de golpe: queda activo y sale solo antes de cada cita.
      const reminder = broadcasts.find(b => b.id === broadcastId)?.kind === 'reminder';
      setBroadcasts(prev => prev.map(b =>
        b.id === broadcastId ? { ...b, status: reminder ? 'SCHEDULED' as const : 'SENDING' as const } : b
      ));
      toast.success(reminder ? 'Recordatorio activado' : 'Campaña enviada');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al enviar');
    }
  };

  const handlePauseReminder = async (broadcastId: string) => {
    try {
      await businessApi.cancelBroadcast(broadcastId);
      setBroadcasts(prev => prev.map(b => (b.id === broadcastId ? { ...b, status: 'DRAFT' as const } : b)));
      toast.success('Recordatorio pausado');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al pausar');
    }
  };

  const openNewCampaign = () => {
    setEditingId(null);
    setCampaignForm(makeEmptyCampaign());
    setShowCampaignModal(true);
  };

  const openEditCampaign = (b: Broadcast) => {
    setEditingId(b.id);
    setCampaignForm(formFrom(b));
    setShowCampaignModal(true);
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.campaignName.trim()) { toast.warning('Escribe un nombre para la campaña'); return; }
    if (!campaignForm.whatsappNumberId) { toast.warning('Selecciona un número de WhatsApp'); return; }
    if (!campaignForm.templateName) { toast.warning('Selecciona una plantilla'); return; }
    setCreatingCampaign(true);
    try {
      const payload: BroadcastPayload = {
        placeId: activePlaceId!,
        whatsappNumberId: campaignForm.whatsappNumberId,
        campaignName: campaignForm.campaignName,
        templateBody: campaignForm.templateName,
        segmentFilter: { type: campaignForm.segment, templateId: campaignForm.templateId },
      };
      // Los datos de la plantilla de Meta solo viajan con el flag activo y un número de Meta: el resto, igual que antes.
      const number = waNumbers.find(n => n.id === campaignForm.whatsappNumberId);
      if (metaEnabled && number?.provider === 'meta') {
        payload.templateName = campaignForm.templateName;
        payload.templateLanguage = campaignForm.templateLanguage;
        payload.bodyVariables = campaignForm.bodyVariables;
        const seg = campaignForm.segment;
        payload.segmentFilter = {
          type: seg,
          templateId: campaignForm.templateId,
          ...(seg === 'loyalty' ? { levels: campaignForm.levels } : {}),
          ...(seg === 'inactive' ? { days: 30 } : {}),
        };
        if (seg === 'excel') {
          if (!campaignForm.csvImportId) { toast.warning('Elige la lista de Excel'); setCreatingCampaign(false); return; }
          payload.csvImportId = campaignForm.csvImportId;
          payload.useCsvMerge = true;
        }
      }
      if (campaignForm.kind === 'reminder') {
        // El recordatorio sale por la API de Meta con la plantilla elegida; el segmento no aplica.
        if (!(metaEnabled && number?.provider === 'meta')) { toast.warning('El recordatorio necesita un número de la API de Meta'); setCreatingCampaign(false); return; }
        const min = Number(campaignForm.offsetValue) * REMINDER_UNITS[campaignForm.offsetUnit];
        if (!Number.isInteger(min) || min < 15 || min > 10080) { toast.warning('El tiempo debe ser entre 15 minutos y 7 días'); setCreatingCampaign(false); return; }
        payload.kind = 'reminder';
        payload.reminderOffsetMin = min;
        delete payload.segmentFilter;
        delete payload.csvImportId;
        delete payload.useCsvMerge;
      }
      if (editingId) {
        const { placeId: _placeId, kind: _kind, ...changes } = payload;
        const saved = await businessApi.updateBroadcast(editingId, changes);
        setBroadcasts(prev => prev.map(b => (b.id === editingId ? { ...b, ...saved, whatsappNumber: waNumbers.find(n => n.id === saved.whatsappNumberId) ?? b.whatsappNumber } : b)));
        toast.success('Cambios guardados');
      } else {
        const created = await businessApi.createBroadcast(payload);
        setBroadcasts(prev => [created, ...prev]);
        toast.success(campaignForm.kind === 'reminder' ? 'Recordatorio creado (pausado): actívalo desde la lista' : 'Campaña creada como borrador');
      }
      setShowCampaignModal(false);
      setEditingId(null);
      setCampaignForm(makeEmptyCampaign());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al crear campaña');
    } finally {
      setCreatingCampaign(false);
    }
  };

  return {
    broadcasts,
    waNumbers,
    metaTemplates,
    metaEnabled,
    imports,
    loadMetaTemplates,
    showCampaignModal,
    setShowCampaignModal,
    campaignForm,
    setCampaignForm,
    creatingCampaign,
    subscriptionBlocked,
    loadBroadcasts,
    handleSendBroadcast,
    handleCreateCampaign,
    handlePauseReminder,
    editingId,
    openNewCampaign,
    openEditCampaign,
  };
}
