'use client';

import React, { useEffect, useState } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { useEmailCampaigns } from '../../../hooks/useEmailCampaigns';
import { EmailCampaignList } from '../../../components/email-marketing/EmailCampaignList';
import { EmailCampaignModal } from '../../../components/email-marketing/EmailCampaignModal';

export default function EmailMarketingPage() {
  const { activePlaceId } = useRestaurant();
  const [loading, setLoading] = useState(true);

  const {
    campaigns, audienceCount,
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        <div className="h-10 bg-gray-200 rounded-xl w-1/3 animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-2xl w-48 animate-pulse" />
        <div className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20 space-y-6">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Email Marketing</h1>
        <p className="text-gray-500 mt-1 font-medium">Envía correos personalizados con promociones a tus clientes.</p>
      </div>

      {subscriptionBlocked && (
        <div className="rounded-2xl p-6 border border-[#F26122]/30 bg-[#F26122]/5 space-y-3">
          <p className="font-black text-sm text-gray-900">Función disponible en un plan superior</p>
          <p className="text-sm text-gray-600">{subscriptionBlocked}</p>
          <a
            href="/suscripcion"
            className="inline-block bg-[#F26122] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Ver planes
          </a>
        </div>
      )}

      {!subscriptionBlocked && audienceCount > 0 && (
        <p className="text-xs font-bold text-gray-500">📬 Tienes <strong>{audienceCount}</strong> cliente{audienceCount === 1 ? '' : 's'} que aceptaron recibir promociones por email.</p>
      )}

      {!subscriptionBlocked && (
      <EmailCampaignList
        campaigns={campaigns}
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
