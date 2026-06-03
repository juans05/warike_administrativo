'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { RestaurantProvider, useRestaurant } from '../../context/RestaurantContext';
import RestaurantSelector from '../../components/RestaurantSelector';
import OnboardingSearch from '../../components/OnboardingSearch';

interface DashboardUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'business';
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!isLoaded) return null;

  return (
    <RestaurantProvider>
      <InnerLayout user={user} handleLogout={handleLogout}>
        {children}
      </InnerLayout>
    </RestaurantProvider>
  );
}

function InnerLayout({ children, user, handleLogout }: { children: React.ReactNode; user: DashboardUser | null; handleLogout: () => void }) {
  const pathname = usePathname();
  const { places, isLoading: contextLoading, refreshPlaces } = useRestaurant();

  const hasSavedPlace = typeof window !== 'undefined' ? localStorage.getItem('activePlaceId') : null;
  const noPlaces = !contextLoading && places.length === 0 && user?.role === 'business' && !hasSavedPlace;

  return (
    <div className="flex min-h-screen bg-background texture-paper">
      <aside className="w-80 bg-white border-r border-border flex flex-col h-screen sticky top-0 hidden md:flex shadow-sm z-10">
        <div className="p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-primary tracking-tight">WARIKE</h1>
            <p className="text-xs uppercase tracking-widest font-semibold text-gray-400">Global Reputación</p>
          </div>
          {user?.role === 'business' && !noPlaces && (
            <div className="mt-8"><RestaurantSelector /></div>
          )}
        </div>

        <nav className="flex-1 px-4 overflow-y-auto">
          {user?.role === 'business' && !noPlaces && (
            <>
              {/* PRINCIPALES */}
              <div className="pt-2">
                <SidebarItem href="/inicio" icon="🏢" label="Mi Establecimiento" active={pathname === '/inicio'} />
              </div>

              {/* REPUTACIÓN & MARKETING */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <SidebarLabel>Reputación & Marketing</SidebarLabel>
                <SidebarItem href="/reputacion" icon="⭐" label="Reputación Google" active={pathname === '/reputacion'} />
                <SidebarItem href="/social" icon="📷" label="Instagram IA" active={pathname === '/social'} />
                <SidebarItem href="/carta" icon="🍽️" label="Carta Digital" active={pathname === '/carta'} />
                <SidebarItem href="/fidelizacion" icon="🎁" label="Fidelización" badge="NEW" active={pathname === '/fidelizacion'} />
              </div>

              {/* CLIENTES & COMUNICACIÓN */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <SidebarLabel>Clientes & Comunicación</SidebarLabel>
                <SidebarItem href="/clientes" icon="👥" label="Clientes CRM" active={pathname === '/clientes'} />
                <SidebarItem href="/feedback" icon="💭" label="Buzón Privado" active={pathname === '/feedback'} />
              </div>

              {/* WHATSAPP & IA */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <SidebarLabel>WhatsApp & IA</SidebarLabel>
                <SidebarItem href="/plazbot" icon="🤖" label="PlazBot Setup" badge="NEW" active={pathname === '/plazbot'} />
                <SidebarItem href="/chat" icon="💬" label="Chat en Vivo" badge="NEW" active={pathname === '/chat'} />
                <SidebarItem href="/broadcasts" icon="📢" label="Campañas" badge="NEW" active={pathname === '/broadcasts'} />
                <SidebarItem href="/ia" icon="🧠" label="Base de IA" badge="NEW" active={pathname === '/ia'} />
              </div>

              {/* CUENTA */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <SidebarLabel>Cuenta</SidebarLabel>
                <SidebarItem href="/suscripcion" icon="💳" label="Suscripción" active={pathname === '/suscripcion'} />
              </div>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <SidebarLabel>Administración</SidebarLabel>
                <SidebarItem href="/moderacion" icon="🛡️" label="Control de Locales" active={pathname === '/moderacion'} />
                <SidebarItem href="/comunidad" icon="👥" label="Gestión de Usuarios" active={pathname === '/comunidad'} />
                <SidebarItem href="/suscripciones" icon="💳" label="Suscripciones" active={pathname === '/suscripciones'} />
              </div>
            </>
          )}
        </nav>

        <div className="p-6 border-t border-gray-200 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'Administrador'}</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">{user?.role === 'business' ? 'Propietario' : 'Administrador'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 duration-200"
          >
            <span className="text-sm">🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 lg:p-16">
        {noPlaces ? <NoPlacesScreen userName={user?.fullName} onComplete={refreshPlaces} /> : children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-2xl border-t border-border flex items-center justify-around px-4 z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {user?.role === 'business' && !noPlaces && (
          <>
            <MobileNavItem href="/inicio" icon="🏢" label="Local" active={pathname === '/inicio'} />
            <MobileNavItem href="/chat" icon="💬" label="Chat" badge="NEW" active={pathname === '/chat'} />
            <MobileNavItem href="/broadcasts" icon="📢" label="Camp" badge="NEW" active={pathname === '/broadcasts'} />
            <MobileNavItem href="/ia" icon="🧠" label="IA" badge="NEW" active={pathname === '/ia'} />
          </>
        )}
        {user?.role === 'admin' && (
          <>
            <MobileNavItem href="/moderacion" icon="🛡️" label="Locales" active={pathname === '/moderacion'} />
            <MobileNavItem href="/comunidad" icon="👥" label="Usuarios" active={pathname === '/comunidad'} />
          </>
        )}
        <button onClick={handleLogout} className="flex flex-col items-center gap-1.5 text-text-muted hover:text-primary transition-colors active:scale-95 duration-200">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shadow-sm">🚪</div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Salir</span>
        </button>
      </nav>
    </div>
  );
}

function NoPlacesScreen({ userName, onComplete }: { userName?: string; onComplete: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-12">
        <div className="space-y-4">
          <div className="text-7xl">👨‍🍳</div>
          <h1 className="text-5xl font-black text-text font-warike tracking-tight italic">
            Bienvenido{userName ? `, Chef ${userName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-text-muted font-bold text-xl leading-relaxed max-w-lg mx-auto">
            Configura tu restaurante para empezar a gestionar tu reputación y redes sociales.
          </p>
        </div>

        <OnboardingSearch onComplete={onComplete} />

        <div className="pt-10 border-t border-border">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mb-6">¿Necesitas ayuda personalizada?</p>
          <a
            href="https://wa.me/51902191948?text=Hola!%20Soy%20un%20Chef%20nuevo%20y%20necesito%20ayuda%20con%20mi%20registro."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white border-2 border-border text-text px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95"
          >
            <span className="text-xl">💬</span> Hablar con Soporte Wuarike
          </a>
        </div>
      </div>
    </div>
  );
}


const SidebarLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-4 py-3 mb-2">
    {children}
  </p>
);

function SidebarItem({ href, icon, label, active, badge }: { href: string, icon: string, label: string, active?: boolean, badge?: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all duration-200 group ${
        active
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-gray-700 hover:bg-gray-50 font-medium'
      }`}
    >
      <span className="text-base flex-shrink-0">{icon}</span>
      <span className="flex-1 text-sm truncate">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md flex-shrink-0 group-hover:bg-gray-200 transition-colors">
          {badge}
        </span>
      )}
    </Link>
  );
}

function MobileNavItem({ href, icon, label, active, badge }: { href: string, icon: string, label: string, active?: boolean, badge?: string }) {
  return (
    <Link 
      href={href}
      className={`flex flex-col items-center gap-1.5 relative transition-colors duration-300 active:scale-95 ${active ? 'text-primary' : 'text-text-muted hover:text-primary'}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${active ? 'bg-primary/10 shadow-inner' : 'bg-gray-50 shadow-sm hover:shadow-md'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
      {badge && <span className="absolute top-0 right-0 bg-primary text-white text-[8px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white shadow-md">{badge}</span>}
    </Link>
  );
}
