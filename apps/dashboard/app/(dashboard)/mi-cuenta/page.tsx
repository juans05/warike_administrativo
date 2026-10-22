'use client';

import React, { useState } from 'react';
import { authApi } from '../../../lib/api-client';
import { toast } from 'sonner';
import { Button, Card, Input, PageHeader } from '../../../components/ui';

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

  const isDirty = Boolean(currentPassword || newPassword || confirmPassword);

  return (
    <div className="max-w-lg">
      <PageHeader title="Mi cuenta" subtitle="Cambia tu contraseña de acceso al panel." />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card padding="lg" className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-text">Contraseña</h2>
            <p className="mt-1 text-sm text-text-muted">Usa al menos 6 caracteres.</p>
          </div>
          <Input
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Contraseña nueva"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirmar contraseña nueva"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Card>

        {isDirty && (
          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-modal">
            <p className="text-sm text-text-muted">Tienes cambios sin guardar.</p>
            <Button type="submit" loading={isSaving}>{isSaving ? 'Guardando...' : 'Cambiar contraseña'}</Button>
          </div>
        )}
      </form>
    </div>
  );
}
