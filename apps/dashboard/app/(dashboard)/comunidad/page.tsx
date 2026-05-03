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
  const [page] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'business' });

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createUser(newUser);
      setIsModalOpen(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'business' });
      loadUsers();
      alert('Usuario creado exitosamente');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear usuario');
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
    <div className="space-y-12 pb-20 max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Gestión de Usuarios</h1>
        <p className="text-[#6B7280] font-medium max-w-lg">Administra los roles, permisos y estados de los usuarios del ecosistema.</p>
      </header>

      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black text-[#1A1A1A]">Usuarios Registrados</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#F26122] text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#F26122]/20 hover:scale-105 transition-all"
            >
              + Registrar Usuario
            </button>
          </div>
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

        {/* Create User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl scale-in-center my-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-[#1A1A1A]">Nuevo Usuario</h3>
                  <p className="text-gray-400 text-sm font-medium">Registra un nuevo socio o administrador.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                  <input 
                    required
                    type="text" 
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-sm focus:border-[#F26122]"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email</label>
                  <input 
                    required
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-sm focus:border-[#F26122]"
                    placeholder="socio@wuarike.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contraseña Temporal</label>
                  <input 
                    required
                    type="password" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-sm focus:border-[#F26122]"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rol del Usuario</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-sm focus:border-[#F26122] appearance-none"
                  >
                    <option value="business">Business (Dueño de Local)</option>
                    <option value="admin">Administrador</option>
                    <option value="user">Usuario Común</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#F26122] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#F26122]/20 hover:opacity-90 active:scale-95 transition-all mt-4"
                >
                  Confirmar Registro
                </button>
              </form>
            </div>
          </div>
        )}

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
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-10 py-16 text-center text-gray-400 font-medium text-sm">
                    No hay usuarios registrados aún.
                  </td>
                </tr>
              )}
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
