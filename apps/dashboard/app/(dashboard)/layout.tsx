'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { RestaurantProvider, useRestaurant } from '../../context/RestaurantContext';
import RestaurantSelector from '../../components/RestaurantSelector';
import OnboardingSearch from '../../components/OnboardingSearch';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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
  }, [router]);

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

function InnerLayout({ children, user, handleLogout }: { children: React.ReactNode; user: any; handleLogout: () => void }) {
  const pathname = usePathname();
  const { places, isLoading: contextLoading, refreshPlaces } = useRestaurant();

  const hasSavedPlace = typeof window !== 'undefined' ? localStorage.getItem('activePlaceId') : null;
  const noPlaces = !contextLoading && places.length === 0 && user?.role === 'business' && !hasSavedPlace;

  return (
    <div className="flex min-h-screen bg-background texture-paper">
      <aside className="w-80 bg-white/70 backdrop-blur-2xl border-r border-border flex flex-col h-screen sticky top-0 hidden md:flex shadow-2xl shadow-gray-200/50 z-10">
        <div className="p-10">
          <div className="flex flex-col gap-1 hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            <h1 className="text-3xl font-black text-primary tracking-tighter font-warike">WARIKE</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-text-muted">Global Reputación</p>
          </div>
          {user?.role === 'business' && !noPlaces && (
            <div className="mt-10"><RestaurantSelector /></div>
          )}
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
          {user?.role === 'business' && !noPlaces && (
            <>
              <SidebarItem href="/inicio" icon="🏢" label="Mi Establecimiento" active={pathname === '/inicio'} />
              <SidebarItem href="/reputacion" icon="⭐" label="Reputación Google" active={pathname === '/reputacion'} />
              <SidebarItem href="/fidelizacion" icon="🎁" label="Fidelización" badge="NUEVO" active={pathname === '/fidelizacion'} />
              <SidebarItem href="/clientes" icon="👥" label="Clientes CRM" active={pathname === '/clientes'} />
              <SidebarItem href="/social" icon="📷" label="Instagram IA" active={pathname === '/social'} />
              <SidebarItem href="/carta" icon="🍽️" label="La Carta Digital" active={pathname === '/carta'} />
              <SidebarItem href="/feedback" icon="💬" label="Buzón Privado" active={pathname === '/feedback'} />
              <SidebarItem href="/suscripcion" icon="💳" label="Mi Suscripción" active={pathname === '/suscripcion'} />
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <div className="pt-8 pb-4 px-6">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Platform Admin</p>
              </div>
              <SidebarItem href="/moderacion" icon="🛡️" label="Control de Locales" active={pathname === '/moderacion'} />
              <SidebarItem href="/comunidad" icon="👥" label="Gestión de Usuarios" active={pathname === '/comunidad'} />
              <SidebarItem href="/suscripciones" icon="💳" label="Suscripciones" active={pathname === '/suscripciones'} />
            </>
          )}
        </nav>

        <div className="p-8 border-t border-border flex flex-col gap-6">
          <div className="flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-300 cursor-pointer group">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/30 border-2 border-white ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-text truncate group-hover:text-primary transition-colors">{user?.fullName || 'Administrador'}</p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{user?.role || 'Pro Partner'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-border text-xs font-black text-text-muted hover:text-primary hover:border-primary transition-all active:scale-95 bg-white shadow-sm hover:shadow-md duration-300"
          >
            <span className="text-lg">🚪</span> CERRAR SESIÓN
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
            <MobileNavItem href="/reputacion" icon="⭐" label="Rep" active={pathname === '/reputacion'} />
            <MobileNavItem href="/fidelizacion" icon="🎁" label="Fideliz" badge="NEW" active={pathname === '/fidelizacion'} />
            <MobileNavItem href="/clientes" icon="👥" label="CRM" active={pathname === '/clientes'} />
            <MobileNavItem href="/carta" icon="🍽️" label="Carta" active={pathname === '/carta'} />
            <MobileNavItem href="/feedback" icon="💬" label="Privado" active={pathname === '/feedback'} />
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


function SidebarItem({ href, icon, label, active, badge }: { href: string, icon: string, label: string, active?: boolean, badge?: string }) {
  return (
    <Link 
      href={href} 
      className={`sidebar-item ${active ? 'active' : ''}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">{badge}</span>}
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
