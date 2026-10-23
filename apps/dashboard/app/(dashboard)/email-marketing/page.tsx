'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, Mail, Plus } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { useEmailCampaigns } from '../../../hooks/useEmailCampaigns';
import { useCustomerLabels } from '../../../hooks/useCustomerLabels';
import { EmailCampaignList } from '../../../components/email-marketing/EmailCampaignList';
import { EmailCampaignModal } from '../../../components/email-marketing/EmailCampaignModal';
import { Button, Card, PageHeader, buttonStyles } from '../../../components/ui';

export default function EmailMarketingPage() {
  const { activePlaceId } = useRestaurant();
  const { customer, customers } = useCustomerLabels();
  const [loading, setLoading] = useState(true);

  const {
    campaigns, audienceCount, refreshAudienceCount,
    showCampaignModal,
    campaignForm, setCampaignForm, editingCampaignId,
    creatingCampaign, sendingId, completingId, unschedulingId, deletingId,
    subscriptionBlocked,
    loadCampaigns, openCreateModal, openEditModal, closeModal,
    handleCreateCampaign, handleSendCampaign, handleCompleteCampaign, handleUnscheduleCampaign, handleDeleteCampaign,
  } = useEmailCampaigns();

  useEffect(() => {
    if (!activePlaceId) { setLoading(false); return; }
    setLoading(true);
    loadCampaigns(activePlaceId).finally(() => setLoading(false));
  }, [activePlaceId]);

  // Recalcula "a cuántos les llega" cada vez que cambian los checkboxes de audiencia en el modal
  useEffect(() => {
    if (!activePlaceId || !showCampaignModal) return;
    refreshAudienceCount(activePlaceId, campaignForm.audienceSources);
  }, [activePlaceId, showCampaignModal, campaignForm.audienceSources, refreshAudienceCount]);

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      <PageHeader
        title="Email marketing"
        subtitle={`Envía correos personalizados con promociones a tus ${customers}.`}
        action={!loading && !subscriptionBlocked ? <Button icon={Plus} onClick={openCreateModal}>Nueva campaña</Button> : undefined}
      />

      {subscriptionBlocked && (
        <Card padding="lg" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Lock size={24} aria-hidden />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-text">Función disponible en un plan superior</p>
            <p className="mt-1 text-sm text-text-muted">{subscriptionBlocked}</p>
          </div>
          <Link href="/suscripcion" className={buttonStyles('primary')}>Ver planes</Link>
        </Card>
      )}

      {!loading && !subscriptionBlocked && audienceCount === 0 && (
        <Card padding="md" className="space-y-2 border-secondary/60 bg-secondary/10">
          <p className="flex items-center gap-2 font-semibold text-text"><Mail size={16} aria-hidden /> Todavía nadie puede recibir tus correos</p>
          <p className="text-sm text-text">Para enviar una campaña necesitas {customers} con <strong>correo</strong> que hayan <strong>aceptado recibir promociones</strong>. Puedes conseguirlos así:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-text">
            <li>En <Link href="/clientes" className="font-medium text-primary-hover underline">Clientes</Link>, agrega el correo y marca el consentimiento, o importa un Excel con ambos datos.</li>
            <li>Los {customers} que dejan su correo y aceptan promociones en el formulario de opinión (QR o NFC) se suman solos.</li>
          </ul>
        </Card>
      )}

      {!loading && !subscriptionBlocked && audienceCount > 0 && (
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Mail size={16} aria-hidden />
          <span>Tienes <strong className="text-text tabular-nums">{audienceCount}</strong> {audienceCount === 1 ? customer : customers} que aceptaron recibir promociones por email.</span>
        </p>
      )}

      {!subscriptionBlocked && (
        <EmailCampaignList
          campaigns={campaigns}
          loading={loading}
          audienceCount={audienceCount}
          sendingId={sendingId}
          completingId={completingId}
          unschedulingId={unschedulingId}
          deletingId={deletingId}
          onSend={handleSendCampaign}
          onComplete={handleCompleteCampaign}
          onUnschedule={handleUnscheduleCampaign}
          onEdit={openEditModal}
          onDelete={handleDeleteCampaign}
          onNew={openCreateModal}
        />
      )}

      <EmailCampaignModal
        open={showCampaignModal}
        onClose={closeModal}
        form={campaignForm}
        onChange={setCampaignForm}
        onSubmit={handleCreateCampaign}
        creating={creatingCampaign}
        audienceCount={audienceCount}
        isEditing={editingCampaignId !== null}
      />
    </div>
  );
}
