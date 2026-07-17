'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { useBroadcasts } from '../../../hooks/useBroadcasts';
import { useTemplates } from '../../../hooks/useTemplates';
import { CampaignList } from '../../../components/broadcasts/CampaignList';
import { CampaignModal } from '../../../components/broadcasts/CampaignModal';
import { TemplateList } from '../../../components/broadcasts/TemplateList';
import { TemplateModal } from '../../../components/broadcasts/TemplateModal';

type Tab = 'campaigns' | 'templates';

export default function BroadcastsPage() {
  const { activePlaceId } = useRestaurant();
  const [tab, setTab] = useState<Tab>('campaigns');
  const [loading, setLoading] = useState(true);

  const {
    broadcasts, waNumbers,
    showCampaignModal, setShowCampaignModal,
    campaignForm, setCampaignForm,
    creatingCampaign,
    subscriptionBlocked,
    loadBroadcasts, handleSendBroadcast, handleCreateCampaign,
  } = useBroadcasts();

  const {
    templates, filteredTemplates,
    templateSearch, setTemplateSearch,
    syncing, resendingId, deletingId, togglingId,
    showTemplateModal, setShowTemplateModal,
    templateStep, setTemplateStep,
    templateForm, setTemplateForm,
    creatingTemplate,
    loadTemplates, syncTemplates,
    handleResend, handleDelete, handleToggle, handleCreateTemplate,
    bodyVariables, addVariable, removeVariable,
  } = useTemplates();

  useEffect(() => {
    if (!activePlaceId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([loadBroadcasts(activePlaceId), loadTemplates()])
      .finally(() => setLoading(false));
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
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Campañas Masivas</h1>
        <p className="text-gray-500 mt-1 font-medium">Envía mensajes personalizados de WhatsApp a tus clientes.</p>
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

      {!subscriptionBlocked && (
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {([['campaigns', '💬 Campañas'], ['templates', '📋 Plantilla']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === id ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      {!subscriptionBlocked && tab === 'campaigns' && (
        <CampaignList
          broadcasts={broadcasts}
          onSend={handleSendBroadcast}
          onNew={() => setShowCampaignModal(true)}
        />
      )}

      {!subscriptionBlocked && tab === 'templates' && (
        <TemplateList
          templates={filteredTemplates}
          search={templateSearch}
          onSearch={setTemplateSearch}
          syncing={syncing}
          onSync={syncTemplates}
          onNew={() => { setShowTemplateModal(true); setTemplateStep('info'); }}
          resendingId={resendingId}
          deletingId={deletingId}
          togglingId={togglingId}
          onResend={handleResend}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      )}

      <CampaignModal
        open={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        form={campaignForm}
        onChange={setCampaignForm}
        onSubmit={handleCreateCampaign}
        creating={creatingCampaign}
        waNumbers={waNumbers}
        approvedTemplates={templates.filter(t => t.status === 'APPROVED')}
      />

      <TemplateModal
        open={showTemplateModal}
        onClose={() => { setShowTemplateModal(false); setTemplateStep('info'); }}
        step={templateStep}
        onStep={setTemplateStep}
        form={templateForm}
        onChange={setTemplateForm}
        onSubmit={handleCreateTemplate}
        creating={creatingTemplate}
        bodyVariables={bodyVariables}
        addVariable={addVariable}
        removeVariable={removeVariable}
      />
    </div>
  );
}
