import { useState, useCallback } from 'react';
import { businessApi, BroadcastPayload } from '../lib/api-client';
import { useRestaurant } from '../context/RestaurantContext';
import { toast } from 'sonner';

export type BroadcastStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';

export interface Broadcast {
  id: string;
  campaignName: string;
  templateBody: string;
  status: BroadcastStatus;
  messagesSent: number;
  createdAt: string;
  whatsappNumber?: { phoneNumber: string };
}

export interface WaNumber {
  id: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface CampaignFormData {
  campaignName: string;
  whatsappNumberId: string;
  templateId: string;
  templateName: string;
  segment: string;
}

const makeEmptyCampaign = (): CampaignFormData => ({
  campaignName: '',
  whatsappNumberId: '',
  templateId: '',
  templateName: '',
  segment: 'all',
});

export function useBroadcasts() {
  const { activePlaceId } = useRestaurant();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [waNumbers, setWaNumbers] = useState<WaNumber[]>([]);
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
