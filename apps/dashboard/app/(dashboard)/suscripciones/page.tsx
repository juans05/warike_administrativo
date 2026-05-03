'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { subscriptionApi } from '../../../lib/api-client';

interface SubscriptionRecord {
  id: string;
  userId: string;
  status: string;
  amount: number;
  currency: string;
  cardLast4: string;
  cardBrand: string;
  currentPeriodEnd: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

interface Stats {
  activeSubscriptions: number;
  canceledSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  planAmount: number;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Activa', cls: 'bg-green-50 text-green-600' },
  canceled: { label: 'Cancelada', cls: 'bg-gray-100 text-gray-500' },
  past_due: { label: 'Vencida', cls: 'bg-red-50 text-red-500' },
};

export default function SuscripcionesPage() {
  const [subs, setSubs] = useState<SubscriptionRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subsData, statsData] = await Promise.all([
        subscriptionApi.adminGetAll(page),
        subscriptionApi.adminGetStats(),
      ]);
      setSubs(subsData.data);
      setTotalPages(subsData.meta.totalPages);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading subscriptions', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const fmt = (date: string) =>
    new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-10 pb-20 max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Suscripciones</h1>
        <p className="text-[#6B7280] font-medium">Ingresos recurrentes y estado de pagos de la plataforma.</p>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Suscripciones activas"
            value={stats.activeSubscriptions.toString()}
            icon="✅"
            color="green"
          />
          <StatCard
            label="Ingresos este mes"
            value={`S/. ${stats.monthlyRevenue.toLocaleString()}`}
            icon="📈"
            color="orange"
          />
          <StatCard
            label="Ingresos totales"
            value={`S/. ${stats.totalRevenue.toLocaleString()}`}
            icon="💰"
            color="blue"
          />
          <StatCard
            label="Canceladas"
            value={stats.canceledSubscriptions.toString()}
            icon="⏸️"
            color="gray"
          />
        </div>
      )}

      {/* Table */}
      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#1A1A1A]">Todas las suscripciones</h2>
          <span className="text-sm font-bold text-gray-400">
            {stats ? `${stats.activeSubscriptions} activas` : ''}
          </span>
        </div>

        {loading && subs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-4 border-[#F26122] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-bold text-sm">Cargando...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-gray-100">
                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarjeta</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Próximo cobro</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto/mes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-10 py-16 text-center text-gray-400 font-medium text-sm">
                        No hay suscripciones registradas aún.
                      </td>
                    </tr>
                  )}
                  {subs.map((sub) => {
                    const st = STATUS_LABELS[sub.status] || { label: sub.status, cls: 'bg-gray-100 text-gray-500' };
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-10 py-5">
                          <p className="font-bold text-[#1A1A1A] text-sm">{sub.user?.fullName || '—'}</p>
                          <p className="text-xs text-gray-400 font-medium">{sub.user?.email || '—'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {sub.cardLast4 ? (
                            <p className="font-bold text-sm text-[#1A1A1A]">
                              {sub.cardBrand} •••• {sub.cardLast4}
                            </p>
                          ) : (
                            <span className="text-gray-300 font-medium text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          {sub.status === 'active' && sub.currentPeriodEnd ? (
                            <p className="font-bold text-sm text-[#1A1A1A]">{fmt(sub.currentPeriodEnd)}</p>
                          ) : (
                            <span className="text-gray-300 font-medium text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <p className="font-black text-[#F26122]">
                            S/. {(sub.amount / 100).toFixed(0)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-10 py-6 border-t border-gray-50 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs font-black text-gray-400 hover:text-[#F26122] disabled:opacity-30 transition-colors"
                >
                  ← Anterior
                </button>
                <p className="text-xs font-bold text-gray-400">
                  Página {page} de {totalPages}
                </p>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-xs font-black text-gray-400 hover:text-[#F26122] disabled:opacity-30 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: 'green' | 'orange' | 'blue' | 'gray';
}) {
  const colorMap = {
    green: 'bg-green-50',
    orange: 'bg-[#F26122]/5',
    blue: 'bg-blue-50',
    gray: 'bg-gray-50',
  };
  return (
    <div className={`${colorMap[color]} rounded-3xl p-6`}>
      <div className="text-2xl mb-3">{icon}</div>
      <p className="text-2xl font-black text-[#1A1A1A] tracking-tight">{value}</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}
