'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { RestaurantProvider } from '../../context/RestaurantContext';
import RestaurantSelector from '../../components/RestaurantSelector';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
    } else {
      if (storedUser) setUser(JSON.parse(storedUser));
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
      <div className="flex min-h-screen bg-[#F7F8FA]">
      {/* Sidebar - Hidden on very small screens, visible on md+ */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 hidden md:flex">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-[#F26122] tracking-tighter">WUARIKE</h1>
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Administrativo</p>
          
          <div className="mt-8">
            <RestaurantSelector />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem href="/" icon="🏢" label="Mi Establecimiento" active={pathname === '/'} />
          <SidebarItem href="/carta" icon="🍽️" label="La Carta" active={pathname === '/carta'} />
          <SidebarItem href="/feedback" icon="💬" label="Feedback" active={pathname === '/feedback'} />
          
          {user?.role === 'admin' && (
            <>
              <div className="pt-6 pb-2 px-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Admin</p>
              </div>
              <SidebarItem href="/moderacion" icon="🛡️" label="Moderación" active={pathname === '/moderacion'} />
              <SidebarItem href="/comunidad" icon="👥" label="Usuarios" active={pathname === '/comunidad'} />
            </>
          )}
        </nav>

        <div className="p-6 border-t border-gray-50 flex flex-col gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F26122] flex items-center justify-center text-white font-bold">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.fullName || 'Administrador'}</p>
              <p className="text-[10px] text-[#6B7280] font-semibold uppercase">{user?.role || 'Admin'}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-14">
        {children}
      </main>

      {/* Mobile Nav - Bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50">
         <MobileNavItem href="/" icon="🏢" label="Resto" active={pathname === '/'} />
         <MobileNavItem href="/carta" icon="🍽️" label="Carta" active={pathname === '/carta'} />
         <MobileNavItem href="/feedback" icon="💬" label="FB" active={pathname === '/feedback'} />
         {user?.role === 'admin' && (
           <MobileNavItem href="/moderacion" icon="🛡️" label="Mod" active={pathname === '/moderacion'} />
         )}
         <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-gray-400">
           <span className="text-xl">🚪</span>
           <span className="text-[10px] font-bold">Salir</span>
         </button>
      </nav>
      </div>
    </RestaurantProvider>
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
      {badge && <span className="bg-[#E8453C] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{badge}</span>}
    </Link>
  );
}

function MobileNavItem({ href, icon, label, active, badge }: { href: string, icon: string, label: string, active?: boolean, badge?: string }) {
  return (
    <Link 
      href={href}
      className={`flex flex-col items-center gap-1 relative ${active ? 'text-[#F26122]' : 'text-[#6B7280]'}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
      {badge && <span className="absolute -top-1 -right-1 bg-[#E8453C] text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-white">{badge}</span>}
    </Link>
  );
}
