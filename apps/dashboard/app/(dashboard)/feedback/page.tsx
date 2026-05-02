'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';

export default function FeedbackPage() {
  const { activePlaceId } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'analytics' | 'complaints'>('complaints');
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [complaintsMeta, setComplaintsMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load analytics data
  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    if (activeTab !== 'analytics') return;
    setIsLoading(true);
    businessApi.getAnalytics(activePlaceId, timeRange)
      .then(setAnalyticsData)
      .catch(err => console.error('Error fetching analytics:', err))
      .finally(() => setIsLoading(false));
  }, [activePlaceId, timeRange, activeTab]);

  // Load complaints
  useEffect(() => {
    if (!activePlaceId || activeTab !== 'complaints') { if(!activePlaceId) setIsLoading(false); return; }
    setIsLoading(true);
    businessApi.getComplaints(activePlaceId)
      .then((res: any) => {
        setComplaints(res.data || []);
        setComplaintsMeta(res.meta || null);
      })
      .catch(err => {
        console.error('Error fetching complaints:', err);
        // Datos de demostración si el backend no está disponible
        setComplaints([
          { id: '1', rating: 2, comment: 'Esperamos más de 40 minutos para que nos atiendan. La comida estaba fría.', customerName: 'María García', customerContact: '+51 987654321', status: 'pending', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { id: '2', rating: 1, comment: 'Encontré un cabello en mi plato. Muy decepcionante.', customerName: 'Carlos López', customerContact: 'carlos@email.com', status: 'pending', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
          { id: '3', rating: 3, comment: 'La comida estaba bien pero el local estaba sucio.', customerName: null, customerContact: null, status: 'resolved', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
          { id: '4', rating: 2, comment: 'Me cobraron de más y el mozo fue grosero cuando le reclamé.', customerName: 'Ana Torres', customerContact: '+51 912345678', status: 'contacted', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
        ]);
        setComplaintsMeta({ total: 4 });
      })
      .finally(() => setIsLoading(false));
  }, [activePlaceId, activeTab]);

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
    <div className="space-y-10 pb-32 max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-border pb-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-text tracking-tight font-warike">Buzón de Feedback</h1>
          <p className="text-text-muted font-bold text-lg max-w-xl leading-snug">
            Quejas interceptadas por el filtro inteligente y métricas de satisfacción.
          </p>
        </div>
        
        {/* Tab Selector */}
        <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1 ring-1 ring-black/5">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'complaints'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:bg-gray-200'
            }`}
          >
            🛡️ Quejas ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'analytics'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:bg-gray-200'
            }`}
          >
            📊 Analíticas
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-gray-400">Cargando datos...</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB: QUEJAS INTERCEPTADAS                       */}
      {/* ═══════════════════════════════════════════════ */}
      {!isLoading && activeTab === 'complaints' && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
            <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 space-y-2">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Quejas Pendientes</p>
              <p className="text-4xl font-black text-red-600">{pendingCount}</p>
              <p className="text-xs font-bold text-red-400">Requieren tu atención</p>
            </div>
            <div className="bg-green-50 p-8 rounded-[2.5rem] border border-green-100 space-y-2">
              <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Resueltas</p>
              <p className="text-4xl font-black text-green-600">{resolvedCount}</p>
              <p className="text-xs font-bold text-green-400">Clientes atendidos</p>
            </div>
            <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 space-y-2">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Desastres Evitados</p>
              <p className="text-4xl font-black text-blue-600">{complaints.length}</p>
              <p className="text-xs font-bold text-blue-400">Reseñas negativas que NO llegaron a Google</p>
            </div>
          </div>

          {/* Complaints List */}
          <div className="space-y-6">
            {complaints.length === 0 ? (
              <div className="bg-white p-16 rounded-[3rem] border border-border text-center space-y-4">
                <div className="text-6xl">🎉</div>
                <h3 className="text-2xl font-black text-text font-warike">¡Sin quejas!</h3>
                <p className="text-text-muted font-bold">Tu filtro inteligente no ha interceptado ninguna queja todavía. ¡Excelente sazón!</p>
              </div>
            ) : (
              complaints.map(complaint => (
                <div key={complaint.id} className={`bg-white p-8 rounded-[2.5rem] border-2 shadow-sm space-y-6 transition-all hover:shadow-lg ${
                  complaint.status === 'pending' ? 'border-red-200' : 'border-green-200 opacity-70'
                }`}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                        complaint.rating <= 1 ? 'bg-red-100' : complaint.rating <= 2 ? 'bg-orange-100' : 'bg-yellow-100'
                      }`}>
                        {complaint.rating <= 1 ? '😡' : complaint.rating <= 2 ? '😞' : '😐'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-text">{complaint.customerName || 'Cliente Anónimo'}</span>
                          {complaint.status === 'pending' && (
                            <span className="bg-red-100 text-red-600 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Pendiente</span>
                          )}
                          {complaint.status === 'resolved' && (
                            <span className="bg-green-100 text-green-600 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Resuelta</span>
                          )}
                          {complaint.status === 'contacted' && (
                            <span className="bg-blue-100 text-blue-600 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Contactado</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5 text-yellow-400 text-sm">
                            {[1,2,3,4,5].map(s => <span key={s}>{s <= complaint.rating ? '★' : '☆'}</span>)}
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">
                            {new Date(complaint.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="bg-background p-6 rounded-2xl border-l-4 border-red-300">
                    <p className="text-sm font-bold text-gray-700 italic leading-relaxed">"{complaint.comment || 'Sin comentario'}"</p>
                  </div>

                  {/* Contact info + Actions */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      {complaint.customerContact && (
                        <a
                          href={complaint.customerContact.includes('@') 
                            ? `mailto:${complaint.customerContact}` 
                            : `https://wa.me/${complaint.customerContact.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-green-50 text-green-700 px-5 py-3 rounded-xl border border-green-200 font-black text-[10px] uppercase tracking-widest hover:bg-green-100 transition-colors"
                        >
                          {complaint.customerContact.includes('@') ? '📧' : '💬'} Contactar
                        </a>
                      )}
                    </div>
                    {complaint.status === 'pending' && (
                      <button
                        onClick={() => handleResolve(complaint.id)}
                        className="bg-text text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-colors"
                      >
                        ✓ Marcar como Resuelta
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
