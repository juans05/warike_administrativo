'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../lib/api-client';

import GoogleReviews from '../../../components/GoogleReviews';

export default function ReputacionPage() {
  const { activePlaceId } = useRestaurant();
  const [stats, setStats] = useState({
    totalTaps: 1240,
    reviewsGenerated: 85,
    privateFeedback: 12,
    ratingAverage: 4.8
  });

  const publicLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/l/${activePlaceId}`;

  return (
    <div className="max-w-6xl space-y-16 pb-32">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-[var(--text)] tracking-tight font-warike">Motor de Reputación</h1>
        <p className="text-[var(--text-muted)] font-bold text-lg max-w-2xl leading-snug">
          Gestiona cómo tus clientes perciben tu sazón. Activa el filtrado inteligente para proteger tu puntuación.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <StatCard label="Taps Totales" value={stats.totalTaps} icon="📱" color="bg-blue-500" />
        <StatCard label="Uso NFC" value="65%" icon="⚡" color="bg-indigo-500" />
        <StatCard label="Uso QR" value="35%" icon="🔍" color="bg-orange-500" />
        <StatCard label="Reseñas Privadas" value={stats.privateFeedback} icon="🤫" color="bg-red-500" />
        <StatCard label="Rating Promedio" value={stats.ratingAverage} icon="📈" color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Device Management */}
        <section className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-[var(--border)] space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-2xl">⚡</div>
            <div>
              <h3 className="text-xl font-black text-[var(--text)] font-warike">Dispositivos Vinculados</h3>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Tus stands físicos activos</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Device 1 */}
            <div className="p-6 bg-[var(--background)] rounded-3xl border border-[var(--border)] group hover:border-[var(--primary)] transition-colors space-y-4">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="text-3xl">🪧</div>
                    <div>
                      <p className="font-black text-[var(--text)] text-sm">Stand Premium "Mesa 1"</p>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Activo</p>
                      </div>
                    </div>
                 </div>
                 <button className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Opciones</button>
               </div>
               <div className="pt-4 border-t border-gray-100">
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-2">Acción al escanear:</label>
                  <select className="input-premium py-2 text-xs font-bold text-[var(--text)] w-full cursor-pointer">
                    <option value="reputation">⭐ Captar Reseñas (Filtrado Inteligente)</option>
                    <option value="raffle">🎁 Formulario de Sorteo / Promoción</option>
                    <option value="menu">🍽️ Ver Menú Digital</option>
                  </select>
               </div>
            </div>

            {/* Device 2 */}
            <div className="p-6 bg-[var(--background)] rounded-3xl border border-[var(--border)] group hover:border-[var(--primary)] transition-colors space-y-4">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="text-3xl">🪧</div>
                    <div>
                      <p className="font-black text-[var(--text)] text-sm">Stand Premium "Barra"</p>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Activo</p>
                      </div>
                    </div>
                 </div>
                 <button className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Opciones</button>
               </div>
               <div className="pt-4 border-t border-gray-100">
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-2">Acción al escanear:</label>
                  <select className="input-premium py-2 text-xs font-bold text-[var(--text)] w-full cursor-pointer" defaultValue="raffle">
                    <option value="reputation">⭐ Captar Reseñas (Filtrado Inteligente)</option>
                    <option value="raffle">🎁 Formulario de Sorteo / Promoción</option>
                    <option value="menu">🍽️ Ver Menú Digital</option>
                  </select>
               </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 space-y-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/50 rounded-full blur-3xl"></div>
             <div>
               <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Tu Enlace Base</p>
               <p className="text-sm font-black text-[var(--text)] break-all">{publicLink}</p>
             </div>
             <div className="flex gap-3">
               <button onClick={() => {navigator.clipboard.writeText(publicLink); alert('Copiado');}} className="flex-1 py-3 rounded-xl bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all">Copiar Enlace</button>
               <button className="flex-1 py-3 rounded-xl bg-white text-orange-600 border border-orange-200 font-black text-[10px] uppercase tracking-widest hover:bg-orange-100 transition-all">Imprimir QR</button>
             </div>
          </div>

          <button className="w-full py-5 rounded-2xl border-2 border-dashed border-[var(--primary)] text-[var(--primary)] font-black text-xs uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all">
             + Solicitar Nuevo Stand Físico
          </button>
        </section>

        {/* Logic Configuration */}
        <section className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-[var(--border)] space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-2xl">⚙️</div>
            <div>
              <h3 className="text-xl font-black text-[var(--text)] font-warike">Filtrado Inteligente</h3>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Configura el umbral de satisfacción</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center p-6 bg-[var(--background)] rounded-3xl border border-[var(--border)]">
              <div>
                <p className="font-black text-[var(--text)] text-sm">Activar Filtrado</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)]">Redirige valoraciones bajas a buzón privado</p>
              </div>
              <div className="w-14 h-8 bg-[var(--primary)] rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full shadow-md"></div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Enlace de Google Maps</label>
              <input 
                type="text" 
                placeholder="https://maps.google.com/..."
                className="input-premium"
              />
            </div>

            <p className="text-[10px] font-bold text-[var(--text-muted)] leading-relaxed italic">
              * El filtrado inteligente está activado por defecto. Las valoraciones de 1 a 3 estrellas no verán el enlace de Google Maps y se les invitará a dejar una sugerencia privada.
            </p>
          </div>
        </section>
      </div>

      <hr className="border-[var(--border)]" />

      {/* New Reviews Section */}
      <GoogleReviews />
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: any, icon: string, color: string }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-4 hover:shadow-xl transition-all group">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 border-white group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl font-black text-[var(--text)]">{value}</p>
      </div>
    </div>
  );
}
