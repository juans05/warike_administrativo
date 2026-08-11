'use client';

import React, { useState } from 'react';
import { authApi } from '../../../lib/api-client';
import { toast } from 'sonner';

export default function MiCuentaPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    setIsSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cambiar la contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mi Cuenta</h1>
        <p className="text-gray-500 mt-1">Cambiá tu contraseña de acceso al panel.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Contraseña actual</label>
          <input
            type="password" value={currentPassword} required
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Contraseña nueva</label>
          <input
            type="password" value={newPassword} required minLength={6}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Confirmar contraseña nueva</label>
          <input
            type="password" value={confirmPassword} required minLength={6}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
          />
        </div>
        <button
          type="submit" disabled={isSaving}
          className="w-full py-3 bg-gray-900 text-white rounded-xl font-black text-sm disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
}
