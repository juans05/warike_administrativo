'use client';

import Link from 'next/link';
import { CalendarDays, Home, Menu, Star, Users, type LucideIcon } from 'lucide-react';
import { Badge, cn } from '../ui';

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/inicio', label: 'Hoy', icon: Home },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/reputacion', label: 'Reseñas', icon: Star },
];

const tabClass = (active: boolean) => cn(
  'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
  active ? 'text-primary-hover' : 'text-text-muted',
);

/** Barra inferior del barbero independiente en celular y tablet; "Más" abre el menú completo. */
export default function IndependentTabBar({ pathname, onMore, pendingCount }: { pathname: string; onMore: () => void; pendingCount?: number | null }) {
  return (
    <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="flex">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex flex-1">
              <Link href={href} aria-current={active ? 'page' : undefined} className={tabClass(active)}>
                <Icon size={22} aria-hidden />
                {label}
                {href === '/inicio' && pendingCount ? (
                  <span className="absolute right-1/4 top-1"><Badge tone="primary">{pendingCount}</Badge></span>
                ) : null}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button type="button" onClick={onMore} className={tabClass(false)}>
            <Menu size={22} aria-hidden />
            Más
          </button>
        </li>
      </ul>
    </nav>
  );
}
