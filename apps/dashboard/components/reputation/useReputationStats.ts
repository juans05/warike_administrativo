'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { businessApi, fetchWithAuth } from '../../lib/api-client';

export type ReputationStats = {
  // NFC / filtrado
  totalTaps: number;
  nfcPercent: number;
  qrPercent: number;
  ratingAverage: number;
  conversionRate: number;
  // Quejas
  pendingComplaints: number;
  resolvedComplaints: number;
  disastersAvoided: number;
  // Redes e impacto
  totalComments: number;
  reviewsSentToGoogle: number;
};

const EMPTY_STATS: ReputationStats = {
  totalTaps: 0, nfcPercent: 0, qrPercent: 0, ratingAverage: 0, conversionRate: 0,
  pendingComplaints: 0, resolvedComplaints: 0, disastersAvoided: 0,
  totalComments: 0, reviewsSentToGoogle: 0,
};

/** Carga las cifras de reputación del local (perfil, quejas, comentarios sociales y analíticas) en paralelo. */
export function useReputationStats(activePlaceId: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ReputationStats>(EMPTY_STATS);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleReviewCount, setGoogleReviewCount] = useState(0);

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);

    // Cargar perfil para obtener googlePlaceId y estado de conexión Google
    businessApi.getProfile(activePlaceId).then(profile => {
      setGooglePlaceId(profile.googlePlaceId || '');
      setGoogleReviewCount(Number(profile.googleTotalReviews) || 0);
      setIsGoogleConnected(
        !!profile.googlePlaceId &&
        (!!profile.googleRating || (profile.googleTotalReviews > 0))
      );
    }).catch(() => { });

    // Cargar datos de todas las fuentes en paralelo
    Promise.allSettled([
      businessApi.getComplaints(activePlaceId),
      fetchWithAuth(`/business/places/${activePlaceId}/social/comments`),
      businessApi.getAnalytics(activePlaceId, 'month'),
    ]).then(([complaintsRes, commentsRes, analyticsRes]) => {
      // Quejas
      const complaints = complaintsRes.status === 'fulfilled' ? complaintsRes.value : null;
      if (complaints?.data) {
        const all = complaints.data;
        setRecentComplaints(all.slice(0, 3));
        setStats(prev => ({
          ...prev,
          pendingComplaints: all.filter((c: any) => c.status === 'pending').length,
          resolvedComplaints: all.filter((c: any) => c.status === 'resolved').length,
          disastersAvoided: complaints.meta?.total || all.length,
        }));
      }

      // Social Comments
      const comments = commentsRes.status === 'fulfilled' ? commentsRes.value : null;
      if (comments?.data) {
        setStats(prev => ({ ...prev, totalComments: comments.meta?.total || 0 }));
      }

      // Analytics
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null;
      if (analytics) {
        setStats(prev => ({
          ...prev,
          totalTaps: analytics.scans?.total || 0,
          nfcPercent: analytics.scans?.nfcPercent || 0,
          qrPercent: analytics.scans?.qrPercent || 0,
          reviewsSentToGoogle: analytics.feedback?.positive || 0,
          conversionRate: analytics.feedback?.conversionRate ?? 0,
          pendingComplaints: analytics.complaints?.pending ?? prev.pendingComplaints,
          resolvedComplaints: analytics.complaints?.resolved ?? prev.resolvedComplaints,
        }));
      }

      // Overwrite rating average and total reviews with real Google data if profile loaded
      businessApi.getProfile(activePlaceId).then(profile => {
        setStats(prev => ({
          ...prev,
          ratingAverage: profile.googleRating ? parseFloat(profile.googleRating) : prev.ratingAverage,
          reviewsSentToGoogle: profile.googleTotalReviews || prev.reviewsSentToGoogle
        }));
      }).catch(() => { });
    }).catch(() => {
      // Sin datos inventados: el dueño no debe confundir cifras demo con las suyas.
      toast.error('No se pudieron cargar tus métricas de reputación. Intenta de nuevo.');
    }).finally(() => setIsLoading(false));
  }, [activePlaceId]);

  /** Tras sincronizar con Google: refleja la calificación y el total que devolvió el servidor. */
  const applySync = (result: { rating?: string; totalReviews?: number }) => {
    setIsGoogleConnected(true);
    setStats(prev => ({
      ...prev,
      ratingAverage: result.rating ? parseFloat(result.rating) : prev.ratingAverage,
      reviewsSentToGoogle: result.totalReviews || prev.reviewsSentToGoogle,
    }));
  };

  return { isLoading, stats, recentComplaints, googlePlaceId, setGooglePlaceId, isGoogleConnected, googleReviewCount, applySync };
}
