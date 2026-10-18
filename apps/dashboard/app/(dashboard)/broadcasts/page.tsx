'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { useBroadcasts } from '../../../hooks/useBroadcasts';
import { useTemplates } from '../../../hooks/useTemplates';
import { CampaignList } from '../../../components/broadcasts/CampaignList';
import { CampaignModal } from '../../../components/broadcasts/CampaignModal';
import { TemplateList } from '../../../components/broadcasts/TemplateList';
import { TemplateModal } from '../../../components/broadcasts/TemplateModal';
import { MetaTemplates } from '../../../components/broadcasts/MetaTemplates';
import Link from 'next/link';
import { plural } from '../../../lib/modules';
import { Lock, Plus } from 'lucide-react';
import { Button, Card, EmptyState, PageHeader, Skeleton, Tabs, buttonStyles } from '../../../components/ui';

type Tab = 'campaigns' | 'templates';

export default function BroadcastsPage() {
  const { activePlaceId, activePlace } = useRestaurant();
  const customers = plural(activePlace?.verticalConfig?.labels.customer ?? 'Cliente').toLowerCase();
  const [tab, setTab] = useState<Tab>('campaigns');
  const [loading, setLoading] = useState(true);

  const {
    broadcasts, waNumbers, metaTemplates, metaEnabled, imports, loadMetaTemplates,
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
    Promise.all([loadBroadcasts(activePlaceId), loadTemplates(), loadMetaTemplates(activePlaceId)])
      .finally(() => setLoading(false));
  }, [activePlaceId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campañas"
        subtitle={`Envía mensajes personalizados de WhatsApp a tus ${customers}.`}
        action={!subscriptionBlocked && !loading && (
          <Button icon={Plus} onClick={() => setShowCampaignModal(true)}>Nueva campaña</Button>
        )}
      />

      {loading ? (
        <div className="space-y-4" role="status" aria-label="Cargando">
          <Skeleton className="h-11 w-56" />
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </div>
      ) : subscriptionBlocked ? (
        <Card>
          <EmptyState
            icon={Lock}
            title="Función disponible en un plan superior"
            description={subscriptionBlocked}
            action={<Link href="/suscripcion" className={buttonStyles('primary')}>Ver planes</Link>}
          />
        </Card>
      ) : (
        <>
          <Tabs
            tabs={[{ key: 'campaigns', label: 'Campañas' }, { key: 'templates', label: 'Plantillas' }]}
            value={tab}
            onChange={(key) => setTab(key as Tab)}
            aria-label="Campañas y plantillas"
          />

          {tab === 'campaigns' && (
            <CampaignList
              broadcasts={broadcasts}
              customers={customers}
              onSend={handleSendBroadcast}
              onNew={() => setShowCampaignModal(true)}
            />
          )}

          {tab === 'templates' && activePlaceId && metaEnabled && waNumbers.some(n => n.provider === 'meta') && (
            <MetaTemplates placeId={activePlaceId} templates={metaTemplates} onChanged={() => loadMetaTemplates(activePlaceId)} />
          )}

          {tab === 'templates' && (
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
        </>
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
        metaTemplates={metaTemplates}
        metaEnabled={metaEnabled}
        imports={imports}
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
