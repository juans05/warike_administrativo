'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Script from 'next/script';
import { subscriptionApi, placeSubscriptionApi } from '../../../lib/api-client';
import { useRestaurant } from '../../../context/RestaurantContext';
import { toast } from 'sonner';
import { AlertTriangle, Check, CheckCircle2, Clock, CreditCard, Lock, PauseCircle, Receipt, Sparkles } from 'lucide-react';
import { Badge, Button, Card, DataList, EmptyState, PageHeader, Skeleton, cn } from '../../../components/ui';

declare global {
  interface Window {
    CulqiCheckout: any;
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

const CULQI_PUBLIC_KEY = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;

export default function SuscripcionPage() {
  const { activePlaceId, places } = useRestaurant();
  const activePlace = places.find((p) => p.id === activePlaceId);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [culqiReady, setCulqiReady] = useState(false);

  const load = useCallback(async () => {
    if (!activePlaceId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [subData, plansData] = await Promise.all([
        placeSubscriptionApi.get(activePlaceId).catch(() => null),
        subscriptionApi.getPlans(),
      ]);
      setSubscription(subData);
      setPlans(plansData);
      // Preselect the plan chosen on the landing (?plan=), else the middle tier (Fidelización+).
      const requestedTier = new URLSearchParams(window.location.search).get('plan');
      const requestedPlan = plansData.find((p: PlanInfo) => p.tier === requestedTier);
      // A canceled subscription is reactivated on its own plan unless the user picks another.
      const previousTier = subData?.status === 'canceled' ? plansData.find((p: PlanInfo) => p.tier === subData.tier)?.tier : undefined;
      setSelectedTier((prev) => prev || requestedPlan?.tier || previousTier || plansData[1]?.tier || plansData[0]?.tier || null);
    } finally {
      setLoading(false);
    }
  }, [activePlaceId]);

  useEffect(() => { load(); }, [load]);

  const selectedPlan = plans.find((p) => p.tier === selectedTier) || null;

  // Culqi Checkout Custom (docs.culqi.com/es/documentacion/checkout/checkout-custom): se crea una
  // instancia por pago con el plan elegido; el token de tarjeta va al backend, que arma la suscripción.
  const handleSubscribe = () => {
    if (!selectedPlan?.configured) { toast.warning('Este plan todavía no está configurado para cobros.'); return; }
    if (!CULQI_PUBLIC_KEY) { toast.error('Falta NEXT_PUBLIC_CULQI_PUBLIC_KEY: los pagos no están configurados.'); return; }
    if (!window.CulqiCheckout) { toast.warning('Cargando procesador de pagos...'); return; }
    const plan = selectedPlan;
    console.log('[Culqi] public key:', CULQI_PUBLIC_KEY, '| plan:', plan.tier, '| amount:', Math.round(plan.price * 100)); // TODO: quitar debug
    const checkout = new window.CulqiCheckout(CULQI_PUBLIC_KEY, {
      settings: {
        title: plan.name,
        currency: 'PEN',
        // 79.99 * 100 = 7998.999… en coma flotante; Culqi exige céntimos enteros.
        amount: Math.round(plan.price * 100),
        // Sin `order`: solo acepta un ID real de la API de Órdenes y no hace falta para tarjeta.
      },
      options: {
        lang: 'auto',
        installments: false,
        modal: true,
        // Solo tarjeta: la suscripción recurrente se cobra a una tarjeta guardada.
        paymentMethods: { tarjeta: true, yape: false, billetera: false, bancaMovil: false, agente: false, cuotealo: false },
        paymentMethodsSort: ['tarjeta'],
      },
      appearance: { menuType: 'sidebar', buttonCardPayText: 'Suscribirme' },
    });
    checkout.culqi = async () => {
      console.log('[Culqi] token:', checkout.token, '| error:', checkout.error); // TODO: quitar debug
      if (checkout.token) {
        if (!activePlaceId) return;
        const token = checkout.token.id;
        checkout.close();
        setPaying(true);
        try {
          await placeSubscriptionApi.subscribe(activePlaceId, token, plan.tier);
          await load();
        } catch (err: any) {
          toast.error(err.message || 'Error al procesar el pago');
        } finally {
          setPaying(false);
        }
      } else if (checkout.error) {
        toast.error(checkout.error.user_message || checkout.error.merchant_message || 'Culqi no pudo procesar la tarjeta');
      }
    };
    checkout.open();
  };

  const planName = (tier: string) => plans.find((p) => p.tier === tier)?.name || tier;

  const handleCancel = async () => {
    if (!activePlaceId) return;
    if (!confirm('¿Cancelar la suscripción de esta sede? Perderá acceso al finalizar el período actual.')) return;
    setCanceling(true);
    try {
      await placeSubscriptionApi.cancel(activePlaceId);
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
    `S/ ${(centavos / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="max-w-5xl space-y-6" role="status" aria-label="Cargando">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-card" />)}
        </div>
      </div>
    );
  }

  const isActive = subscription?.status === 'active';
  const isPending = subscription?.status === 'pending';
  const isPastDue = subscription?.status === 'past_due';
  const isCanceled = subscription?.status === 'canceled';
  // Se puede elegir plan sin suscripción, con el cobro caído o cancelada; con una activa o en proceso el backend rechaza una nueva.
  const canChoose = !subscription || isPastDue || isCanceled;

  const currentLabel = isActive ? 'Plan actual' : isPending ? 'Plan actual · en proceso' : isPastDue ? 'Plan actual · pausado' : isCanceled ? 'Plan actual · cancelado' : '';
  const currentTone = isActive ? 'success' : isPastDue ? 'danger' : isCanceled ? 'neutral' : 'primary';

  return (
    <>
      <Script
        src="https://js.culqi.com/checkout-js"
        onLoad={() => setCulqiReady(true)}
        strategy="afterInteractive"
      />

      <div className="max-w-5xl space-y-6 pb-20">
        <PageHeader
          title="Suscripción"
          subtitle={`Gestiona el plan y el historial de pagos${activePlace ? ` de ${activePlace.name}` : ' de esta sede'}.`}
        />

        {/* Suscrito, pero Culqi todavía no confirmó el primer cobro: el plan se activa al confirmarse */}
        {isPending && subscription && (
          <Card padding="lg" className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Clock size={20} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-text">Estamos procesando el primer pago de tu plan {planName(subscription.tier)}</h2>
              <p className="mt-1 text-sm text-text-muted">
                Tu plan se activa en cuanto Culqi confirme el cobro (normalmente el mismo día). No hace falta que vuelvas a pagar.
              </p>
              <Button variant="ghost" size="sm" className="-ml-3 mt-2 text-danger hover:bg-danger/10 hover:text-danger" onClick={handleCancel} loading={canceling}>
                {canceling ? 'Cancelando...' : 'Cancelar suscripción'}
              </Button>
            </div>
          </Card>
        )}

        {/* Culqi no pudo renovar el cobro: el plan queda pausado hasta que se vuelva a suscribir */}
        {isPastDue && subscription && (
          <Card padding="lg" className="flex items-start gap-4 border-danger/30">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
              <AlertTriangle size={20} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-text">No pudimos cobrar la renovación de tu plan {planName(subscription.tier)}</h2>
              <p className="mt-1 text-sm text-text-muted">
                Tu plan está pausado desde el {fmt(subscription.currentPeriodEnd)}. Vuelve a suscribirte abajo con una tarjeta válida para reactivarlo; el cobro anterior se cancela solo.
              </p>
              <Button variant="ghost" size="sm" className="-ml-3 mt-2 text-danger hover:bg-danger/10 hover:text-danger" onClick={handleCancel} loading={canceling}>
                {canceling ? 'Cancelando...' : 'Cancelar suscripción'}
              </Button>
            </div>
          </Card>
        )}

        {/* Estado de suscripción activa */}
        {isActive && subscription && (
          <Card padding="lg" className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 size={24} aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-text">{planName(subscription.tier)}</h2>
                    <Badge tone="success"><Check size={16} aria-hidden /> Activa</Badge>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
                    {subscription.cardBrand && (
                      <span className="inline-flex items-center gap-1 font-medium text-text">
                        <CreditCard size={16} aria-hidden /> {subscription.cardBrand} •••• {subscription.cardLast4}
                      </span>
                    )}
                    <span>Próximo cobro el <span className="font-medium text-text">{fmt(subscription.currentPeriodEnd)}</span></span>
                  </p>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-2xl font-semibold tabular-nums text-text">{fmtMoney(subscription.amount)}</p>
                <p className="text-sm text-text-muted">por mes</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-text-muted">Período actual</dt>
                <dd className="mt-1 text-sm font-medium text-text">{fmt(subscription.currentPeriodStart)}</dd>
                <dd className="text-sm text-text-muted">hasta {fmt(subscription.currentPeriodEnd)}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Plan</dt>
                <dd className="mt-1 text-sm font-medium text-text">Mensual</dd>
                <dd className="text-sm text-text-muted">Renovación automática</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Miembro desde</dt>
                <dd className="mt-1 text-sm font-medium text-text">{fmt(subscription.createdAt)}</dd>
              </div>
            </dl>

            <div className="flex justify-end border-t border-border pt-4">
              <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10 hover:text-danger" onClick={handleCancel} loading={canceling}>
                {canceling ? 'Cancelando...' : 'Cancelar suscripción'}
              </Button>
            </div>
          </Card>
        )}

        {/* Suscripción cancelada: el acceso sigue hasta el fin del período; se reactiva eligiendo plan abajo */}
        {isCanceled && subscription && (
          <Card padding="lg" className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-text-muted">
              <PauseCircle size={20} aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-text">Suscripción cancelada</h2>
              <p className="mt-1 text-sm text-text-muted">
                Tu acceso termina el <span className="font-medium text-text">{fmt(subscription.currentPeriodEnd)}</span>. Elige un plan abajo para reactivarla.
              </p>
            </div>
          </Card>
        )}

        {/* Planes: se eligen sin suscripción, pausada o cancelada; con una activa se muestran para comparar */}
        {plans.length > 0 ? (
          <section aria-labelledby="planes-title" className="space-y-4">
            <div>
              <h2 id="planes-title" className="text-xl font-semibold text-text">{canChoose ? 'Elige tu plan' : 'Planes'}</h2>
              {!canChoose && (
                <p className="mt-1 text-sm text-text-muted">
                  Para cambiar de plan, cancela tu suscripción actual y elige otro.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {plans.map((p) => {
                const isCurrent = subscription?.tier === p.tier;
                const isSelected = canChoose && p.tier === selectedTier;
                const isHighlighted = p.tier === 'ia_total';
                return (
                  <Card
                    key={p.tier}
                    padding="lg"
                    className={cn('flex flex-col', isSelected ? 'border-primary ring-2 ring-primary/30' : isHighlighted && 'border-primary/40')}
                  >
                    <div className="flex min-h-6 flex-wrap gap-1.5">
                      {isCurrent && <Badge tone={currentTone}>{currentLabel}</Badge>}
                      {isHighlighted && <Badge tone="primary"><Sparkles size={16} aria-hidden /> Recomendado</Badge>}
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-text">{p.name}</h3>
                    <p className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold tabular-nums text-text">S/ {Number(p.price).toFixed(2)}</span>
                      <span className="text-sm text-text-muted">/mes</span>
                    </p>
                    <ul className="mt-4 flex-1 space-y-2">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text">
                          <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-success" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {!p.configured && (
                      <div className="mt-4">
                        <Badge tone="warning"><AlertTriangle size={16} aria-hidden /> Cobro no configurado todavía</Badge>
                      </div>
                    )}
                    {canChoose && (
                      <Button
                        variant="secondary"
                        className={cn('mt-5 w-full', isSelected && 'border-primary text-primary-hover')}
                        aria-pressed={isSelected}
                        icon={isSelected ? Check : undefined}
                        onClick={() => setSelectedTier(p.tier)}
                      >
                        {isSelected ? 'Plan elegido' : 'Elegir este plan'}
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>

            {canChoose && selectedPlan && (
              <Card padding="lg" className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleSubscribe}
                  loading={paying}
                  disabled={!culqiReady}
                >
                  {paying
                    ? 'Procesando...'
                    : culqiReady
                      ? `${isCanceled ? 'Reactivar con' : 'Suscribirme a'} ${selectedPlan.name} — S/ ${Number(selectedPlan.price).toFixed(2)}/mes`
                      : 'Cargando...'}
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-center text-sm text-text-muted">
                  <Lock size={16} aria-hidden /> Pago seguro con tarjeta. Cancela cuando quieras.
                </p>
              </Card>
            )}
          </section>
        ) : (
          !subscription && (
            <Card>
              <EmptyState
                icon={CreditCard}
                title="No pudimos cargar los planes"
                description="Revisa tu conexión y vuelve a intentarlo en unos minutos."
              />
            </Card>
          )
        )}

        {/* Historial de pagos */}
        {subscription && (
          <Card padding="lg">
            <h2 className="text-xl font-semibold text-text">Historial de pagos</h2>
            <DataList
              items={subscription.payments ?? []}
              empty={
                <EmptyState
                  headingLevel="h3"
                  icon={Receipt}
                  title="Aún no hay pagos registrados"
                  description="Cuando se confirme el primer cobro, lo verás aquí."
                />
              }
              renderItem={(p) => (
                <div className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{p.paidAt ? fmt(p.paidAt) : fmt(p.createdAt)}</p>
                    <p className="text-sm text-text-muted">{planName(subscription.tier)} · Mensual</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {p.status === 'paid'
                      ? <Badge tone="success"><Check size={16} aria-hidden /> Pagado</Badge>
                      : <Badge tone="danger"><AlertTriangle size={16} aria-hidden /> {p.status}</Badge>}
                    <span className="text-sm font-semibold tabular-nums text-text">{fmtMoney(p.amount)}</span>
                  </div>
                </div>
              )}
            />
          </Card>
        )}
      </div>
    </>
  );
}
