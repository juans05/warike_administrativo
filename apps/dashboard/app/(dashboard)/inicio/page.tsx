'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ClipboardList, MessageCircle, RefreshCw, Star, type LucideIcon } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi, fetchWithAuth, plazbotApi, type TodaySummary } from '../../../lib/api-client';
import { accessOf, matchRoute } from '../../../lib/modules';
import IndependentToday from '../../../components/independent/IndependentToday';
import {
  Button, Card, ChecklistCard, EmptyState, PageHeader, Skeleton, StatTile, buttonStyles, cn,
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

// Estado de cada paso, de los mismos endpoints que usan sus pantallas. `null` = no se pidió o falló: el paso se oculta.
type StepKey = 'ficha' | 'catalogo' | 'whatsapp' | 'bot' | 'fidelizacion' | 'google';
type SetupData = Record<StepKey, boolean | null>;

const hiddenKey = (placeId: string) => `inicio-pasos-ocultos:${placeId}`;

// TO_CHAR(..., 'Day') del backend llega en inglés y con espacios de relleno.
const DAYS_ES: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves',
  friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};
const dayEs = (day: string | null) => (day ? DAYS_ES[day.trim().toLowerCase()] ?? day.trim() : '—');

// Pide un dato para un paso; si falla, `null` (el paso no se muestra en vez de verse pendiente).
const check = <T,>(req: Promise<T>, done: (res: T) => boolean) => req.then(done).catch(() => null);

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
  const { activePlace } = useRestaurant();
  return activePlace?.independent ? <IndependentToday /> : <BusinessInicio />;
}

