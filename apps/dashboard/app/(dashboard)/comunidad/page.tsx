'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api-client';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
}

export default function ComunidadPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(page, search);
      setUsers(data.data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, page]);

  const toggleBan = async (user: User) => {
    if (!confirm(`¿Estás seguro de ${user.isBanned ? 'activar' : 'banear'} a ${user.fullName}?`)) return;
    try {
      if (user.isBanned) {
        await adminApi.activateUser(user.id);
      } else {
        await adminApi.banUser(user.id);
      }
      loadUsers();
    } catch (err) {
      alert('Error actualizando estado del usuario');
    }
  };

  if (loading && users.length === 0) return <div className="p-20 text-center font-bold text-gray-400">Cargando comunidad...</div>;

  return (
    <div className="space-y-12 pb-20">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Gestión de Usuarios</h1>
        <p className="text-[#6B7280] font-medium max-w-lg">Administra los roles, permisos y estados de los usuarios del ecosistema.</p>
      </header>

      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-xl font-black text-[#1A1A1A]">Usuarios Registrados</h2>
          <div className="w-full md:w-96">
             <input 
              type="text" 
              placeholder="Buscar por nombre o email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F7F8FA] py-4 px-6 rounded-2xl outline-none font-bold text-sm"
             />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-6">
                    <p className="font-bold text-[#1A1A1A]">{user.fullName}</p>
                    <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' : user.role === 'business' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                     <span className={`font-bold text-sm ${user.isBanned ? 'text-red-500' : 'text-green-500'}`}>
                       {user.isBanned ? 'Baneado' : 'Activo'}
                     </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => toggleBan(user)}
                      className={`text-xs font-black underline ${user.isBanned ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {user.isBanned ? 'Activar' : 'Banear'}
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
