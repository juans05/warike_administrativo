'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'business' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers(page, search);
      setUsers(Array.isArray(data?.data) ? data.data : []);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.createUser(newUser);
      setIsModalOpen(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'business' });
      loadUsers();
    } catch (err: any) {
      alert(err?.message || 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  const toggleBan = async (user: User) => {
    if (!confirm(`¿${user.isBanned ? 'Activar' : 'Banear'} a ${user.fullName}?`)) return;
    try {
      if (user.isBanned) await adminApi.activateUser(user.id);
      else await adminApi.banUser(user.id);
      loadUsers();
    } catch {
      alert('Error actualizando estado del usuario');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewUser({ fullName: '', email: '', password: '', role: 'business' });
  };

  return (
    <div className="space-y-12 pb-20 max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Gestión de Usuarios</h1>
        <p className="text-[#6B7280] font-medium max-w-lg">
          Administra los roles, permisos y estados de los usuarios del ecosistema.
        </p>
      </header>

      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black text-[#1A1A1A]">Usuarios Registrados</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#F26122] text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#F26122]/20 hover:scale-105 transition-all"
            >
              + Registrar Usuario
            </button>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 bg-[#F7F8FA] py-4 px-6 rounded-2xl outline-none font-bold text-sm"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <p className="font-bold text-red-600 text-sm">Error al cargar usuarios</p>
              <p className="text-red-400 text-xs font-medium">{error}</p>
            </div>
            <button onClick={loadUsers} className="ml-auto text-xs font-black text-red-500 underline">
              Reintentar
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-gray-100">
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-10 py-14 text-center">
                    <div className="w-7 h-7 border-4 border-[#F26122] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 font-bold text-sm">Cargando usuarios...</p>
                  </td>
                </tr>
              )}
              {!loading && !error && users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-16 text-center">
                    <p className="text-3xl mb-3">👥</p>
                    <p className="font-bold text-[#1A1A1A] text-sm mb-1">No hay usuarios registrados</p>
                    <p className="text-gray-400 text-xs font-medium">Usa el botón para registrar el primer usuario.</p>
                  </td>
                </tr>
              )}
              {!loading && users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-5">
                    <p className="font-bold text-[#1A1A1A] text-sm">{user.fullName}</p>
                    <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-600'
                      : user.role === 'business' ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`font-bold text-sm ${user.isBanned ? 'text-red-500' : 'text-green-500'}`}>
                      {user.isBanned ? 'Baneado' : 'Activo'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => toggleBan(user)}
                      className={`text-xs font-black underline underline-offset-4 ${user.isBanned ? 'text-green-600' : 'text-red-500'}`}
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

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center p-6 pt-16 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl">
            {/* Modal header */}
            <div className="flex justify-between items-start p-8 pb-0">
              <div>
                <h3 className="text-2xl font-black text-[#1A1A1A]">Nuevo Usuario</h3>
                <p className="text-gray-400 text-sm font-medium mt-1">Registra un nuevo socio o administrador.</p>
              </div>
              <button
                onClick={closeModal}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Nombre Completo
                </label>
                <input
                  required
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl outline-none font-bold text-sm focus:border-[#F26122] focus:ring-2 focus:ring-[#F26122]/10 transition-all"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl outline-none font-bold text-sm focus:border-[#F26122] focus:ring-2 focus:ring-[#F26122]/10 transition-all"
                  placeholder="socio@wuarike.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Contraseña Temporal
                </label>
                <input
                  required
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl outline-none font-bold text-sm focus:border-[#F26122] focus:ring-2 focus:ring-[#F26122]/10 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Rol del Usuario
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'business', label: 'Business', emoji: '🏢' },
                    { value: 'user', label: 'Usuario', emoji: '👤' },
                    { value: 'admin', label: 'Admin', emoji: '🛡️' },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: r.value })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        newUser.role === r.value
                          ? 'border-[#F26122] bg-[#F26122]/5'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-xl block mb-1">{r.emoji}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wide ${
                        newUser.role === r.value ? 'text-[#F26122]' : 'text-gray-500'
                      }`}>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-[#F26122] text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#F26122]/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 mt-2"
              >
                {creating ? 'Registrando...' : 'Confirmar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
