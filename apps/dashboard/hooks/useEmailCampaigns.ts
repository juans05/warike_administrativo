import { useState, useCallback } from 'react';
import { businessApi, EmailCampaignPayload } from '../lib/api-client';
import { useRestaurant } from '../context/RestaurantContext';
import { toast } from 'sonner';

export type EmailCampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
export type SendMode = 'now' | 'schedule';

export interface EmailCampaign {
  id: string;
  campaignName: string;
  subject: string;
  bodyHtml: string;
  status: EmailCampaignStatus;
  emailsSent: number;
  totalRecipients: number;
  scheduledAt: string | null;
  createdAt: string;
  audienceSources: ('feedback' | 'contacts')[] | null;
}

export type AudienceSource = 'feedback' | 'contacts';

export interface EmailCampaignFormData {
  campaignName: string;
  subject: string;
  bodyHtml: string;
  sendMode: SendMode;
  scheduledAt: string;
  audienceSources: AudienceSource[];
}

const makeEmptyCampaign = (): EmailCampaignFormData => ({
  campaignName: '',
  subject: '',
  bodyHtml: '',
  sendMode: 'now',
  scheduledAt: '',
  audienceSources: ['feedback'],
});

export function useEmailCampaigns() {
  const { activePlaceId } = useRestaurant();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [audienceCount, setAudienceCount] = useState(0);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState<EmailCampaignFormData>(makeEmptyCampaign);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [unschedulingId, setUnschedulingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<string | null>(null);

  const loadCampaigns = useCallback(async (placeId: string) => {
    const [cs, audience] = await Promise.allSettled([
      businessApi.getEmailCampaigns(placeId),
      businessApi.getEmailAudienceCount(placeId, ['feedback']),
    ]);
    if (cs.status === 'fulfilled') {
      setCampaigns(cs.value || []);
    } else if (cs.reason?.message?.includes('suscripción activa') || cs.reason?.message?.includes('requiere el plan')) {
      setSubscriptionBlocked(cs.reason.message);
    }
    if (audience.status === 'fulfilled') setAudienceCount(audience.value?.audienceCount || 0);
  }, []);

  // Recalcula el contador de audiencia cuando cambian las fuentes elegidas en el modal
  const refreshAudienceCount = useCallback(async (placeId: string, sources: AudienceSource[]) => {
    try {
      const res = await businessApi.getEmailAudienceCount(placeId, sources.length ? sources : ['feedback']);
      setAudienceCount(res?.audienceCount || 0);
    } catch { /* se mantiene el último valor conocido */ }
  }, []);

  const openCreateModal = () => {
    setEditingCampaignId(null);
    setCampaignForm(makeEmptyCampaign());
    setShowCampaignModal(true);
  };

  const openEditModal = (campaign: EmailCampaign) => {
    setEditingCampaignId(campaign.id);
    setCampaignForm({
      campaignName: campaign.campaignName,
      subject: campaign.subject,
      bodyHtml: campaign.bodyHtml,
      sendMode: 'now',
      scheduledAt: '',
      audienceSources: campaign.audienceSources?.length ? campaign.audienceSources : ['feedback'],
    });
    setShowCampaignModal(true);
  };

  const closeModal = () => {
    setShowCampaignModal(false);
    setEditingCampaignId(null);
    setCampaignForm(makeEmptyCampaign());
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.campaignName.trim()) { toast.warning('Escribe un nombre para la campaña'); return; }
    if (!campaignForm.subject.trim()) { toast.warning('Escribe un asunto para el correo'); return; }
    if (!campaignForm.bodyHtml.trim()) { toast.warning('Escribe el contenido del correo'); return; }
    if (campaignForm.audienceSources.length === 0) { toast.warning('Elige al menos una fuente de destinatarios (Fidelización o Contactos)'); return; }

    if (editingCampaignId) {
      setCreatingCampaign(true);
      try {
        const updated = await businessApi.updateEmailCampaign(editingCampaignId, {
          campaignName: campaignForm.campaignName,
          subject: campaignForm.subject,
          bodyHtml: campaignForm.bodyHtml,
          audienceSources: campaignForm.audienceSources,
        });
        setCampaigns(prev => prev.map(c => c.id === editingCampaignId ? { ...c, ...updated } : c));
        toast.success('Campaña actualizada');
        closeModal();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Error al actualizar la campaña');
      } finally {
        setCreatingCampaign(false);
      }
      return;
    }

    let scheduledAtIso: string | undefined;
    if (campaignForm.sendMode === 'schedule') {
      if (!campaignForm.scheduledAt) { toast.warning('Elige una fecha y hora para programar el envío'); return; }
      const scheduledDate = new Date(campaignForm.scheduledAt);
      if (scheduledDate <= new Date()) { toast.warning('La fecha programada debe ser en el futuro'); return; }
      scheduledAtIso = scheduledDate.toISOString();
    }

    setCreatingCampaign(true);
    try {
      const payload: EmailCampaignPayload = {
        placeId: activePlaceId!,
        campaignName: campaignForm.campaignName,
        subject: campaignForm.subject,
        bodyHtml: campaignForm.bodyHtml,
        audienceSources: campaignForm.audienceSources,
        ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
      };
      let created = await businessApi.createEmailCampaign(payload);

      if (campaignForm.sendMode === 'now') {
        await businessApi.sendEmailCampaign(created.id);
        created = { ...created, status: 'SENDING', totalRecipients: audienceCount };
        toast.success('Campaña creada y enviada');
      } else {
        toast.success(`Campaña programada para ${scheduledDateLabel(scheduledAtIso!)}`);
      }

      setCampaigns(prev => [created, ...prev]);
      closeModal();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al crear la campaña');
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    setSendingId(campaignId);
    try {
      await businessApi.sendEmailCampaign(campaignId);
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: 'SENDING' as const, totalRecipients: audienceCount } : c
      ));
      toast.success('Campaña de email enviada');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al enviar la campaña');
    } finally {
      setSendingId(null);
    }
  };

  const handleCompleteCampaign = async (campaignId: string) => {
    setCompletingId(campaignId);
    try {
      await businessApi.completeEmailCampaign(campaignId);
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: 'COMPLETED' as const } : c
      ));
      toast.success('Campaña marcada como completada');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al marcar como completada');
    } finally {
      setCompletingId(null);
    }
  };

  const handleUnscheduleCampaign = async (campaignId: string) => {
    setUnschedulingId(campaignId);
    try {
      await businessApi.unscheduleEmailCampaign(campaignId);
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: 'DRAFT' as const, scheduledAt: null } : c
      ));
      toast.success('Programación cancelada, la campaña volvió a borrador');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cancelar la programación');
    } finally {
      setUnschedulingId(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    setDeletingId(campaignId);
    try {
      await businessApi.deleteEmailCampaign(campaignId);
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      toast.success('Campaña eliminada');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar la campaña');
    } finally {
      setDeletingId(null);
    }
  };

  return {
    campaigns,
    audienceCount,
    refreshAudienceCount,
    showCampaignModal,
    campaignForm,
    setCampaignForm,
    editingCampaignId,
    creatingCampaign,
    sendingId,
    completingId,
    unschedulingId,
    deletingId,
    subscriptionBlocked,
    loadCampaigns,
    openCreateModal,
    openEditModal,
    closeModal,
    handleCreateCampaign,
    handleSendCampaign,
    handleCompleteCampaign,
    handleUnscheduleCampaign,
    handleDeleteCampaign,
  };
}

function scheduledDateLabel(iso: string) {
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}
