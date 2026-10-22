'use client';

import { useState } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { Card, PageHeader, Tabs } from '../../../components/ui';
import GoogleReviews from '../../../components/GoogleReviews';
import ReviewAutomation from '../../../components/ReviewAutomation';
import ScanPromoSettings from '../../../components/ScanPromoSettings';
import { GooglePlaceConnect } from '../../../components/reputation/GooglePlaceConnect';
import { GoogleIcon } from '../../../components/reputation/GoogleIcon';
import { ReputationSummary } from '../../../components/reputation/ReputationSummary';
import { TapsRequestCard } from '../../../components/reputation/TapsRequestCard';
import { useReputationStats } from '../../../components/reputation/useReputationStats';
import { useCustomerLabels } from '../../../hooks/useCustomerLabels';

type Tab = 'bandeja' | 'resumen' | 'ajustes';

const TABS = [
  { key: 'bandeja', label: 'Reseñas' },
  { key: 'resumen', label: 'Resumen' },
  { key: 'ajustes', label: 'Ajustes' },
];

export default function ReputacionPage() {
  const { activePlaceId } = useRestaurant();
  const { customers } = useCustomerLabels();
  const [tab, setTab] = useState<Tab>('bandeja');
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);
  const {
    isLoading, stats, recentComplaints, googlePlaceId, setGooglePlaceId,
    isGoogleConnected, googleReviewCount, applySync,
  } = useReputationStats(activePlaceId);

  // El mismo formulario sirve en la bandeja (sin Google conectado) y en Ajustes: el estado vive aquí.
  const connect = (
    <GooglePlaceConnect
      placeId={activePlaceId}
      googlePlaceId={googlePlaceId}
      onChangeGooglePlaceId={setGooglePlaceId}
      isConnected={isGoogleConnected}
      onSynced={(result) => { applySync(result); setReviewsRefreshKey((k) => k + 1); }}
    />
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Reseñas de Google"
        subtitle={`Responde a tus ${customers} con ayuda de la IA y mira cómo va tu reputación.`}
      />

      <Tabs aria-label="Reseñas de Google" tabs={TABS} value={tab} onChange={(key) => setTab(key as Tab)} />

      {/* La bandeja queda montada al cambiar de pestaña para no volver a pedir las reseñas a Google. */}
      <div hidden={tab !== 'bandeja'}>
        <GoogleReviews refreshKey={reviewsRefreshKey} connectSlot={connect} />
      </div>

      {tab === 'resumen' && activePlaceId && (
        <ReputationSummary
          placeId={activePlaceId}
          stats={stats}
          recentComplaints={recentComplaints}
          isLoading={isLoading}
          googleReviewCount={googleReviewCount}
        />
      )}

      {tab === 'ajustes' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card padding="lg" className="space-y-4 lg:col-span-2">
            <div className="flex items-start gap-3">
              <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
                <GoogleIcon />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text">Conexión con Google</h2>
                <p className="text-sm text-text-muted">Vincula tu local con su ficha de Google para traer tus reseñas.</p>
              </div>
            </div>
            {connect}
          </Card>
          {activePlaceId && <ReviewAutomation placeId={activePlaceId} />}
          {activePlaceId && <ScanPromoSettings placeId={activePlaceId} />}
          {activePlaceId && <TapsRequestCard placeId={activePlaceId} />}
        </div>
      )}
    </div>
  );
}
