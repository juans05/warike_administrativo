'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Script from 'next/script';
import { subscriptionApi } from '../../../lib/api-client';
import { SkeletonPage } from '../../../components/SkeletonLoader';
import { toast } from 'sonner';

declare global {
  interface Window {
    Culqi: any;
    culqi: () => void;
  }
}

interface Subscription {
  id: string;
  status: string;
  tier: string;
  amount: number;
  currency: string;
  cardLast4: string;
  cardBrand: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
  createdAt: string;
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
  createdAt: string;
}

interface PlanInfo {
  tier: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  configured: boolean;
}

const CULQI_PUBLIC_KEY = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY || 'pk_live_xxxxxxxxxxxxxxxx';

export default function SuscripcionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [culqiReady, setCulqiReady] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subData, plansData] = await Promise.all([
        subscriptionApi.getMy().catch(() => null),
        subscriptionApi.getPlans(),
      ]);
      setSubscription(subData);
      setPlans(plansData);
      // Preselect the middle tier (Fidelización+) as the recommended default.
      setSelectedTier((prev) => prev || plansData[1]?.tier || plansData[0]?.tier || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedPlan = plans.find((p) => p.tier === selectedTier) || null;

  const initCulqi = useCallback(() => {
    if (!window.Culqi || !selectedPlan) return;
    window.Culqi.publicKey = CULQI_PUBLIC_KEY;
    window.Culqi.settings({
      title: selectedPlan.name,
      currency: 'PEN',
      description: 'Suscripción mensual',
      amount: selectedPlan.price * 100,
      order: `sub-${Date.now()}`,
    });
    setCulqiReady(true);

    window.culqi = async () => {
      if (window.Culqi.token) {
        const token = window.Culqi.token.id;
        setPaying(true);
        try {
          await subscriptionApi.subscribe(token, selectedPlan.tier);
          window.Culqi.close();
          await load();
        } catch (err: any) {
          toast.error(err.message || 'Error al procesar el pago');
        } finally {
          setPaying(false);
        }
      } else if (window.Culqi.order) {
        // handle order flow if needed
      }
    };
  }, [selectedPlan, load]);

  useEffect(() => {
    if (culqiReady && selectedPlan) initCulqi();
  }, [selectedPlan, culqiReady, initCulqi]);

  const handleSubscribe = () => {
    if (!selectedPlan?.configured) { toast.warning('Este plan todavía no está configurado para cobros.'); return; }
    if (!window.Culqi) { toast.warning('Cargando procesador de pagos...'); return; }
    window.Culqi.open();
  };

  const planName = (tier: string) => plans.find((p) => p.tier === tier)?.name || tier;

  const handleCancel = async () => {
    if (!confirm('¿Cancelar tu suscripción? Perderás acceso al finalizar el período actual.')) return;
    setCanceling(true);
    try {
      await subscriptionApi.cancel();
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar');
    } finally {
      setCanceling(false);
    }
  };

  const fmt = (date: string) =>
    new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

  const fmtMoney = (centavos: number) =>
    `S/. ${(centavos / 100).toFixed(2)}`;

  if (loading) return <SkeletonPage type="default" />;

  const isActive = subscription?.status === 'active';
  const isCanceled = subscription?.status === 'canceled';

  return (
    <>
      <Script
        src="https://checkout.culqi.com/js/v4"
        onLoad={() => { setCulqiReady(true); initCulqi(); }}
        strategy="afterInteractive"
      />

      <div className="space-y-10 pb-20 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header>
          <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Mi Suscripción</h1>
          <p className="text-[#6B7280] font-medium">Gestiona tu plan Wuarike Pro y tu historial de pagos.</p>
        </header>

        {/* Estado de suscripción activa */}
        {isActive && subscription && (
          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl shadow-inner">
                  ✅
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-[#1A1A1A]">{planName(subscription.tier)}</h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                      Activa
                    </span>
                  </div>
                  <p className="text-gray-500 font-medium text-sm">
                    {subscription.cardBrand && (
                      <span className="font-bold text-gray-700">{subscription.cardBrand} •••• {subscription.cardLast4}</span>
                    )}
                    {subscription.cardBrand && ' · '}
                    Próximo cobro el <span className="font-bold text-[#F26122]">{fmt(subscription.currentPeriodEnd)}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-[#1A1A1A]">S/. {(subscription.amount / 100).toFixed(0)}</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">por mes</p>
              </div>
            </div>

            {/* Período actual */}
            <div className="border-t border-gray-50 px-10 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Período actual</p>
                <p className="font-bold text-sm text-[#1A1A1A]">{fmt(subscription.currentPeriodStart)}</p>
                <p className="text-xs text-gray-400 font-medium">hasta {fmt(subscription.currentPeriodEnd)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Plan</p>
                <p className="font-bold text-sm text-[#1A1A1A]">Mensual</p>
                <p className="text-xs text-gray-400 font-medium">Renovación automática</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Miembro desde</p>
                <p className="font-bold text-sm text-[#1A1A1A]">{fmt(subscription.createdAt)}</p>
              </div>
            </div>

            <div className="border-t border-gray-50 px-10 py-5 flex justify-end">
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="text-xs font-black text-red-400 hover:text-red-600 underline underline-offset-4 transition-colors disabled:opacity-50"
              >
                {canceling ? 'Cancelando...' : 'Cancelar suscripción'}
              </button>
            </div>
          </section>
        )}

        {/* Suscripción cancelada */}
        {isCanceled && subscription && (
          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">⏸️</div>
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A]">Suscripción cancelada</h2>
                <p className="text-gray-400 font-medium text-sm">
                  Tu acceso Pro termina el <span className="text-[#F26122] font-bold">{fmt(subscription.currentPeriodEnd)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={paying || !culqiReady}
              className="bg-[#F26122] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#F26122]/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
            >
              Reactivar suscripción
            </button>
          </section>
        )}

        {/* Sin suscripción - elegir plan */}
        {!subscription && plans.length > 0 && (
          <section className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => {
                const isSelected = p.tier === selectedTier;
                const isRecommended = p.tier === plans[1]?.tier;
                return (
                  <button
                    key={p.tier}
                    onClick={() => setSelectedTier(p.tier)}
                    className={`relative text-left rounded-[2rem] border-2 p-8 transition-all ${
                      isSelected
                        ? 'border-[#F26122] shadow-xl shadow-[#F26122]/10 bg-white scale-[1.02]'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-3 left-8 bg-[#F26122] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        Recomendado
                      </span>
                    )}
                    <p className="text-sm font-black text-[#1A1A1A] mb-4">{p.name}</p>
                    <div className="flex items-end gap-1 mb-6">
                      <span className="text-4xl font-black text-[#1A1A1A]">S/. {p.price}</span>
                      <span className="text-sm font-bold text-gray-400 mb-1">/mes</span>
                    </div>
                    <ul className="space-y-3">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#F26122]/10 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-2.5 h-2.5 text-[#F26122]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="font-medium text-xs text-gray-600">{f}</span>
                        </li>
                      ))}
                    </ul>
                    {!p.configured && (
                      <p className="mt-4 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                        Cobro no configurado todavía
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedPlan && (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
                <button
                  onClick={handleSubscribe}
                  disabled={paying || !culqiReady}
                  className="w-full bg-[#F26122] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-[#F26122]/25 hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
                >
                  {paying ? 'Procesando...' : culqiReady ? `Suscribirme a ${selectedPlan.name} — S/. ${selectedPlan.price}/mes` : 'Cargando...'}
                </button>
                <p className="text-center text-[11px] text-gray-400 font-medium mt-4">
                  Pago seguro con tarjeta. Cancela cuando quieras.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Historial de pagos */}
        {subscription?.payments && subscription.payments.length > 0 && (
          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-10 pt-8 pb-4 border-b border-gray-50">
              <h3 className="text-lg font-black text-[#1A1A1A]">Historial de pagos</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {subscription.payments.map((p) => (
                <div key={p.id} className="px-10 py-5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-[#1A1A1A]">
                      {p.paidAt ? fmt(p.paidAt) : fmt(p.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">{subscription ? planName(subscription.tier) : ''} · Mensual</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${p.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {p.status === 'paid' ? 'Pagado' : p.status}
                    </span>
                    <span className="font-black text-[#1A1A1A]">{fmtMoney(p.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
