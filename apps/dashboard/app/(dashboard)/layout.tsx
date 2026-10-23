'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Bot,
  CreditCard,
  Wallet,
  Shield,
  LogOut,
  QrCode,
  FileWarning,
  Flame,
  Settings,
  ChefHat,
  LayoutGrid,
  Lock,
  Menu,
  ChevronUp,
  CircleUser,
  Clock,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';
import { RestaurantProvider, useRestaurant } from '../../context/RestaurantContext';
import RestaurantSelector from '../../components/RestaurantSelector';
import OnboardingSearch from '../../components/OnboardingSearch';
import TermsGate from '../../components/TermsGate';
import { AuthLogo } from '../../components/AuthCard';
import { businessApi, ordersApi } from '../../lib/api-client';
import { NAV, accessOf, matchRoute, navLabel, type VerticalConfig } from '../../lib/modules';
import { PLATFORM_NAV, can, clearPlatformPermissions, platformRoute, usePlatformPermissions } from '../../lib/platform';
import { Badge, EmptyState, Sheet, buttonStyles, cn } from '../../components/ui';

interface DashboardUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'business' | 'sales';
}

// El plan es de la SEDE activa (lo paga su dueño), no del usuario logueado — un
// Agente/Supervisor de esa sede lo hereda igual, sin tener suscripción propia.
// `undefined` = desconocido (cargando o error): sin candados ni bloqueo de página; el backend
// aplica el plan de todos modos. `null` solo tras cargar sin local o con respuesta "sin plan".
function useSubscriptionTier(placeId: string | null, placesLoading: boolean) {
  const [tier, setTier] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (placesLoading) { setTier(undefined); return; }
    if (!placeId) { setTier(null); return; }
    let cancelled = false;
    setTier(undefined);
    businessApi.getSubscriptionTier(placeId)
      .then((res) => { if (!cancelled) setTier(res?.tier ?? null); })
      .catch(() => { if (!cancelled) setTier(undefined); });
    return () => { cancelled = true; };
  }, [placeId, placesLoading]);
  return tier;
}

// Chats en modo humano sin responder; se pide al cambiar de local y cada 60 s. Si falla (p. ej. 403), no hay distintivo.
function usePendingChats(placeId: string | null) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    setCount(null);
    if (!placeId) return;
    let cancelled = false;
    const load = () => !document.hidden && businessApi.getToday(placeId)
      .then((res) => { if (!cancelled) setCount(res?.pendingHumanChats ?? null); })
      .catch(() => { if (!cancelled) setCount(null); });
    load();
    const timer = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [placeId]);
  return count;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
    } else {
      try {
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      setIsLoaded(true);
    }
  }, []);

  const handleLogout = () => {
    clearPlatformPermissions();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!isLoaded) return null;

  return (
    <div className="panel-ui">
      <RestaurantProvider>
        <InnerLayout user={user} handleLogout={handleLogout}>
          {children}
        </InnerLayout>
      </RestaurantProvider>
    </div>
  );
}

type NavProps = {
  user: DashboardUser | null;
  pathname: string;
  showBusiness: boolean;
  /** Secciones de la plataforma que el usuario del equipo de Wuarikes puede ver según su perfil. */
  platformNav: typeof PLATFORM_NAV;
  /** Cocina y mozo ven una sola pantalla (Cocina o Mesas); el resto del panel no aplica a su rol. */
  soloRoute: SoloRoute | null;
  config: VerticalConfig | undefined;
  tier: string | null | undefined;
  pendingChats: number | null;
  handleLogout: () => void;
};

type SoloRoute = { href: string; label: string; icon: typeof ChefHat };
const SOLO_ROUTE: Record<string, SoloRoute> = {
  cocina: { href: '/cocina', label: 'Cocina', icon: ChefHat },
  mozo: { href: '/mesas', label: 'Mesas y pedidos', icon: LayoutGrid },
};

