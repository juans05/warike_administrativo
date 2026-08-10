'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { teamApi, businessApi } from '../../../lib/api-client';
import { toast } from 'sonner';

type Role = 'admin' | 'supervisor' | 'agente';

const ROLE_LABELS: Record<Role, string> = { admin: 'Admin', supervisor: 'Supervisor', agente: 'Agente' };

interface TeamMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  whatsappNumberIds: string[];
}

interface WaNumber {
  id: string;
  phoneNumber: string;
}

export default function EquipoPage() {
  const { activePlaceId } = useRestaurant();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [waNumbers, setWaNumbers] = useState<WaNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', role: 'agente' as Role, whatsappNumberIds: [] as string[] });
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [teamRes, numbersRes] = await Promise.all([
        teamApi.list(activePlaceId),
        businessApi.getWhatsappNumbers(activePlaceId),
      ]);
      setMembers(teamRes.data || []);
      setWaNumbers(numbersRes.data || []);
    } catch {
      toast.error('No se pudo cargar el equipo. Puede que no seas Admin de esta sede.');
    } finally {
      setIsLoading(false);
    }
  }, [activePlaceId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaceId || !form.email || !form.fullName) return;
    setIsSaving(true);
    try {
      await teamApi.create(activePlaceId, form);
      toast.success('Agente agregado. Le llegó un correo con sus credenciales.');
      setForm({ email: '', fullName: '', role: 'agente', whatsappNumberIds: [] });
      setShowForm(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar el agente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!activePlaceId) return;
    if (!confirm('¿Quitar a esta persona del equipo?')) return;
    try {
      await teamApi.remove(activePlaceId, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch {
      toast.error('No se pudo quitar del equipo');
    }
  };

  const toggleNumber = (numberId: string) => {
    setForm(prev => ({
      ...prev,
      whatsappNumberIds: prev.whatsappNumberIds.includes(numberId)
        ? prev.whatsappNumberIds.filter(id => id !== numberId)
        : [...prev.whatsappNumberIds, numberId],
    }));
  };

  if (isLoading) {
    return <div className="max-w-4xl p-8"><div className="h-8 bg-gray-200 rounded-lg w-1/3 animate-pulse" /></div>;
  }

  return (
    <div className="max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Equipo</h1>
          <p className="text-gray-500 mt-1">Quién puede ver y trabajar el inbox de WhatsApp de esta sede.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-5 py-2.5 bg-[#F26122] text-white rounded-xl font-black text-sm hover:opacity-90 transition-all"
        >
          {showForm ? 'Cancelar' : '+ Agregar agente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Nombre</label>
              <input
                type="text" value={form.fullName} required
                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
              <input
                type="email" value={form.email} required
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Rol</label>
            <select
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="agente">Agente</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {form.role === 'agente' && (
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                Números de WhatsApp visibles
              </label>
              <div className="space-y-2">
                {waNumbers.length === 0 && <p className="text-xs text-gray-400">Sin números registrados en esta sede.</p>}
                {waNumbers.map(n => (
                  <label key={n.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.whatsappNumberIds.includes(n.id)}
                      onChange={() => toggleNumber(n.id)}
                    />
                    {n.phoneNumber}
                  </label>
                ))}
              </div>
            </div>
          )}
          <button
            type="submit" disabled={isSaving}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-black text-sm disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Agregar al equipo'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-sm text-gray-400">Todavía no hay nadie más en el equipo de esta sede.</p>
        ) : (
          members.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-4">
              <div>
                <p className="font-bold text-gray-900 text-sm">{m.fullName}</p>
                <p className="text-xs text-gray-400">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                  {ROLE_LABELS[m.role]}
                </span>
                <button onClick={() => handleRemove(m.id)} className="text-xs text-red-500 font-bold hover:text-red-700">
                  Quitar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
