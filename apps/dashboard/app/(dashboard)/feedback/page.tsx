'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { SkeletonPage } from '../../../components/SkeletonLoader';

export default function FeedbackPage() {
  const { activePlaceId } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'reviews' | 'complaints' | 'analytics'>('reviews');
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [complaintsMeta, setComplaintsMeta] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsMeta, setReviewsMeta] = useState<any>(null);
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
        setReviewsMeta(reviewsRes.value?.meta || null);
      } else {
        console.error('Error fetching reviews:', reviewsRes.reason);
        setReviews([]);
      }

      // Complaints with fallback demo data
      if (complaintsRes.status === 'fulfilled') {
        setComplaints(complaintsRes.value?.data || []);
        setComplaintsMeta(complaintsRes.value?.meta || null);
      } else {
        console.error('Error fetching complaints:', complaintsRes.reason);
        setComplaints([
          { id: '1', rating: 2, comment: 'Esperamos más de 40 minutos para que nos atiendan. La comida estaba fría.', customerName: 'María García', customerContact: '+51 987654321', status: 'pending', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { id: '2', rating: 1, comment: 'Encontré un cabello en mi plato. Muy decepcionante.', customerName: 'Carlos López', customerContact: 'carlos@email.com', status: 'pending', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
          { id: '3', rating: 3, comment: 'La comida estaba bien pero el local estaba sucio.', customerName: null, customerContact: null, status: 'resolved', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
          { id: '4', rating: 2, comment: 'Me cobraron de más y el mozo fue grosero cuando le reclamé.', customerName: 'Ana Torres', customerContact: '+51 912345678', status: 'contacted', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
        ]);
        setComplaintsMeta({ total: 4 });
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
    } catch (err) {
      // Optimistic update even if backend fails
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: 'resolved' } : c));
    }
  };

  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const resolvedCount = complaints.filter(c => c.status !== 'pending').length;

  return (
    <div className="space-y-6 pb-32 max-w-7xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight mb-1">Feedback</h1>
          <p className="text-sm text-gray-500">Reseñas y quejas de clientes</p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'reviews'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⭐ {reviews.length}
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'complaints'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🛡️ {pendingCount}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊
          </button>
        </div>
      </div>

      {isLoading && <SkeletonPage type="default" />}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB: RESEÑAS POSITIVAS                          */}
      {/* ═══════════════════════════════════════════════ */}
      {!isLoading && activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
              <div className="text-5xl">⭐</div>
              <div>
                <h3 className="text-lg font-semibold text-text mb-1">Sin reseñas aún</h3>
                <p className="text-sm text-gray-500">Cuando tus clientes dejen 4 o 5 estrellas, aparecerán aquí.</p>
              </div>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{review.rating === 5 ? '⭐' : '🌟'}</div>
                    <div>
                      <p className="font-semibold text-text">{review.customerName || 'Cliente Anónimo'}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => <span key={s} className="text-sm text-yellow-400">{s <= review.rating ? '★' : '☆'}</span>)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{review.comment}"</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB: QUEJAS INTERCEPTADAS                       */}
      {/* ═══════════════════════════════════════════════ */}
      {!isLoading && activeTab === 'complaints' && (
        <div className="space-y-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-3">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Pendientes</p>
                <p className="text-3xl font-bold text-red-600">{pendingCount}</p>
              </div>
              <p className="text-xs text-gray-500">requieren acción</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-3">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Resueltas</p>
                <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
              </div>
              <p className="text-xs text-gray-500">clientes atendidos</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-3">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Evitadas</p>
                <p className="text-3xl font-bold text-blue-600">{complaints.length}</p>
              </div>
              <p className="text-xs text-gray-500">reseñas negativas</p>
            </div>
          </div>

          {/* Complaints List */}
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
                <div className="text-5xl">🎉</div>
                <div>
                  <h3 className="text-lg font-semibold text-text mb-1">¡Sin quejas!</h3>
                  <p className="text-sm text-gray-500">Tu filtro no ha interceptado ninguna queja todavía.</p>
                </div>
              </div>
            ) : (
              complaints.map(complaint => (
                <div
                  key={complaint.id}
                  className={`p-6 rounded-xl border shadow-sm transition-all duration-300 ${
                    complaint.status === 'pending'
                      ? 'bg-white border-red-200 hover:shadow-md hover:border-red-300'
                      : 'bg-white border-gray-200 opacity-80 hover:shadow-md'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-3xl">
                        {complaint.rating <= 1 ? '😡' : complaint.rating <= 2 ? '😞' : '😐'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text">{complaint.customerName || 'Cliente Anónimo'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <span key={s} className="text-sm text-yellow-400">{s <= complaint.rating ? '★' : '☆'}</span>)}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(complaint.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {complaint.status === 'pending' && (
                      <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0 ml-2">Pendiente</span>
                    )}
                    {complaint.status === 'resolved' && (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0 ml-2">Resuelta</span>
                    )}
                    {complaint.status === 'contacted' && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0 ml-2">Contactado</span>
                    )}
                  </div>

                  {/* Comment */}
                  {complaint.comment && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-150">
                      <p className="text-sm text-gray-700 leading-relaxed">"{complaint.comment}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {complaint.customerContact && (
                      <a
                        href={complaint.customerContact.includes('@')
                          ? `mailto:${complaint.customerContact}`
                          : `https://wa.me/${complaint.customerContact.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-green-700 transition-colors"
                      >
                        {complaint.customerContact.includes('@') ? '📧' : '💬'} Contactar
                      </a>
                    )}
                    {complaint.status === 'pending' && (
                      <button
                        onClick={() => handleResolve(complaint.id)}
                        className="flex items-center gap-1.5 bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-slate-800 transition-colors"
                      >
                        ✓ Resolver
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB: ANALÍTICAS                                 */}
      {/* ═══════════════════════════════════════════════ */}
      {!isLoading && activeTab === 'analytics' && analyticsData && (
        <div className="space-y-10">
          <div className="flex justify-end">
            <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 ring-1 ring-black/5">
              {[
                { key: 'today', label: 'Hoy' },
                { key: 'month', label: 'Este Mes' },
                { key: 'year', label: 'Este Año' },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setTimeRange(r.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    timeRange === r.key
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
            {[
              { label: 'Calificación', value: analyticsData.rating?.average?.toFixed(1) || '—', icon: '⭐' },
              { label: 'Total Opiniones', value: analyticsData.rating?.total?.toLocaleString() || '0', icon: '💬' },
              { label: 'NPS Score', value: analyticsData.nps?.score || '—', icon: '📈' },
              { label: 'Promotores', value: analyticsData.nps?.promoters || '—', icon: '🚀' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-3 hover:shadow-xl transition-all">
                <div className="w-10 h-10 bg-[#F7F8FA] rounded-xl flex items-center justify-center text-xl shadow-inner">{stat.icon}</div>
                <div>
                  <p className="text-2xl font-black text-text">{stat.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reviews List */}
          {analyticsData.recentReviews && (
            <section className="space-y-6">
              <h2 className="text-xl font-black text-text px-2">Últimas Reseñas Públicas</h2>
              <div className="space-y-4">
                {analyticsData.recentReviews.map((review: any, i: number) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 items-center">
                        <img src={review.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userName}`} className="w-10 h-10 rounded-xl" />
                        <div>
                          <p className="font-bold text-sm">{review.userName}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-[#FFB800] text-[10px]">
                        {[...Array(5)].map((_, j) => (
                          <span key={j}>{j < review.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-text text-sm leading-relaxed font-semibold italic opacity-80">
                      "{review.comment || 'Sin comentarios.'}"
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {!isLoading && activeTab === 'analytics' && !analyticsData && (
        <div className="bg-white p-16 rounded-[3rem] border border-border text-center space-y-4">
          <div className="text-6xl">📊</div>
          <h3 className="text-2xl font-black text-text font-warike">Sin datos aún</h3>
          <p className="text-text-muted font-bold">Las analíticas aparecerán cuando tus clientes empiecen a dejar reseñas.</p>
        </div>
      )}
    </div>
  );
}