function InnerLayout({ children, user, handleLogout }: { children: React.ReactNode; user: DashboardUser | null; handleLogout: () => void }) {
  const pathname = usePathname();
  const { places, activePlaceId, activePlace, isLoading: contextLoading, refreshPlaces } = useRestaurant();
  const isBusiness = user?.role === 'business';
  const tier = useSubscriptionTier(isBusiness ? activePlaceId : null, isBusiness && contextLoading);

  const hasSavedPlace = typeof window !== 'undefined' ? localStorage.getItem('activePlaceId') : null;
  const noPlaces = !contextLoading && places.length === 0 && isBusiness && !hasSavedPlace;

  const router = useRouter();
  const [placeRole, setPlaceRole] = useState<string | null>(null);
  useEffect(() => {
    if (user?.role !== 'business' || !activePlaceId) { setPlaceRole(null); return; }
    ordersApi.me(activePlaceId).then((r: { role: string }) => setPlaceRole(r.role)).catch(() => setPlaceRole(null));
  }, [user?.role, activePlaceId]);
  const soloRoute = placeRole ? SOLO_ROUTE[placeRole] ?? null : null;
  const kitchenOnly = soloRoute !== null;
  useEffect(() => {
    if (soloRoute && pathname !== soloRoute.href) router.replace(soloRoute.href);
  }, [soloRoute, pathname, router]);

  const pendingChats = usePendingChats(isBusiness && !kitchenOnly ? activePlaceId : null);

  // Rubro y plan solo aplican al dueño/equipo; cocina sigue viendo solo Cocina, como hoy.
  const config = activePlace?.verticalConfig;
  const routeEntry = matchRoute(pathname);
  const pageAccess = isBusiness && !kitchenOnly && routeEntry ? accessOf(routeEntry, config, tier) : 'open';
  // No montar una página de módulo antes de saber el rubro (evita que /mesas empiece a pedir datos antes del redirect).
  const waitForPlaces = isBusiness && contextLoading && Boolean(routeEntry?.module);
  useEffect(() => {
    if (pageAccess === 'hidden') router.replace('/inicio');
  }, [pageAccess, router]);

  // Equipo de Wuarikes: el menú y las rutas de la plataforma dependen de los permisos de su perfil.
  const isStaff = user?.role === 'admin' || user?.role === 'sales';
  const platformPerms = usePlatformPermissions(isStaff);
  const platformNav = PLATFORM_NAV.filter((item) => can(platformPerms, ...item.perms) && !(item.hideWith && can(platformPerms, item.hideWith)));
  const platformEntry = isStaff ? platformRoute(pathname) : undefined;
  const platformDenied = isStaff && platformPerms !== null && pathname !== '/mi-cuenta'
    && (platformEntry ? !can(platformPerms, ...platformEntry.perms) : user?.role === 'sales');
  const waitForPerms = Boolean(platformEntry) && platformPerms === null;
  useEffect(() => {
    if (platformDenied) router.replace(platformNav[0]?.href ?? '/mi-cuenta');
  }, [platformDenied, platformNav, router]);

  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);

  const navProps: NavProps = {
    user, pathname, showBusiness: isBusiness && !noPlaces, platformNav, soloRoute, config, tier, pendingChats, handleLogout,
  };

  return (
    <div className="flex min-h-screen bg-background">
      {isBusiness && <TermsGate />}
      <aside className="sticky top-0 z-10 hidden h-screen w-60 shrink-0 border-r border-border bg-surface lg:flex">
        <SidebarContent {...navProps} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
          <Logo />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            className={buttonStyles('ghost', 'md', 'w-11 px-0')}
          >
            <Menu size={20} aria-hidden />
          </button>
        </header>
        <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title="Menú">
          <SidebarContent {...navProps} hideLogo onNavigate={() => setMenuOpen(false)} />
        </Sheet>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {isBusiness && activePlace?.status === 'pending' && (
            <div role="status" className="mb-6 flex items-start gap-3 rounded-card border border-secondary bg-secondary/20 px-4 py-3">
              <Clock size={20} aria-hidden className="mt-0.5 shrink-0 text-text" />
              <div>
                <p className="text-sm font-semibold text-text">Tu local está en revisión</p>
                <p className="text-sm text-text">
                  Ya puedes configurar tu panel, pero tu local aparecerá en el mapa y en las búsquedas de Wuarikes en cuanto nuestro equipo lo apruebe.
                </p>
              </div>
            </div>
          )}
          {noPlaces ? (
            <NoPlacesScreen userName={user?.fullName} onComplete={refreshPlaces} />
          ) : pageAccess === 'hidden' || waitForPlaces || waitForPerms || platformDenied ? null : pageAccess === 'locked' ? (
            <EmptyState
              icon={Lock}
              title="Esta sección no está en tu plan"
              description="Mejora tu plan para usarla con tu negocio."
              action={<Link href="/suscripcion" className={buttonStyles('primary')}>Ver planes</Link>}
            />
          ) : children}
        </main>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/inicio" aria-label="wuarikes, ir al inicio" className="inline-flex min-h-11 items-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <AuthLogo className="text-xl" />
    </Link>
  );
}

