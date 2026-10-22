'use client';

import React, { useState } from 'react';
import { AlertCircle, Check, Plus } from 'lucide-react';
import { adminApi } from '../../../lib/api-client';
import { Button, Input } from '../../ui';

const EMPTY = { phoneNumber: '', phoneNumberId: '', whatsappApiToken: '' };

/**
 * Registra a mano el número de un local (flujo PlazBot). Se monta con `key` = id del local.
 * `onRegistered` recibe la URL de webhook que devolvió el backend, si la hubo.
 */
export function RegisterNumberForm({ placeId, onRegistered }: { placeId: string; onRegistered(webhookUrl?: string): Promise<void> }) {
  const [waForm, setWaForm] = useState(EMPTY);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waForm.phoneNumber || !waForm.phoneNumberId) {
      setError('Completa el número y el identificador del número de teléfono');
      return;
    }
    setRegistering(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminApi.createWhatsappNumber({ placeId, ...waForm });
      setWaForm(EMPTY);
      setSuccess('Número registrado. Falta configurar el webhook manualmente en PlazBot (ver arriba).');
      await onRegistered(res?.webhookUrl);
    } catch (err: any) {
      setError(err.message || 'Error al registrar número');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-text">Registrar número manualmente</h3>
        <p className="mt-0.5 text-sm text-text-muted">
          Registra el número de WhatsApp Business de este local. El webhook hay que configurarlo a mano en PlazBot (las instrucciones aparecen arriba al guardar).
        </p>
      </div>

      <Input
        label="Número de teléfono"
        type="tel"
        placeholder="+51 947 196 047"
        value={waForm.phoneNumber}
        onChange={(e) => setWaForm((p) => ({ ...p, phoneNumber: e.target.value }))}
      />
      <Input
        label="Identificador del número de teléfono"
        hint="Phone Number ID, el que entrega Gupshup o Meta."
        type="text"
        placeholder="1125526153979521"
        className="font-mono"
        value={waForm.phoneNumberId}
        onChange={(e) => setWaForm((p) => ({ ...p, phoneNumberId: e.target.value }))}
      />
      <Input
        label="API Token de WhatsApp (opcional)"
        hint="Solo si además vas a mandar mensajes directo con la API de Meta o Gupshup, sin pasar por PlazBot. Si el bot de este local corre 100% por PlazBot, déjalo vacío."
        type="password"
        placeholder="103683••••••6105"
        className="font-mono"
        value={waForm.whatsappApiToken}
        onChange={(e) => setWaForm((p) => ({ ...p, whatsappApiToken: e.target.value }))}
      />

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-control border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="flex items-start gap-2 rounded-control border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <Check size={16} aria-hidden className="mt-0.5 shrink-0" />
          {success}
        </p>
      )}

      <Button type="submit" variant="secondary" icon={Plus} loading={registering} className="w-full">
        {registering ? 'Registrando…' : 'Registrar número'}
      </Button>
    </form>
  );
}
