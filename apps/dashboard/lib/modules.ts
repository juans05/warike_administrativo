import {
  BarChart3,
  Boxes,
  Briefcase,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Gift,
  LayoutGrid,
  Mail,
  MessageSquareText,
  MessagesSquare,
  Nfc,
  PawPrint,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Star,
  Ticket,
  Store,
  Camera,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type AssetKind = 'PET' | 'VEHICLE';

// Mirrors backend ModuleKey (huarique_backend/src/modules/places/business-types.ts) — keep in sync.
export type ModuleKey =
  | 'reputacion' | 'social' | 'carta' | 'pedidos' | 'cocina' | 'mesas' | 'fidelizacion' | 'clientes'
  | 'email-marketing' | 'whatsapp' | 'plazbot' | 'chat' | 'reportes' | 'equipo' | 'broadcasts' | 'ia' | 'agenda' | 'caja' | 'inventario';

export interface VerticalConfig {
  label: string;
  modules: ModuleKey[];
  labels: { catalog: string; catalogItem: string; customer: string };
  catalogKind: 'producto' | 'servicio' | 'mixto';
  teamRoles: string[];
  botPersona?: string;
  /** Ficha que se atiende en la cita: mascota (veterinaria, grooming) o vehículo (taller, lavadero). */
  assetKind?: AssetKind | null;
}

// Mirrors backend TIER_ORDER (subscriptions.service.ts) — keep in sync.
export type SubscriptionTier = 'reputacion' | 'fidelizacion' | 'ia_total';
const TIER_ORDER: SubscriptionTier[] = ['reputacion', 'fidelizacion', 'ia_total'];
// Planes por rubro (backend TIER_EQUIVALENT): abren lo mismo que el tier indicado.
const TIER_EQUIVALENT: Record<string, SubscriptionTier> = { barbero: 'ia_total' };

export function hasTierAccess(ownedTier: string | null, requiredTier: SubscriptionTier): boolean {
  if (!ownedTier) return false;
  const ownedIndex = TIER_ORDER.indexOf((TIER_EQUIVALENT[ownedTier] ?? ownedTier) as SubscriptionTier);
  const requiredIndex = TIER_ORDER.indexOf(requiredTier);
  return ownedIndex !== -1 && ownedIndex >= requiredIndex;
}

type Labels = VerticalConfig['labels'];
const DEFAULT_LABELS: Labels = { catalog: 'Carta', catalogItem: 'Plato', customer: 'Cliente' };

export interface NavLeaf {
  href: string;
  label: string | ((labels: Labels) => string);
  module?: ModuleKey;
  tier?: SubscriptionTier;
}
export interface NavItem extends NavLeaf {
  icon: LucideIcon;
  /** Icono según el rubro (vertical); si falta, `icon`. */
  icons?: Record<string, LucideIcon>;
  children?: NavLeaf[];
}
export interface NavGroup {
  group: 'Mi negocio' | 'Clientes' | 'Reputación';
  subtitle: string;
  items: NavItem[];
}

// "Cliente" → "Clientes", "Tutor" → "Tutores".
export const plural = (word: string) => (/[aeiouáéíóú]$/i.test(word) ? `${word}s` : `${word}es`);

// Spec 2026-10-18-rediseno-panel-design.md §4.3: groups, routes and the plan each section asks for.
export const NAV: NavGroup[] = [
  {
    group: 'Mi negocio',
    subtitle: 'Tu ficha, catálogo y operación',
    items: [
      { href: '/mi-ficha', label: 'Mi ficha', icon: Store },
      {
        href: '/carta', label: (l) => l.catalog, icon: UtensilsCrossed, module: 'carta', tier: 'reputacion',
        icons: { belleza: Scissors, comercio: ShoppingBag, salud: Stethoscope, mascotas: PawPrint, automotriz: Wrench, servicios: Briefcase, entretenimiento: Ticket },
      },
      { href: '/agenda', label: 'Agenda', icon: CalendarDays, module: 'agenda', tier: 'reputacion' },
      { href: '/pedidos', label: 'Pedidos', icon: ClipboardList, module: 'pedidos', tier: 'reputacion' },
      { href: '/cocina', label: 'Cocina', icon: ChefHat, module: 'cocina', tier: 'reputacion' },
      { href: '/mesas', label: 'Mesas', icon: LayoutGrid, module: 'mesas', tier: 'reputacion' },
      { href: '/inventario', label: 'Inventario', icon: Boxes, module: 'inventario', tier: 'reputacion' },
      // Caja: cuentas de mesa, venta directa en mostrador y cobro de citas (todos los rubros).
      { href: '/caja', label: 'Caja', icon: Wallet, module: 'caja', tier: 'reputacion' },
      // Not listed in §4.3's plan rule; keeps today's plan (it lived under canReputacion).
      { href: '/social', label: 'Instagram IA', icon: Camera, module: 'social', tier: 'reputacion' },
    ],
  },
  {
    group: 'Clientes',
    subtitle: 'Conversaciones y relación',
    items: [
      {
        href: '/whatsapp', label: 'WhatsApp', icon: MessagesSquare, module: 'whatsapp', tier: 'ia_total',
        children: [
          { href: '/chat', label: 'Chats', module: 'chat', tier: 'ia_total' },
          { href: '/plazbot', label: 'Mi bot', module: 'plazbot', tier: 'ia_total' },
          { href: '/ia', label: 'Base de IA', module: 'ia', tier: 'ia_total' },
          { href: '/broadcasts', label: 'Campañas', module: 'broadcasts', tier: 'ia_total' },
        ],
      },
      { href: '/clientes', label: (l) => plural(l.customer), icon: Users, module: 'clientes', tier: 'fidelizacion' },
      { href: '/fidelizacion', label: 'Fidelización', icon: Gift, module: 'fidelizacion', tier: 'fidelizacion' },
      { href: '/email-marketing', label: 'Email marketing', icon: Mail, module: 'email-marketing', tier: 'ia_total' },
      { href: '/equipo', label: 'Equipo', icon: UserPlus, module: 'equipo', tier: 'ia_total' },
    ],
  },
  {
    group: 'Reputación',
    subtitle: 'Lo que dicen de ti',
    items: [
      { href: '/reputacion', label: 'Reseñas Google', icon: Star, module: 'reputacion', tier: 'reputacion' },
      { href: '/feedback', label: 'Feedback', icon: MessageSquareText },
      { href: '/reportes', label: 'Reportes', icon: BarChart3, module: 'reportes', tier: 'ia_total' },
      { href: '/hardware', label: 'Tienda NFC', icon: Nfc },
    ],
  },
];

const NAV_LEAVES: NavLeaf[] = NAV.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]));

