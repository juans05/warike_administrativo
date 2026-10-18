'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardList, MessageCircle, RefreshCw, Star, type LucideIcon } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi, fetchWithAuth, plazbotApi, type TodaySummary } from '../../../lib/api-client';
import { accessOf, matchRoute } from '../../../lib/modules';
import {
  Card, ChecklistCard, EmptyState, PageHeader, Skeleton, StatTile, buttonStyles, cn,
  type ChecklistStep,
} from '../../../components/ui';

interface CheckinStats {
  checkinsThisWeek: number;
  checkinsThisMonth: number;
  bestDayOfWeek: string | null;
  topDish: { dishName: string; orders: number } | null;
  newCustomersThisMonth: number;
  returningCustomersThisMonth: number;
}

// Datos para marcar cada paso, de los mismos endpoints que usan sus pantallas. `null` = no se pidió o falló.
interface SetupData {
  profile: { name?: string; address?: string; coverImageUrl?: string; googleLocationName?: string | null } | null;
  menu: { dishes?: unknown[] }[] | null;
  whatsapp: { isActive?: boolean }[] | null;
  botName: string | null;
  loyaltyActive: boolean;
}

const hiddenKey = (placeId: string) => `inicio-pasos-ocultos:${placeId}`;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

function firstName(): string {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return (user?.fullName || '').trim().split(/\s+/)[0] || '';
  } catch {
    return '';
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Tone = 'primary' | 'secondary' | 'success';
const toneStyles: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  secondary: 'bg-secondary/20 text-text', // secondary nunca como color de texto
  success: 'bg-success/10 text-success',
};

type TodayRowProps = {
  icon: LucideIcon; tone: Tone; title: string; detail: string; action: { label: string; href: string; primary?: boolean };
};

