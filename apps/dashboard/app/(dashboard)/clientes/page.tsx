'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { fetchWithAuth } from '../../../lib/api-client';

const LEVEL_COLORS: Record<string, string> = {
  BRONCE: 'bg-amber-100 text-amber-700',
  PLATA: 'bg-slate-100 text-slate-600',
  ORO: 'bg-yellow-100 text-yellow-700',
  VIP: 'bg-purple-100 text-purple-700',
};

const LEVEL_EMOJI: Record<string, string> = {
  BRONCE: '🥉', PLATA: '🥈', ORO: '🥇', VIP: '👑',
};

export default function ClientesPage() {
  const { activePlaceId } = useRestaurant();
  const [clients, setClients] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    fetchWithAuth(`/business/places/${activePlaceId}/loyalty/clients?page=${page}`)
      .then(res => {
        setClients(res.data || []);
        setMeta(res.meta || { total: 0, page: 1, totalPages: 1 });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [activePlaceId, page]);

  const handleSelectClient = async (client: any) => {
    setSelected(client);
    try {
      const txs = await fetchWithAuth(`/business/places/${activePlaceId}/loyalty/clients/${client.id}/transactions`);
      setHistory(Array.isArray(txs) ? txs : []);
    } catch { setHistory([]); }
  };

  if (isLoading) return <div className="py-20 text-center font-bold text-gray-400">Cargando clientes...</div>;

  return (
    <div className="max-w-6xl space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-text tracking-tight font-warike">Clientes Frecuentes</h1>
        <p className="text-text-muted font-bold text-lg">CRM de tu programa de fidelización — {meta.total} clientes registrados.</p>
      </header>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total clientes" value={meta.total} color="bg-blue-500" />
        <StatCard icon="👑" label="VIP" value={clients.filter(c => c.level === 'VIP').length} color="bg-purple-500" />
        <StatCard icon="🥇" label="Oro" value={clients.filter(c => c.level === 'ORO').length} color="bg-yellow-500" />
        <StatCard icon="⭐" label="Visitas hoy" value="—" color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista */}
        <div className="lg:col-span-2 space-y-3">
          {clients.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-border text-center">
              <p className="text-4xl mb-4">🎫</p>
              <p className="font-bold text-text-muted">Ningún cliente ha escaneado el NFC aún.</p>
              <p className="text-xs font-bold text-text-muted mt-2">Cuando activen su tarjeta aparecerán aquí.</p>
            </div>
          ) : (
            clients.map(client => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`w-full bg-white p-6 rounded-[2rem] border transition-all text-left hover:shadow-md ${selected?.id === client.id ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-black text-primary">
                      {(client.customerName || client.customerPhone)[0]}
                    </div>
                    <div>
                      <p className="font-black text-text">{client.customerName || `+${client.customerPhone}`}</p>
                      <p className="text-xs font-bold text-text-muted">{client.customerPhone}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${LEVEL_COLORS[client.level]}`}>
                      {LEVEL_EMOJI[client.level]} {client.level}
                    </span>
                    <p className="text-xs font-bold text-text-muted">{client.totalVisits} visitas · {client.stamps} sellos</p>
                  </div>
                </div>
              </button>
            ))
          )}

          {/* Paginación */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-3 pt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-5 py-3 rounded-xl bg-white border border-border font-black text-xs disabled:opacity-40">← Anterior</button>
              <span className="px-5 py-3 font-black text-xs text-text-muted">{page} / {meta.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-5 py-3 rounded-xl bg-white border border-border font-black text-xs disabled:opacity-40">Siguiente →</button>
            </div>
          )}
        </div>

        {/* Detalle del cliente */}
        <div className="space-y-4">
          {selected ? (
            <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6 sticky top-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-2xl font-black text-primary mx-auto">
                  {(selected.customerName || selected.customerPhone)[0]}
                </div>
                <div>
                  <p className="font-black text-text">{selected.customerName || 'Sin nombre'}</p>
                  <p className="text-xs font-bold text-text-muted">{selected.customerPhone}</p>
                </div>
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${LEVEL_COLORS[selected.level]}`}>
                  {LEVEL_EMOJI[selected.level]} {selected.level}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-text">{selected.totalVisits}</p>
                  <p className="text-[9px] font-black text-text-muted uppercase">Visitas</p>
                </div>
                <div className="bg-background p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-primary">{selected.stamps}</p>
                  <p className="text-[9px] font-black text-text-muted uppercase">Sellos</p>
                </div>
                <div className="bg-background p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-green-600">{selected.points}</p>
                  <p className="text-[9px] font-black text-text-muted uppercase">Puntos</p>
                </div>
                <div className="bg-background p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-orange-500">{selected.totalRedeemed}</p>
                  <p className="text-[9px] font-black text-text-muted uppercase">Canjeados</p>
                </div>
              </div>

              {selected.lastVisitAt && (
                <p className="text-[10px] font-bold text-text-muted text-center">
                  Última visita: {new Date(selected.lastVisitAt).toLocaleDateString('es-PE')}
                </p>
              )}

              {history.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Historial reciente</p>
                  {history.slice(0, 5).map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <p className="text-xs font-bold text-text">{tx.description}</p>
                      <span className={`text-xs font-black ${tx.type === 'earn' ? 'text-green-500' : 'text-orange-500'}`}>
                        {tx.type === 'earn' ? '+' : '-'}{tx.stamps || tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[2.5rem] border border-dashed border-border text-center text-text-muted">
              <p className="text-3xl mb-3">👆</p>
              <p className="font-bold text-sm">Selecciona un cliente para ver su detalle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: any; color: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-3 hover:shadow-xl transition-all">
      <div className={`w-10 h-10 ${color} rounded-2xl flex items-center justify-center text-xl`}>{icon}</div>
      <p className="text-2xl font-black text-text">{value}</p>
      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{label}</p>
    </div>
  );
}
