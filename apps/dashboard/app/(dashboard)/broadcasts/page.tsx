'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { Broadcast, useBroadcasts } from '../../../hooks/useBroadcasts';
import { CampaignList } from '../../../components/broadcasts/CampaignList';
import { CampaignModal } from '../../../components/broadcasts/CampaignModal';
import { CampaignView } from '../../../components/broadcasts/CampaignView';
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
  const [viewing, setViewing] = useState<Broadcast | null>(null);

  const {
    broadcasts, waNumbers, metaTemplates, metaEnabled, imports, loadMetaTemplates,
    showCampaignModal, setShowCampaignModal,
    campaignForm, setCampaignForm,
    creatingCampaign,
    subscriptionBlocked,
    loadBroadcasts, handleSendBroadcast, handleCreateCampaign,
    handlePauseReminder, editingId, openNewCampaign, openEditCampaign,
  } = useBroadcasts();

  useEffect(() => {
    if (!activePlaceId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([loadBroadcasts(activePlaceId), loadMetaTemplates(activePlaceId)])
      .finally(() => setLoading(false));
  }, [activePlaceId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campañas"
        subtitle={`Envía mensajes personalizados de WhatsApp a tus ${customers}.`}
        action={!subscriptionBlocked && !loading && (
          <Button icon={Plus} onClick={openNewCampaign}>Nueva campaña</Button>
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
              onNew={openNewCampaign}
              onView={setViewing}
              onEdit={openEditCampaign}
              onPause={handlePauseReminder}
            />
          )}

          {tab === 'templates' && activePlaceId && !(metaEnabled && waNumbers.some(n => n.provider === 'meta')) && (
            <Card><EmptyState icon={Lock} title="Conecta tu WhatsApp con Facebook" description="Las plantillas se crean en tu cuenta de WhatsApp Business. Conéctala para verlas aquí." action={<Link href="/whatsapp" className={buttonStyles('primary')}>Conectar WhatsApp</Link>} /></Card>
          )}

          {tab === 'templates' && activePlaceId && metaEnabled && waNumbers.some(n => n.provider === 'meta') && (
            <MetaTemplates placeId={activePlaceId} templates={metaTemplates} onChanged={() => loadMetaTemplates(activePlaceId)} />
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
        metaTemplates={metaTemplates}
        metaEnabled={metaEnabled}
        imports={imports}
        editing={!!editingId}
      />

      <CampaignView broadcast={viewing} templates={metaTemplates} onClose={() => setViewing(null)} />

    </div>
  );
}