export const ROUTE_MODULE: Record<string, ModuleKey> = Object.fromEntries(
  NAV_LEAVES.filter((l) => l.module).map((l) => [l.href, l.module as ModuleKey]),
);

/** Nav entry owning a pathname: exact match or a sub-route (e.g. /pedidos/configuracion). */
export function matchRoute(pathname: string): NavLeaf | undefined {
  return NAV_LEAVES.find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`));
}

export function isModuleVisible(config: VerticalConfig | undefined, key: ModuleKey): boolean {
  return !config || config.modules.includes(key);
}

export function navLabel(label: NavLeaf['label'], config: VerticalConfig | undefined): string {
  return typeof label === 'function' ? label(config?.labels ?? DEFAULT_LABELS) : label;
}

export type Access = 'hidden' | 'locked' | 'open';

/** Igual que accessOf, pero un miembro con perfil solo ve las secciones de su perfil (allowed = null: sin perfil). */
export function accessFor(entry: NavLeaf, config: VerticalConfig | undefined, tier: string | null | undefined, allowed: string[] | null): Access {
  if (allowed && !(entry.module && allowed.includes(entry.module))) return 'hidden';
  return accessOf(entry, config, tier);
}

/** Primera sección abierta para quien tiene perfil (adónde mandarlo si entra a una que no le toca). */
export function firstAllowedHref(config: VerticalConfig | undefined, tier: string | null | undefined, allowed: string[]): string {
  return NAV_LEAVES.find((l) => accessFor(l, config, tier, allowed) === 'open')?.href ?? '/mi-cuenta';
}

/**
 * Visibility rule (rubro y plan): hidden when the vertical lacks the module, locked when the plan
 * falls short. `tier === undefined` means "still loading" and never locks, to avoid a flash of locks.
 */
export function accessOf(entry: NavLeaf, config: VerticalConfig | undefined, tier: string | null | undefined): Access {
  if (entry.module && !isModuleVisible(config, entry.module)) return 'hidden';
  // Sin suscripción (null) no se muestran las secciones de pago; con un plan, las de planes mayores salen con candado.
  // undefined = cargando o error al consultar el plan: no se oculta nada (el backend igual valida el plan).
  if (entry.tier && tier === null) return 'hidden';
  if (entry.tier && tier !== undefined && !hasTierAccess(tier, entry.tier)) return 'locked';
  return 'open';
}
