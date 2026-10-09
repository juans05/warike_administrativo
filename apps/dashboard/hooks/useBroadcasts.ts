import { useState, useCallback } from 'react';
import { businessApi, BroadcastPayload } from '../lib/api-client';
import { useRestaurant } from '../context/RestaurantContext';
import { toast } from 'sonner';
import { META_ENABLED } from '../lib/features';

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
});

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
    // Sin la validación de Meta no se muestra nada de Meta en campañas: todo sigue por PlazBot.
    if (!META_ENABLED) { setMetaEnabled(false); return; }
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
      setBroadcasts(prev => prev.map(b =>
        b.id === broadcastId ? { ...b, status: 'SENDING' as const } : b
      ));
      toast.success('Campaña enviada');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al enviar');
    }
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
      const created = await businessApi.createBroadcast(payload);
      setBroadcasts(prev => [created, ...prev]);
      setShowCampaignModal(false);
      setCampaignForm(makeEmptyCampaign());
      toast.success('Campaña creada como borrador');
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
  };
}
