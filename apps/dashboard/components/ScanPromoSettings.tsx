'use client';

import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';
import { Button, Card, Input, Switch } from './ui';
import { useCustomerLabels } from '../hooks/useCustomerLabels';

// El dueño decide si, al calificar, se invita al cliente a dejar su WhatsApp para recibir promociones, y con qué mensaje.
export default function ScanPromoSettings({ placeId }: { placeId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const { customer } = useCustomerLabels();

  useEffect(() => {
    businessApi.getScanPromo(placeId)
      .then((promo: { enabled: boolean; text: string }) => { setEnabled(!!promo?.enabled); setText(promo?.text || ''); })
      .catch(() => { /* sin configuración: queda apagado */ });
  }, [placeId]);

  const save = async () => {
    setSaving(true);
    try {
      await businessApi.setScanPromo(placeId, { enabled, text });
      toast.success('Promoción guardada');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-start gap-3">
        <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Gift size={20} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text">Promociones por WhatsApp</h3>
          <p className="text-sm text-text-muted">Al calificar, invita al {customer} a dejar su número para recibir promociones.</p>
        </div>
      </div>

      <Switch label="Pedir WhatsApp para enviar promociones" checked={enabled} onChange={setEnabled} />

      <Input
        label={`Mensaje que verá el ${customer}`}
        value={text}
        maxLength={160}
        disabled={!enabled}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ej: Deja tu WhatsApp y llévate una bebida gratis en tu próxima visita"
        hint={`${text.length}/160. Si tienes fidelización activa, el ${customer} también suma su primer sello al dejar el número.`}
      />

      <Button loading={saving} onClick={save}>{saving ? 'Guardando...' : 'Guardar'}</Button>
    </Card>
  );
}
