'use client';

import { useState, useEffect } from 'react';
import { PartyPopper, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { EmptyState, PageHeader, StatTile, Tabs } from '../../../components/ui';
import { FeedbackInbox } from '../../../components/feedback/FeedbackInbox';
import { FeedbackAnalytics } from '../../../components/feedback/FeedbackAnalytics';
import { useCustomerLabels } from '../../../hooks/useCustomerLabels';

type Tab = 'reviews' | 'complaints' | 'analytics';

export default function FeedbackPage() {
  const { activePlaceId } = useRestaurant();
  const { customers } = useCustomerLabels();
  const [activeTab, setActiveTab] = useState<Tab>('reviews');
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reviews and complaints in parallel on mount so tab badges show correct counts immediately
  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    Promise.allSettled([
      businessApi.getReviews(activePlaceId),
      businessApi.getComplaints(activePlaceId),
    ]).then(([reviewsRes, complaintsRes]) => {
      // Reviews
      if (reviewsRes.status === 'fulfilled') {
        setReviews(reviewsRes.value?.data || []);
      } else {
        console.error('Error fetching reviews:', reviewsRes.reason);
        setReviews([]);
      }

      // Complaints
      if (complaintsRes.status === 'fulfilled') {
        setComplaints(complaintsRes.value?.data || []);
      } else {
        console.error('Error fetching complaints:', complaintsRes.reason);
        setComplaints([]);
        toast.error('No se pudieron cargar las quejas. Recarga la página.');
      }
    }).finally(() => setIsLoading(false));
  }, [activePlaceId]);

  // Load analytics only when analytics tab is active or timeRange changes
  useEffect(() => {
    if (!activePlaceId || activeTab !== 'analytics') return;
    setIsLoading(true);
    businessApi.getAnalytics(activePlaceId, timeRange)
      .then(setAnalyticsData)
      .catch(err => console.error('Error fetching analytics:', err))
      .finally(() => setIsLoading(false));
  }, [activePlaceId, timeRange, activeTab]);

  const handleResolve = async (complaintId: string) => {
    if (!activePlaceId) return;
    try {
      await businessApi.markComplaintResolved(activePlaceId, complaintId);
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString() } : c));
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo marcar como resuelta');
    }
  };

  const onReviewSaved = (updated: any) => setReviews(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  const onComplaintSaved = (updated: any) => setComplaints(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));

  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const resolvedCount = complaints.filter(c => c.status !== 'pending').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Feedback" subtitle={`Lo que tus ${customers} opinan al escanear tu QR o NFC: reseñas, quejas y analíticas.`} />

      <Tabs
        aria-label="Feedback"
        value={activeTab}
        onChange={(key) => setActiveTab(key as Tab)}
        tabs={[
          { key: 'reviews', label: 'Reseñas', badge: reviews.length },
          { key: 'complaints', label: 'Quejas', badge: pendingCount },
          { key: 'analytics', label: 'Analíticas' },
        ]}
      />

      {activeTab === 'reviews' && activePlaceId && (
        <FeedbackInbox
          items={reviews}
          loading={isLoading}
          placeId={activePlaceId}
          onSaved={onReviewSaved}
          emptyState={
            <EmptyState
              icon={Star}
              title="Sin reseñas aún"
              description={`Cuando tus ${customers} dejen 4 o 5 estrellas, aparecerán aquí.`}
              headingLevel="h3"
            />
          }
        />
      )}

      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label="Pendientes" value={pendingCount} />
            <StatTile label="Resueltas" value={resolvedCount} />
            <StatTile label="Evitadas (reseñas negativas)" value={complaints.length} />
          </div>
          {activePlaceId && (
            <FeedbackInbox
              items={complaints}
              loading={isLoading}
              placeId={activePlaceId}
              onSaved={onComplaintSaved}
              onResolve={handleResolve}
              emptyState={
                <EmptyState
                  icon={PartyPopper}
                  title="¡Sin quejas!"
                  description={`Todavía no hay comentarios privados de tus ${customers}.`}
                  headingLevel="h3"
                />
              }
            />
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <FeedbackAnalytics data={analyticsData} loading={isLoading} range={timeRange} onRangeChange={setTimeRange} />
      )}
    </div>
  );
}