function SidebarContent({
  user, pathname, showBusiness, platformNav, soloRoute, config, tier, pendingChats, handleLogout, hideLogo, onNavigate,
}: NavProps & { hideLogo?: boolean; onNavigate?: () => void }) {
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    // Cierra el Sheet al tocar cualquier enlace, aunque sea la ruta actual.
    <div className="flex h-full w-full flex-col" onClick={(e) => { if ((e.target as Element).closest('a')) onNavigate?.(); }}>
      {!hideLogo && <div className="px-5 py-5"><Logo /></div>}

      <nav aria-label="Menú principal" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {showBusiness && soloRoute && (
          <ul className="pt-2">
            <SidebarLink href={soloRoute.href} icon={soloRoute.icon} label={soloRoute.label} active={pathname === soloRoute.href} />
          </ul>
        )}

        {showBusiness && !soloRoute && (
          <>
            <ul className="pt-2">
              <SidebarLink href="/inicio" icon={Home} label="Inicio" active={pathname === '/inicio'} />
            </ul>
            {NAV.map((group) => {
              const items = group.items.filter((item) => accessOf(item, config, tier) !== 'hidden');
              if (items.length === 0) return null;
              return (
                <NavSection key={group.group} title={group.group} subtitle={group.subtitle}>
                  {items.map((item) => {
                    const children = (item.children ?? []).filter((c) => accessOf(c, config, tier) !== 'hidden');
                    return (
                      <SidebarLink
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={navLabel(item.label, config)}
                        active={isActive(item.href)}
                        locked={accessOf(item, config, tier) === 'locked'}
                      >
                        {children.length > 0 && (
                          <ul className="mt-0.5 space-y-0.5">
                            {children.map((child) => (
                              <SidebarLink
                                key={child.href}
                                href={child.href}
                                label={navLabel(child.label, config)}
                                active={isActive(child.href)}
                                locked={accessOf(child, config, tier) === 'locked'}
                                count={child.href === '/chat' ? pendingChats : null}
                                nested
                              />
                            ))}
                          </ul>
                        )}
                      </SidebarLink>
                    );
                  })}
                </NavSection>
              );
            })}
          </>
        )}

        {platformNav.length > 0 && (
          <NavSection title="Plataforma">
            {platformNav.map((item) => (
              <SidebarLink key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname === item.href} />
            ))}
          </NavSection>
        )}
      </nav>

      <div className="space-y-3 border-t border-border p-3">
        {showBusiness && <RestaurantSelector />}
        <UserMenu user={user} pathname={pathname} showBusiness={showBusiness} handleLogout={handleLogout} />
      </div>
    </div>
  );
}

function NavSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div className="mt-5">
      <div className="px-3 pb-2">
        <p id={id} className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</p>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      </div>
      <ul aria-labelledby={id} className="space-y-0.5">{children}</ul>
    </div>
  );
}

function SidebarLink({
  href, icon: Icon, label, active, locked, count, nested, children,
}: {
  href: string; icon?: LucideIcon; label: string; active?: boolean; locked?: boolean; count?: number | null; nested?: boolean; children?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={locked ? '/suscripcion' : href}
        aria-current={active && !locked ? 'page' : undefined}
        aria-label={locked ? `${label} (requiere mejorar tu plan)` : undefined}
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-control px-3 text-sm transition-colors duration-200 motion-reduce:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          nested && 'pl-10',
          active && !locked ? 'bg-primary-soft font-semibold text-primary-hover' : 'font-medium text-text hover:bg-background',
          locked && 'text-text-muted',
        )}
      >
        {Icon && <Icon size={20} aria-hidden className="shrink-0" />}
        <span className="flex-1 truncate">{label}</span>
        {locked ? (
          <Lock size={16} aria-hidden className="shrink-0" />
        ) : count ? (
          <Badge tone="primary">{count}<span className="sr-only"> pendientes</span></Badge>
        ) : null}
      </Link>
      {children}
    </li>
  );
}

function UserMenu({ user, pathname, showBusiness, handleLogout }: { user: DashboardUser | null; pathname: string; showBusiness: boolean; handleLogout: () => void }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (ref.current) ref.current.open = false; }, [pathname]);

  const itemClass = 'flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-sm font-medium text-text hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  return (
    <details ref={ref} className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-control px-2 py-1.5 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-hover">
          {user?.fullName?.charAt(0) || 'A'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text">{user?.fullName || 'Administrador'}</span>
          <span className="block text-xs text-text-muted">{user?.role === 'business' ? 'Propietario' : user?.role === 'sales' ? 'Comercial' : 'Equipo Wuarikes'}</span>
        </span>
        <ChevronUp size={16} aria-hidden className="shrink-0 text-text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="absolute bottom-full left-0 right-0 mb-2 rounded-card border border-border bg-surface p-1 shadow-card">
        <Link href="/mi-cuenta" className={itemClass}><CircleUser size={20} aria-hidden /> Mi cuenta</Link>
        {showBusiness && <Link href="/suscripcion" className={itemClass}><CreditCard size={20} aria-hidden /> Suscripción</Link>}
        <button type="button" onClick={handleLogout} className={cn(itemClass, 'hover:text-danger')}>
          <LogOut size={20} aria-hidden /> Cerrar sesión
        </button>
      </div>
    </details>
  );
}

function NoPlacesScreen({ userName, onComplete }: { userName?: string; onComplete: () => void }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-10 text-center">
        <div className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <ChefHat size={24} aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-text">
            Bienvenido{userName ? `, ${userName.split(' ')[0]}` : ''}
          </h1>
          <p className="mx-auto max-w-lg text-base text-text-muted">
            Configura tu negocio para empezar a gestionar tu reputación y redes sociales.
          </p>
        </div>

        <OnboardingSearch onComplete={onComplete} />

        <div className="border-t border-border pt-8">
          <p className="mb-4 text-sm text-text-muted">¿Necesitas ayuda personalizada?</p>
          <a
            href="https://wa.me/51902191948?text=Hola!%20Soy%20un%20Chef%20nuevo%20y%20necesito%20ayuda%20con%20mi%20registro."
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles('secondary')}
          >
            <MessageCircle size={20} aria-hidden /> Hablar con soporte Wuarikes
          </a>
        </div>
      </div>
    </div>
  );
}
