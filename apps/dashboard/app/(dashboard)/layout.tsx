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
  const { places, isLoading: contextLoading } = useRestaurant();

  const noPlaces = !contextLoading && places.length === 0 && user?.role === 'business';

  return (
    <div className="flex min-h-screen bg-[var(--background)] texture-paper">
      <aside className="w-80 bg-white/80 backdrop-blur-xl border-r border-[var(--border)] flex flex-col h-screen sticky top-0 hidden md:flex">
        <div className="p-10">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-[var(--primary)] tracking-tighter font-warike">WARIKE</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)]">Global Reputación</p>
          </div>
          {!noPlaces && <div className="mt-10"><RestaurantSelector /></div>}
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
          {!noPlaces && (
            <>
              <SidebarItem href="/inicio" icon="🏢" label="Mi Establecimiento" active={pathname === '/inicio'} />
              <SidebarItem href="/reputacion" icon="⭐" label="Reputación Google" active={pathname === '/reputacion'} />
              <SidebarItem href="/social" icon="📷" label="Instagram IA" badge="NUEVO" active={pathname === '/social'} />
              <SidebarItem href="/carta" icon="🍽️" label="La Carta Digital" active={pathname === '/carta'} />
              <SidebarItem href="/feedback" icon="💬" label="Buzón Privado" active={pathname === '/feedback'} />
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <div className="pt-8 pb-4 px-6">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Platform Admin</p>
              </div>
              <SidebarItem href="/moderacion" icon="🛡️" label="Control de Locales" active={pathname === '/moderacion'} />
              <SidebarItem href="/comunidad" icon="👥" label="Gestión de Usuarios" active={pathname === '/comunidad'} />
            </>
          )}
        </nav>

        <div className="p-8 border-t border-[var(--border)] flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[var(--primary)]/20 border-2 border-white">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-[var(--text)] truncate">{user?.fullName || 'Administrador'}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{user?.role || 'Pro Partner'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-[var(--border)] text-xs font-black text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all active:scale-95 bg-white shadow-sm"
          >
            <span>🚪</span> CERRAR SESIÓN
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 lg:p-16">
        {noPlaces ? <NoPlacesScreen userName={user?.fullName} /> : children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-xl border-t border-[var(--border)] flex items-center justify-around px-4 z-50 rounded-t-[2.5rem] shadow-2xl">
        {!noPlaces && (
          <>
            <MobileNavItem href="/inicio" icon="🏢" label="Local" active={pathname === '/inicio'} />
            <MobileNavItem href="/reputacion" icon="⭐" label="Rep" active={pathname === '/reputacion'} />
            <MobileNavItem href="/social" icon="📷" label="Social" badge="IA" active={pathname === '/social'} />
            <MobileNavItem href="/carta" icon="🍽️" label="Carta" active={pathname === '/carta'} />
            <MobileNavItem href="/feedback" icon="💬" label="Privado" active={pathname === '/feedback'} />
          </>
        )}
        <button onClick={handleLogout} className="flex flex-col items-center gap-1.5 text-[var(--text-muted)]">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl">🚪</div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Salir</span>
        </button>
      </nav>
    </div>
  );
}

function NoPlacesScreen({ userName }: { userName?: string }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-12">
        <div className="space-y-4">
          <div className="text-7xl">👨‍🍳</div>
          <h1 className="text-5xl font-black text-[var(--text)] font-warike tracking-tight italic">
            Bienvenido{userName ? `, Chef ${userName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[var(--text-muted)] font-bold text-xl leading-relaxed max-w-lg mx-auto">
            Configura tu restaurante para empezar a gestionar tu reputación y redes sociales.
          </p>
        </div>

        <OnboardingSearch onComplete={() => {}} />

        <div className="pt-10 border-t border-[var(--border)]">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-6">¿Necesitas ayuda personalizada?</p>
          <a
            href="https://wa.me/51902191948?text=Hola!%20Soy%20un%20Chef%20nuevo%20y%20necesito%20ayuda%20con%20mi%20registro."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white border-2 border-[var(--border)] text-[var(--text)] px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all shadow-sm"
          >
            <span>💬</span> Hablar con Soporte Wuarike
          </a>
        </div>
      </div>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm shrink-0">
        {n}
      </div>
      <p className="text-[var(--text-muted)] font-bold text-sm leading-relaxed pt-1">{text}</p>
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
      {badge && <span className="bg-[var(--primary)] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{badge}</span>}
    </Link>
  );
}

function MobileNavItem({ href, icon, label, active, badge }: { href: string, icon: string, label: string, active?: boolean, badge?: string }) {
  return (
    <Link 
      href={href}
      className={`flex flex-col items-center gap-1.5 relative ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${active ? 'bg-[var(--primary)]/10' : 'bg-gray-50'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
      {badge && <span className="absolute top-0 right-0 bg-[var(--primary)] text-white text-[8px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white shadow-md">{badge}</span>}
    </Link>
  );
}
