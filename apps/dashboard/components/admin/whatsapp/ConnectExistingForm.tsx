'use client';

import React, { useState } from 'react';
import { Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../../lib/api-client';
import { Button, Input } from '../../ui';

/**
 * Conecta directo con Meta un número que ya existe en la cuenta de WhatsApp Business.
 * Se monta con `key` = id del local, así el token escrito no pasa de un local a otro.
 */
export function ConnectExistingForm({ placeId, onConnected }: { placeId: string; onConnected(): Promise<void> }) {
  const [existing, setExisting] = useState({ phoneNumberId: '', wabaId: '', token: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.connectExistingWhatsappNumber({ placeId, ...existing });
      toast.success(`Conectado: +${res.phoneNumber}${res.verifiedName ? ` (${res.verifiedName})` : ''}`);
      setExisting({ phoneNumberId: '', wabaId: '', token: '' });
      await onConnected();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo conectar el número');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-card border border-border bg-background p-4">
      <div>
        <h3 className="text-base font-semibold text-text">Conectar número que ya existe en Meta</h3>
        <p className="mt-0.5 text-sm text-text-muted">
          Para un número que ya está registrado en tu cuenta de WhatsApp Business de Meta: se valida el token, se suscribe la app y queda como conexión directa (sin PlazBot).
        </p>
      </div>
      <Input
        label="Identificador del número de teléfono"
        hint="Es el identificador del número (Phone Number ID), no el teléfono ni el de la cuenta."
        type="text"
        required
        className="font-mono"
        value={existing.phoneNumberId}
        onChange={(e) => setExisting((p) => ({ ...p, phoneNumberId: e.target.value }))}
      />
      <Input
        label="Identificador de la cuenta de WhatsApp Business (WABA)"
        type="text"
        required
        className="font-mono"
        value={existing.wabaId}
        onChange={(e) => setExisting((p) => ({ ...p, wabaId: e.target.value }))}
      />
      <Input
        label="Token de acceso (usuario del sistema)"
        type="password"
        required
        autoComplete="off"
        className="font-mono"
        value={existing.token}
        onChange={(e) => setExisting((p) => ({ ...p, token: e.target.value }))}
      />
      <Button type="submit" icon={Link2} loading={saving} className="w-full">
        {saving ? 'Conectando…' : 'Conectar directo con Meta'}
      </Button>
    </form>
  );
}