function BusinessInicio() {
  const { activePlaceId, activePlace } = useRestaurant();
  const config = activePlace?.verticalConfig;
  const labels = config?.labels ?? { catalog: 'Carta', catalogItem: 'Plato', customer: 'Cliente' };

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  // `undefined` = desconocido (error): como en el layout, no se esconde nada y el backend aplica el plan.
  const [tier, setTier] = useState<string | null | undefined>(undefined);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [todayFailed, setTodayFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [reviews, setReviews] = useState<{ connected: boolean; unanswered: number } | null>(null);
  const [checkins, setCheckins] = useState<CheckinStats | null>(null);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [stepsHidden, setStepsHidden] = useState(false);

  useEffect(() => { setName(firstName()); }, []);

  // Rubro y plan: la misma regla del menú lateral (lib/modules.ts), sobre la entrada del menú de cada ruta.
  // `t === undefined` = plan desconocido = abierto (solo filtra el rubro).
  const allows = (href: string, t: string | null | undefined) => {
    const entry = matchRoute(href);
    return !!entry && accessOf(entry, config, t) === 'open';
  };

  useEffect(() => {
    if (!activePlaceId) return;
    let cancelled = false;
    const placeId = activePlaceId;
    setLoading(true);
    setTier(undefined);
    setToday(null);
    setTodayFailed(false);
    setReviews(null);
    setCheckins(null);
    setSetup(null);
    try { setStepsHidden(localStorage.getItem(hiddenKey(placeId)) === '1'); } catch { setStepsHidden(false); }

    fetchWithAuth(`/checkins/business/places/${placeId}/stats`)
      .then((s) => { if (!cancelled) setCheckins(s); })
      .catch(() => {});

    // Todo sale a la vez (sin segunda tanda). Antes de saber el plan solo se filtra por rubro; lo que el plan
    // no incluye responde 403 → `null` y además se oculta al pintar con el plan real.
    const inVertical = (href: string) => allows(href, undefined);

    // Reseñas: llamado aparte (Google puede tardar) que no bloquea la página; si falla, la fila no aparece.
    if (inVertical('/reputacion')) {
      businessApi.getTodayReviews(placeId)
        .then((r) => { if (!cancelled) setReviews(r); })
        .catch(() => {});
    }

    const profileReq = businessApi.getProfile(placeId);
    const ifVertical = (href: string, run: () => Promise<boolean | null>) => (inVertical(href) ? run() : Promise.resolve(null));

    Promise.all([
      businessApi.getSubscriptionTier(placeId).then((r) => (r?.tier ?? null) as string | null).catch(() => undefined),
      businessApi.getToday(placeId).catch(() => null),
      Promise.all([
        check(profileReq, (p) => !!(p?.name && p?.address && p?.coverImageUrl)),
        ifVertical('/carta', () => check(businessApi.getMenu(placeId),
          (m) => Array.isArray(m) && m.some((c: { dishes?: unknown[] }) => (c.dishes?.length ?? 0) > 0))),
        ifVertical('/whatsapp', () => check(businessApi.getWhatsappNumbers(placeId),
          (r) => (r?.data ?? []).some((n: { isActive?: boolean }) => n.isActive))),
        ifVertical('/plazbot', () => check(plazbotApi.getConfig(placeId), (c) => !!c?.botName)),
        ifVertical('/fidelizacion', () => check(fetchWithAuth(`/business/places/${placeId}/loyalty/program`),
          (p) => !!p && p.isActive !== false)),
        check(profileReq, (p) => !!p?.googleLocationName),
      ]),
    ]).then(([tierRes, todayRes, [ficha, catalogo, whatsapp, bot, fidelizacion, google]]) => {
      if (cancelled) return;
      setTier(tierRes);
      setToday(todayRes);
      setTodayFailed(!todayRes);
      setSetup({ ficha, catalogo, whatsapp, bot, fidelizacion, google });
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [activePlaceId, reloadKey]);

  const hideSteps = () => {
    setStepsHidden(true);
    try { if (activePlaceId) localStorage.setItem(hiddenKey(activePlaceId), '1'); } catch { /* sin almacenamiento */ }
  };

  // ── Pasos ── (solo los del plan y el rubro, y solo si su dato cargó)
  const stepDefs: { key: StepKey; href: string; label: string; cta: string }[] = [
    { key: 'ficha', href: '/mi-ficha', label: 'Completa Mi ficha: nombre, dirección y foto de portada', cta: 'Completar' },
    { key: 'catalogo', href: '/carta', label: `Agrega tu primer ${labels.catalogItem.toLowerCase()} a ${labels.catalog}`, cta: 'Agregar' },
    { key: 'whatsapp', href: '/whatsapp', label: 'Conecta tu WhatsApp', cta: 'Conectar' },
    { key: 'bot', href: '/plazbot', label: 'Ponle nombre y personalidad a tu bot', cta: 'Configurar' },
    { key: 'fidelizacion', href: '/fidelizacion', label: 'Activa tu programa de fidelización', cta: 'Activar' },
    { key: 'google', href: '/reputacion', label: 'Conecta tu Google', cta: 'Conectar' },
  ];
  const steps: ChecklistStep[] = !setup ? [] : stepDefs
    .filter((s) => setup[s.key] !== null && allows(s.href, tier))
    .map(({ key, label, href, cta }) => ({ key, label, done: !!setup[key], action: { label: cta, href } }));
  const missing = steps.filter((s) => !s.done).length;
  const showSteps = !stepsHidden && missing > 0;
  const stepsTitle = `Te ${missing === 1 ? 'falta 1 paso' : `faltan ${missing} pasos`} para ${
    tier === 'ia_total' ? 'que tu bot atienda solo' : 'dejar tu negocio listo'
  }`;

  // ── Tu día ──
  const rows: (TodayRowProps & { key: string })[] = [];
  if (today) {
    if (allows('/chat', tier) && today.pendingHumanChats > 0) {
      rows.push({
        key: 'chats', icon: MessageCircle, tone: 'primary',
        title: `${plural(today.pendingHumanChats, 'chat espera', 'chats esperan')} a una persona`,
        detail: 'El bot no supo responder o te pidieron hablar contigo',
        action: { label: 'Responder', href: '/chat', primary: true },
      });
    }
    if (reviews?.connected && reviews.unanswered > 0 && allows('/reputacion', tier)) {
      rows.push({
        key: 'resenas', icon: Star, tone: 'secondary',
        title: `${plural(reviews.unanswered, 'reseña', 'reseñas')} de Google sin responder`,
        detail: 'La IA te sugiere una respuesta',
        action: { label: 'Ver', href: '/reputacion' },
      });
    }
    if (allows('/fidelizacion', tier) && !today.winbackEnabled && today.inactiveLoyalCustomers > 0) {
      rows.push({
        key: 'winback', icon: RefreshCw, tone: 'success',
        title: `${plural(today.inactiveLoyalCustomers, 'cliente no vuelve', 'clientes no vuelven')} hace 30 días`,
        detail: 'Activa el mensaje automático y los invitamos a volver',
        action: { label: 'Activar', href: '/fidelizacion' },
      });
    }
    if (allows('/pedidos', tier) && today.newOrders > 0) {
      rows.push({
        key: 'pedidos', icon: ClipboardList, tone: 'primary',
        title: plural(today.newOrders, 'pedido nuevo', 'pedidos nuevos'),
        detail: 'Esperan que los confirmes',
        action: { label: 'Ver pedidos', href: '/pedidos' },
      });
    }
  }
  // Mensaje automático encendido: no es un pendiente, es un dato.
  const winbackInfo = today && allows('/fidelizacion', tier) && today.winbackEnabled
    ? today.winbacksSentThisWeek > 0
      ? `Tu mensaje de reactivación llegó a ${plural(today.winbacksSentThisWeek, 'cliente', 'clientes')} esta semana`
      : 'Tu mensaje de reactivación está encendido; esta semana no hizo falta enviarlo'
    : null;

  // Sin datos de /today no se deduce nada ("sin pendientes" sería falso).
  const subtitle = today
    ? [
      rows.length ? `Tienes ${plural(rows.length, 'cosa', 'cosas')} para hoy` : 'Hoy no tienes pendientes',
      allows('/chat', tier) && today.botChatsSince24h > 0
        ? `tu bot atendió ${plural(today.botChatsSince24h, 'chat', 'chats')} desde ayer` : null,
    ].filter(Boolean).join(' · ')
    : undefined;

  // ── Números de la semana (según el plan) ──
  const week = today?.weekStats;
  const tiles = week ? ([
    allows('/chat', tier) && { label: 'Chats esta semana', value: week.chats },
    allows('/fidelizacion', tier) && { label: 'Clientes que volvieron', value: week.returningCustomers },
    allows('/reputacion', tier) && {
      label: 'Calificación Google',
      value: week.googleRating != null
        ? <span className="inline-flex items-center gap-1">{week.googleRating.toFixed(1)}<Star size={20} className="fill-secondary text-secondary" aria-label="estrellas" /></span>
        : '—',
    },
  ] as (false | { label: string; value: ReactNode })[]).filter((t): t is { label: string; value: ReactNode } => !!t) : [];

  return (
    <div className="space-y-6">
      <PageHeader title={`${greeting()}${name ? `, ${name}` : ''}`} subtitle={subtitle} />

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
          ) : todayFailed ? (
            <EmptyState icon={AlertCircle} headingLevel="h3" title="No pudimos cargar tus pendientes"
              description="Revisa tu conexión e inténtalo otra vez."
              action={<Button variant="secondary" icon={RefreshCw} onClick={() => setReloadKey((k) => k + 1)}>Reintentar</Button>} />
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
        <Skeleton className="h-24 rounded-card" />
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
            <StatTile label="Tu mejor día del mes" value={dayEs(checkins.bestDayOfWeek)} />
            <StatTile label={`${labels.catalogItem} más pedido`} value={<span className="block truncate text-base">{checkins.topDish?.dishName || '—'}</span>} />
          </div>
        </Section>
      )}
    </div>
  );
}
