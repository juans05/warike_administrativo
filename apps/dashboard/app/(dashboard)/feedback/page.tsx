'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';

export default function FeedbackPage() {
  const { activePlaceId } = useRestaurant();
  const [timeRange, setTimeRange] = useState('month'); 
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activePlaceId) return;
    setIsLoading(true);
    businessApi.getAnalytics(activePlaceId, timeRange)
      .then(setData)
      .catch(err => console.error('Error fetching analytics:', err))
      .finally(() => setIsLoading(false));
  }, [activePlaceId, timeRange]);

  if (isLoading) return <div className="p-20 text-center font-bold text-gray-400">Analizando datos...</div>;
  if (!data) return <div className="p-20 text-center text-red-400">Error al cargar datos.</div>;

  const stats = [
    { label: 'Calificación', value: data.rating.average.toFixed(1), icon: '⭐', sub: 'Promedio', trend: '', color: 'text-yellow-500' },
    { label: 'Total Opiniones', value: data.rating.total.toLocaleString(), icon: '💬', sub: 'Check-ins', trend: '', color: 'text-green-500' },
    { label: 'NPS Score', value: data.nps.score, icon: '📈', sub: 'Lealtad', trend: '', color: 'text-blue-500' },
    { label: 'Promotores', value: data.nps.promoters, icon: '🚀', sub: 'Clientes VIP', trend: '', color: 'text-orange-500' },
  ];

  const trends = data.trends.map((t: any) => ({
    label: t.period,
    value: Math.min(t.count * 10, 100), // Scale for visual representation
    realCount: t.count
  }));

  const reviews = data.recentReviews;

  const timeRangeLabels: Record<string, string> = {
    'today': 'Hoy',
    'month': 'Este Mes',
    'year': 'Este Año'
  };

  return (
    <div className="space-y-10 pb-20 max-w-6xl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight text-balance">Panel de Feedback Administrativo</h1>
          <p className="text-[#6B7280] font-medium grow">Analiza el pulso de tus clientes y el rendimiento de tu servicio.</p>
        </div>
        
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 self-start md:self-auto ring-1 ring-black/5">
          {['today', 'month', 'year'].map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                timeRange === r 
                ? 'bg-white text-[#F26122] shadow-sm' 
                : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              {timeRangeLabels[r]}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-xl hover:border-[#F26122]/20 transition-all">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-[#F7F8FA] rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-[#1A1A1A]">{stat.value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label} · {stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#1A1A1A] p-8 rounded-[2rem] shadow-xl text-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest">Actividad</h3>
            <p className="text-2xl font-black mt-1">{data.rating.total} opiniones recibidas</p>
          </div>
          
          <div className="flex items-end justify-between h-32 gap-2 mt-8">
            {trends.map((t: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-[#333] rounded-t-lg group-hover:bg-[#F26122] transition-all relative overflow-hidden"
                  style={{ height: `${t.value}%` }}
                >
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/20 opacity-0 group-hover:opacity-100" />
                </div>
                <span className="text-[8px] font-bold text-gray-500 uppercase">{t.label.split('-').pop()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-black text-[#1A1A1A]">Últimas Reseñas</h2>
          </div>
          <div className="space-y-4">
            {reviews.map((review: any, i: number) => (
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
                <p className="text-[#1A1A1A] text-sm leading-relaxed font-semibold italic opacity-80">
                  "{review.comment || 'Sin comentarios.'}"
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-black text-[#1A1A1A] px-2">Análisis de Distribución</h2>
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 space-y-4">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = data.rating.distribution[stars] || 0;
              const percentage = data.rating.total > 0 ? (count / data.rating.total) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-gray-400 w-4">{stars}★</span>
                  <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F26122] rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
