'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../../lib/api-client';
import { Button, Card, Input, Select } from '../../ui';
import type { WaNumber } from './NumbersList';

/** Envía un mensaje real por la API de Meta para comprobar la conexión (y para grabar el video de revisión de la app). */
export function TestMessageCard({ numbers }: { numbers: WaNumber[] }) {
  const [test, setTest] = useState({ to: '', text: 'Hola desde Wuarikes 👋', whatsappNumberId: '' });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await adminApi.sendWhatsappTestMessage({
        to: test.to,
        text: test.text,
        whatsappNumberId: test.whatsappNumberId || undefined,
      });
      toast.success(`Mensaje enviado a ${res.to} (id ${res.messageId ?? '—'})`);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card padding="lg" className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-text">Probar la API de WhatsApp (Meta)</h2>
        <p className="mt-0.5 text-sm text-text-muted">
          Envía un mensaje real a un WhatsApp por la API de Meta. Úsalo para comprobar la conexión y para grabar el video que Meta pide en la revisión de la app.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Select label="Enviar desde" value={test.whatsappNumberId} onChange={(e) => setTest((p) => ({ ...p, whatsappNumberId: e.target.value }))}>
          <option value="">Número de prueba del servidor (WHATSAPP_PHONE_NUMBER_ID)</option>
          {numbers.map((n) => <option key={n.id} value={n.id}>{n.phoneNumber}</option>)}
        </Select>
        <Input
          label="Teléfono de destino"
          hint="Con código de país y sin signos, por ejemplo 51947196047."
          type="tel"
          required
          value={test.to}
          onChange={(e) => setTest((p) => ({ ...p, to: e.target.value }))}
        />
        <div className="sm:col-span-2">
          <Input label="Mensaje" type="text" required value={test.text} onChange={(e) => setTest((p) => ({ ...p, text: e.target.value }))} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" icon={Send} loading={sending}>{sending ? 'Enviando…' : 'Enviar mensaje de prueba'}</Button>
        </div>
      </form>
    </Card>
  );
}
