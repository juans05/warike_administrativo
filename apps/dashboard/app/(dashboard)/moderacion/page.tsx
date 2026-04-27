'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api-client';

interface Place {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  isVerified: boolean;
  category: { name: string };
  district: { district: string };
  createdAt: string;
}

export default function ModeracionPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [placesData, statsData] = await Promise.all([
        adminApi.getPlaces(1, search),
        adminApi.getStats()
      ]);
      setPlaces(placesData.data);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const toggleVerification = async (id: string, current: boolean) => {
    try {
      await adminApi.updatePlace(id, { isVerified: !current });
      loadData();
    } catch (err) {
      alert('Error actualizando verificación');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminApi.updatePlace(id, { status });
      loadData();
    } catch (err) {
      alert('Error actualizando estado');
    }
  };

  if (loading && places.length === 0) return <div className="p-20 text-center font-bold text-gray-400">Cargando moderación...</div>;

  return (
    <div className="space-y-12 pb-20">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Moderación del Sistema</h1>
        <p className="text-[#6B7280] font-medium max-w-lg">Control total sobre los warikes registrados en la plataforma.</p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Warikes</p>
          <p className="text-4xl font-black text-[#F26122]">{stats?.overview?.totalPlaces || 0}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Usuarios</p>
          <p className="text-4xl font-black text-[#1A1A1A]">{stats?.overview?.totalUsers || 0}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-ins</p>
          <p className="text-4xl font-black text-blue-600">{stats?.overview?.totalCheckins || 0}</p>
        </div>
      </div>

      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-xl font-black text-[#1A1A1A]">Gestionar Locales</h2>
          <div className="w-full md:w-96 relative">
             <input 
              type="text" 
              placeholder="Buscar warike..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F7F8FA] py-4 px-6 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-orange-50"
             />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría / Distrito</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Verificación</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {places.map((place) => (
                <tr key={place.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-6 font-bold text-[#1A1A1A]">{place.name}</td>
                  <td className="px-10 py-6">
                    <p className="text-sm font-bold text-gray-600">{place.category?.name}</p>
                    <p className="text-xs text-gray-400 font-medium">{place.district?.district}</p>
                  </td>
                  <td className="px-10 py-6">
                    <button 
                      onClick={() => toggleVerification(place.id, place.isVerified)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${place.isVerified ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {place.isVerified ? '✓ Verificado' : 'No verificado'}
                    </button>
                  </td>
                  <td className="px-10 py-6">
                     <select 
                      value={place.status}
                      onChange={(e) => updateStatus(place.id, e.target.value)}
                      className="bg-transparent font-bold text-sm outline-none cursor-pointer"
                     >
                       <option value="active">Activo</option>
                       <option value="inactive">Inactivo</option>
                       <option value="pending">Pendiente</option>
                     </select>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => window.open(`https://wuarike.com/place/${place.id}`, '_blank')}
                      className="text-[#F26122] font-black text-xs underline"
                    >
                      Ver en App
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