function TodayRow({ icon: Icon, tone, title, detail, action }: TodayRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-control', toneStyles[tone])}>
        <Icon size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{title}</p>
        <p className="text-sm text-text-muted">{detail}</p>
      </div>
      <Link href={action.href} className={buttonStyles(action.primary ? 'primary' : 'secondary', 'sm', 'ml-auto')}>
        {action.label}
      </Link>
    </li>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export default function InicioPage() {
  const { activePlaceId, activePlace } = useRestaurant();
  const config = activePlace?.verticalConfig;
  const labels = config?.labels ?? { catalog: 'Carta', catalogItem: 'Plato', customer: 'Cliente' };

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  // `undefined` = desconocido (error): como en el layout, no se esconde nada y el backend aplica el plan.
  const [tier, setTier] = useState<string | null | undefined>(undefined);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [reviews, setReviews] = useState<{ connected: boolean; unanswered: number } | null>(null);
  const [checkins, setCheckins] = useState<CheckinStats | null>(null);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [stepsHidden, setStepsHidden] = useState(false);

  useEffect(() => { setName(firstName()); }, []);

  // Rubro y plan: la misma regla del menú lateral (lib/modules.ts), sobre la entrada del menú de cada ruta.
  const allows = (href: string, t: string | null | undefined = tier) => {
    const entry = matchRoute(href);
    return !!entry && accessOf(entry, config, t) === 'open';
  };

  useEffect(() => {
    if (!activePlaceId) return;
    let cancelled = false;
    const placeId = activePlaceId;
    setLoading(true);
    setToday(null);
    setReviews(null);
    setCheckins(null);
    setSetup(null);
    try { setStepsHidden(localStorage.getItem(hiddenKey(placeId)) === '1'); } catch { setStepsHidden(false); }

    fetchWithAuth(`/checkins/business/places/${placeId}/stats`)
      .then((s) => { if (!cancelled) setCheckins(s); })
      .catch(() => {});

    (async () => {
      const [tierRes, todayRes] = await Promise.all([
        businessApi.getSubscriptionTier(placeId).then((r) => (r?.tier ?? null) as string | null).catch(() => undefined),
        businessApi.getToday(placeId).catch(() => null),
      ]);
      if (cancelled) return;
      setTier(tierRes);
      setToday(todayRes);
      setLoading(false);

      const can = (href: string) => allows(href, tierRes);

      // Reseñas: llamado aparte (Google puede tardar); si falla, la fila no aparece.
      if (can('/reputacion')) {
        businessApi.getTodayReviews(placeId)
          .then((r) => { if (!cancelled) setReviews(r); })
          .catch(() => {});
      }

      // Pasos: solo se piden los datos de los módulos que el plan y el rubro permiten.
      const [profile, menu, whatsapp, bot, loyalty] = await Promise.all([
        businessApi.getProfile(placeId).catch(() => null),
        can('/carta') ? businessApi.getMenu(placeId).catch(() => null) : null,
        can('/whatsapp') ? businessApi.getWhatsappNumbers(placeId).then((r) => r?.data ?? []).catch(() => null) : null,
        can('/plazbot') ? plazbotApi.getConfig(placeId).catch(() => null) : null,
        can('/fidelizacion') ? fetchWithAuth(`/business/places/${placeId}/loyalty/program`).catch(() => null) : null,
      ]);
      if (cancelled) return;
      setSetup({
        profile,
        menu: Array.isArray(menu) ? menu : null,
        whatsapp: Array.isArray(whatsapp) ? whatsapp : null,
        botName: bot?.botName || null,
        loyaltyActive: !!loyalty && loyalty.isActive !== false,
      });
    })();

    return () => { cancelled = true; };
  }, [activePlaceId]);

  const hideSteps = () => {
    setStepsHidden(true);
    try { if (activePlaceId) localStorage.setItem(hiddenKey(activePlaceId), '1'); } catch { /* sin almacenamiento */ }
  };

  // ── Pasos ──
  const profile = setup?.profile;
  const steps: ChecklistStep[] = !setup || !profile ? [] : ([
    {
      key: 'ficha', href: '/mi-ficha', label: 'Completa Mi ficha: nombre, dirección y foto de portada', cta: 'Completar',
      done: !!(profile.name && profile.address && profile.coverImageUrl),
    },
    {
      key: 'catalogo', href: '/carta', label: `Agrega tu primer ${labels.catalogItem.toLowerCase()} a ${labels.catalog}`, cta: 'Agregar',
      done: !!setup.menu?.some((c) => (c.dishes?.length ?? 0) > 0),
    },
    {
      key: 'whatsapp', href: '/whatsapp', label: 'Conecta tu WhatsApp', cta: 'Conectar',
      done: !!setup.whatsapp?.some((n) => n.isActive),
    },
    {
      key: 'bot', href: '/plazbot', label: 'Ponle nombre y personalidad a tu bot', cta: 'Configurar',
      done: !!setup.botName,
    },
    {
      key: 'fidelizacion', href: '/fidelizacion', label: 'Activa tu programa de fidelización', cta: 'Activar',
      done: setup.loyaltyActive,
    },
    {
      key: 'google', href: '/reputacion', label: 'Conecta tu Google', cta: 'Conectar',
      done: !!profile.googleLocationName,
    },
  ])
    .filter((s) => allows(s.href))
    .map(({ key, label, done, href, cta }) => ({ key, label, done, action: { label: cta, href } }));
  const missing = steps.filter((s) => !s.done).length;
  const showSteps = !stepsHidden && missing > 0;
  const stepsTitle = `Te ${missing === 1 ? 'falta 1 paso' : `faltan ${missing} pasos`} para ${
    tier === 'ia_total' ? 'que tu bot atienda solo' : 'dejar tu negocio listo'
  }`;

  // ── Tu día ──
  const rows: (TodayRowProps & { key: string })[] = [];
  if (today) {
    if (allows('/chat') && today.pendingHumanChats > 0) {
      rows.push({
        key: 'chats', icon: MessageCircle, tone: 'primary',
        title: `${plural(today.pendingHumanChats, 'chat espera', 'chats esperan')} a una persona`,
        detail: 'El bot no supo responder o te pidieron hablar contigo',
        action: { label: 'Responder', href: '/chat', primary: true },
      });
    }
    if (reviews?.connected && reviews.unanswered > 0 && allows('/reputacion')) {
      rows.push({
        key: 'resenas', icon: Star, tone: 'secondary',
        title: `${plural(reviews.unanswered, 'reseña', 'reseñas')} de Google sin responder`,
        detail: 'La IA te sugiere una respuesta',
        action: { label: 'Ver', href: '/reputacion' },
      });
    }
    if (allows('/fidelizacion') && !today.winbackEnabled && today.inactiveLoyalCustomers > 0) {
      rows.push({
        key: 'winback', icon: RefreshCw, tone: 'success',
        title: `${plural(today.inactiveLoyalCustomers, 'cliente no vuelve', 'clientes no vuelven')} hace 30 días`,
        detail: 'Activa el mensaje automático y los invitamos a volver',
        action: { label: 'Activar', href: '/fidelizacion' },
      });
    }
    if (allows('/pedidos') && today.newOrders > 0) {
      rows.push({
        key: 'pedidos', icon: ClipboardList, tone: 'primary',
        title: plural(today.newOrders, 'pedido nuevo', 'pedidos nuevos'),
        detail: 'Esperan que los confirmes',
        action: { label: 'Ver pedidos', href: '/pedidos' },
      });
    }
  }
  // Mensaje automático encendido: no es un pendiente, es un dato.
  const winbackInfo = today && allows('/fidelizacion') && today.winbackEnabled
    ? today.winbacksSentThisWeek > 0
      ? `Tu mensaje de reactivación llegó a ${plural(today.winbacksSentThisWeek, 'cliente', 'clientes')} esta semana`
      : 'Tu mensaje de reactivación está encendido; esta semana no hizo falta enviarlo'
    : null;

  const subtitleParts = [
    today ? (rows.length ? `Tienes ${plural(rows.length, 'cosa', 'cosas')} para hoy` : 'Hoy no tienes pendientes') : null,
    today && allows('/chat') && today.botChatsSince24h > 0
      ? `tu bot atendió ${plural(today.botChatsSince24h, 'chat', 'chats')} desde ayer` : null,
  ].filter(Boolean);
  const subtitle = subtitleParts.length
    ? subtitleParts.join(' · ')
    : `Así va ${activePlace?.name ?? 'tu negocio'} hoy`;

  // ── Números de la semana (según el plan) ──
  const week = today?.weekStats;
  const tiles = week ? ([
    allows('/chat') && { label: 'Chats esta semana', value: week.chats },
    allows('/fidelizacion') && { label: 'Clientes que volvieron', value: week.returningCustomers },
    allows('/reputacion') && {
      label: 'Calificación Google',
      value: week.googleRating != null
        ? <span className="inline-flex items-center gap-1">{week.googleRating.toFixed(1)}<Star size={20} className="fill-secondary text-secondary" aria-label="estrellas" /></span>
        : '—',
    },
  ] as (false | { label: string; value: ReactNode })[]).filter((t): t is { label: string; value: ReactNode } => !!t) : [];

  return (
    <div className="space-y-6">
      <PageHeader title={`${greeting()}${name ? `, ${name}` : ''}`} subtitle={loading ? undefined : subtitle} />

      {showSteps && <ChecklistCard title={stepsTitle} steps={steps} onDismiss={hideSteps} />}

      <Section title="Tu día">
        <Card padding="sm">
          {loading ? (
            <div className="space-y-4 py-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10" />
                  <div className="flex-1 space-y-2"><Skeleton className="w-2/3" /><Skeleton className="w-1/3" /></div>
                </div>
              ))}
            </div>
          ) : rows.length ? (
            <ul className="divide-y divide-border">{rows.map(({ key, ...row }) => <TodayRow key={key} {...row} />)}</ul>
          ) : (
            <EmptyState icon={CheckCircle2} headingLevel="h3" title="Todo al día"
              description="No tienes pendientes por ahora. Te avisamos aquí cuando algo necesite tu atención." />
          )}
          {winbackInfo && (
            <p className="flex items-center gap-2 border-t border-border pt-3 text-sm text-text-muted">
              <RefreshCw size={16} className="shrink-0 text-success" aria-hidden />
              {winbackInfo}
            </p>
          )}
        </Card>
      </Section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        </div>
      ) : tiles.length > 0 && (
        <Section title="Tu semana">
          <div className={cn('grid grid-cols-1 gap-4', tiles.length > 1 && 'sm:grid-cols-2', tiles.length > 2 && 'lg:grid-cols-3')}>
            {tiles.map((t) => <StatTile key={t.label} label={t.label} value={t.value} />)}
          </div>
        </Section>
      )}

      {checkins && (
        <Section
          title="Visitas y check-ins"
          subtitle={`Este mes te descubrieron ${plural(checkins.newCustomersThisMonth, 'persona nueva', 'personas nuevas')}${
            checkins.returningCustomersThisMonth > 0 ? ` y ${checkins.returningCustomersThisMonth} volvieron` : ''
          }.`}
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Check-ins esta semana" value={checkins.checkinsThisWeek} />
            <StatTile label="Check-ins este mes" value={checkins.checkinsThisMonth} />
            <StatTile label="Tu mejor día del mes" value={checkins.bestDayOfWeek || '—'} />
            <StatTile label={`${labels.catalogItem} más pedido`} value={<span className="block truncate text-base">{checkins.topDish?.dishName || '—'}</span>} />
          </div>
        </Section>
      )}
    </div>
  );
}
