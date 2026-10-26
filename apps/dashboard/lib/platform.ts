'use client';

import { useEffect, useState } from 'react';
import { Bot, Briefcase, CreditCard, Receipt, FileWarning, Flame, KeyRound, QrCode, Settings, Shield, UserCog, Users, Wallet, type LucideIcon } from 'lucide-react';
import { fetchWithAuth } from './api-client';

/** Menú de la plataforma (equipo de Wuarikes): cada sección pide uno de estos permisos (ver backend permissions.ts). */
export const PLATFORM_NAV: { href: string; icon: LucideIcon; label: string; perms: string[]; hideWith?: string }[] = [
  { href: '/comercial/clientes', icon: Briefcase, label: 'Mis clientes', perms: ['oportunidades.propias', 'oportunidades.todas'] },
  { href: '/moderacion/oportunidades', icon: Flame, label: 'Oportunidades', perms: ['oportunidades.propias', 'oportunidades.todas'] },
  { href: '/comercial/comisiones', icon: Wallet, label: 'Mis comisiones', perms: ['comisiones.propias'], hideWith: 'comisiones.todas' },
  { href: '/moderacion', icon: Shield, label: 'Control de Locales', perms: ['locales.ver'] },
  { href: '/suscripciones', icon: CreditCard, label: 'Suscripciones', perms: ['suscripciones.ver'] },
  { href: '/liquidaciones', icon: CreditCard, label: 'Liquidaciones', perms: ['liquidaciones.gestionar'] },
  { href: '/moderacion/comisiones', icon: Wallet, label: 'Comisiones', perms: ['comisiones.todas'] },
  { href: '/moderacion/whatsapp', icon: Bot, label: 'WhatsApp Bot', perms: ['whatsapp.gestionar'] },
  { href: '/plataforma/consumo-whatsapp', icon: Receipt, label: 'Consumo de WhatsApp', perms: ['whatsapp.gestionar'] },
  { href: '/moderacion/dispositivos', icon: QrCode, label: 'Códigos QR', perms: ['qr.gestionar'] },
  { href: '/moderacion/reclamaciones', icon: FileWarning, label: 'Libro de Reclamaciones', perms: ['reclamaciones.gestionar'] },
  { href: '/comunidad', icon: Users, label: 'Usuarios', perms: ['usuarios.ver', 'usuarios.gestionar'] },
  { href: '/plataforma/equipo', icon: UserCog, label: 'Equipo Wuarikes', perms: ['usuarios.ver', 'usuarios.gestionar'] },
  { href: '/plataforma/perfiles', icon: KeyRound, label: 'Perfiles y permisos', perms: ['perfiles.gestionar'] },
  { href: '/configuracion', icon: Settings, label: 'Configuración del Sitio', perms: ['plataforma.config'] },
];

export const can = (owned: string[] | null, ...any: string[]) => !!owned && (owned.includes('*') || any.some((p) => owned.includes(p)));

/** Sección de plataforma a la que pertenece una ruta (la más específica). */
export const platformRoute = (pathname: string) =>
  [...PLATFORM_NAV].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

let cached: { perms: string[]; at: number } | null = null;

/** Permisos del usuario del equipo de Wuarikes (null mientras carga). Se cachean 30 s entre pantallas. */
export function usePlatformPermissions(enabled: boolean): string[] | null {
  const [perms, setPerms] = useState<string[] | null>(enabled && cached && Date.now() - cached.at < 30_000 ? cached.perms : null);
  useEffect(() => {
    if (!enabled) { setPerms([]); return; }
    if (cached && Date.now() - cached.at < 30_000) { setPerms(cached.perms); return; }
    fetchWithAuth('/admin/access/me')
      .then((r: { permissions: string[] }) => { cached = { perms: r.permissions, at: Date.now() }; setPerms(r.permissions); })
      .catch(() => setPerms([]));
  }, [enabled]);
  return perms;
}

export const clearPlatformPermissions = () => { cached = null; };
