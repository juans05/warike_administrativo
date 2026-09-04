'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../../lib/api-client';
import { SkeletonPage } from '../../../../components/SkeletonLoader';
import { toast } from 'sonner';

interface Opportunity {
  id: string;
  name: string;
  category: { name: string } | null;
  district: { district: string } | null;
  checkinsCount: number;
  favoritesCount: number;
  totalReviews: number;
  score: number;
  commercialStatus: string | null;
}

interface WuarikesHereRequest {
  id: string;
  restaurantName: string;
  district: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  requestedBy: { fullName: string; email: string } | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'afiliado', label: 'Afiliado' },
  { value: 'no_interesado', label: 'No interesado' },
];

const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-50 text-blue-600',
  contactado: 'bg-amber-50 text-amber-600',
  reunion: 'bg-purple-50 text-purple-600',
  negociacion: 'bg-orange-50 text-orange-600',
  afiliado: 'bg-green-50 text-green-600',
  no_interesado: 'bg-gray-100 text-gray-500',
};

function StatusSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (status: string) => void;
}) {
  const current = value || 'nuevo';
  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1.5 rounded-xl text-xs font-black border-0 cursor-pointer ${STATUS_COLORS[current] || 'bg-gray-100 text-gray-500'}`}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default function OportunidadesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [requests, setRequests] = useState<WuarikesHereRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      adminApi.getOpportunities().catch(() => []),
      adminApi.getWuarikesHereRequests().catch(() => []),
    ]).then(([opps, reqs]) => {
      setOpportunities(Array.isArray(opps) ? opps : []);
      setRequests(Array.isArray(reqs) ? reqs : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleOpportunityStatus = async (placeId: string, status: string) => {
    setOpportunities((prev) => prev.map((o) => (o.id === placeId ? { ...o, commercialStatus: status } : o)));
    try {
      await adminApi.updateOpportunityStatus(placeId, status);
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar');
      loadData();
    }
  };

  const handleRequestStatus = async (id: string, status: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await adminApi.updateWuarikesHereRequestStatus(id, status);
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar');
      loadData();
    }
  };

  if (loading) return <SkeletonPage type="table" />;

  return (
    <div className="space-y-12 pb-20 max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Oportunidades Comerciales</h1>
        <p className="text-[#6B7280] font-medium max-w-lg">
          Restaurantes con actividad real que todavía no pagan Wuarikes, más los que la gente está pidiendo.
        </p>
      </header>

      {/* Restaurantes sin reclamar, rankeados por actividad */}
      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-50">
          <h2 className="text-xl font-black text-[#1A1A1A]">🔥 Actividad sin reclamar</h2>
          <p className="text-sm text-gray-500 mt-1">
            {opportunities.length} restaurantes ya generan check-ins/favoritos reales en Wuarikes pero nadie los administra
          </p>
        </div>
        {opportunities.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-bold">No hay oportunidades por ahora</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-gray-100">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Local</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actividad</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {opportunities.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <p className="font-bold text-[#1A1A1A]">{o.name}</p>
                      <p className="text-xs text-gray-400 font-medium">{o.category?.name || '—'} · {o.district?.district || '—'}</p>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-xs text-gray-600 font-bold">{o.checkinsCount} check-ins · {o.favoritesCount} favoritos · {o.totalReviews} reseñas</p>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-lg font-black text-[#F26122]">{o.score}</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <StatusSelect value={o.commercialStatus} onChange={(status) => handleOpportunityStatus(o.id, status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* "Quiero Wuarikes aquí" */}
      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-50">
          <h2 className="text-xl font-black text-[#1A1A1A]">💬 "Quiero Wuarikes aquí"</h2>
          <p className="text-sm text-gray-500 mt-1">{requests.length} pedidos de restaurantes que todavía no están en la plataforma</p>
        </div>
        {requests.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-bold">Nadie ha pedido ninguno todavía</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-gray-100">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Restaurante pedido</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedido por</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <p className="font-bold text-[#1A1A1A]">{r.restaurantName}</p>
                      <p className="text-xs text-gray-400 font-medium">{[r.district, r.address].filter(Boolean).join(' · ') || '—'}</p>
                      {r.notes && <p className="text-xs text-gray-400 mt-1">{r.notes}</p>}
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-bold text-gray-700">{r.requestedBy?.fullName || '—'}</p>
                      <p className="text-xs text-gray-400 font-medium">{r.requestedBy?.email}</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <StatusSelect value={r.status} onChange={(status) => handleRequestStatus(r.id, status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
