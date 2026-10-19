'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, Nfc, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../../lib/api-client';
import { Badge, Button, Card, Input, cn } from '../ui';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';

const TAP_PRICES = { generico: 20, personalizado: 40 } as const;
// Primeros FREE_TAPS de por vida por local salen gratis — ver
// DevicesService.createRequest() en el backend, misma regla.
const FREE_TAPS = 2;

const TYPES = [
  { key: 'generico', label: 'Genérico' },
  { key: 'personalizado', label: 'Personalizado' },
] as const;

/** Pedido de nuevos taps NFC (genéricos o personalizados), con los primeros gratis. */
export function TapsRequestCard({ placeId }: { placeId: string }) {
  const [deviceRequests, setDeviceRequests] = useState<any[]>([]);
  const { customers } = useCustomerLabels();
  const [isRequestingTaps, setIsRequestingTaps] = useState(false);
  const [tapType, setTapType] = useState<'generico' | 'personalizado'>('generico');
  const [tapQuantity, setTapQuantity] = useState(5);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    businessApi.getDeviceRequests(placeId)
      .then(setDeviceRequests)
      .catch(() => setDeviceRequests([]));
  }, [placeId]);

  const handleRequestTaps = async () => {
    if (tapQuantity < 5) return;
    setIsSubmittingRequest(true);
    try {
      await businessApi.createDeviceRequest(placeId, { tapType, quantity: tapQuantity });
      setIsRequestingTaps(false);
      setTapType('generico');
      setTapQuantity(5);
      const updated = await businessApi.getDeviceRequests(placeId);
      setDeviceRequests(updated);
      toast.success('Pedido enviado. El equipo Wuarike lo revisará pronto.');
    } catch (err) {
      toast.error('Error al enviar el pedido');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const tapsAlreadyUsed = deviceRequests
    .filter((r: any) => r.status !== 'rejected')
    .reduce((sum: number, r: any) => sum + r.quantity, 0);
  const freeTapsRemaining = Math.max(0, FREE_TAPS - tapsAlreadyUsed);
  const freeUnitsInRequest = Math.min(tapQuantity, freeTapsRemaining);
  const paidUnitsInRequest = tapQuantity - freeUnitsInRequest;

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-start gap-3">
        <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Nfc size={20} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text">Taps físicos</h3>
          <p className="text-sm text-text-muted">Pide tarjetas NFC para que tus {customers} te califiquen con solo acercar el celular.</p>
        </div>
      </div>

      {!isRequestingTaps ? (
        <Button variant="secondary" icon={Plus} onClick={() => setIsRequestingTaps(true)}>Pedir nuevos taps</Button>
      ) : (
        <div className="space-y-4 rounded-card bg-background p-4">
          {freeTapsRemaining > 0 && (
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <Gift size={20} aria-hidden />
              Te quedan {freeTapsRemaining} tap{freeTapsRemaining === 1 ? '' : 's'} gratis de por vida
            </p>
          )}

          <div role="radiogroup" aria-label="Tipo de tap" className="grid grid-cols-2 gap-3">
            {TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={tapType === t.key}
                onClick={() => setTapType(t.key)}
                className={cn(
                  'min-h-11 rounded-card border p-4 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  tapType === t.key ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:bg-background',
                )}
              >
                <p className="text-sm font-semibold text-text">{t.label}</p>
                <p className="text-sm text-text-muted">S/ {TAP_PRICES[t.key]} c/u</p>
              </button>
            ))}
          </div>

          <div className="sm:w-48">
            <Input
              label="Cantidad (mín. 5)"
              type="number"
              min={5}
              value={tapQuantity}
              onChange={(e) => setTapQuantity(Math.max(5, Number(e.target.value) || 5))}
            />
          </div>

          <p className="text-base font-semibold text-text">
            Total: S/ {(TAP_PRICES[tapType] * paidUnitsInRequest).toFixed(2)}
            {freeUnitsInRequest > 0 && <span className="ml-2 text-sm font-medium text-success">({freeUnitsInRequest} gratis)</span>}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button loading={isSubmittingRequest} onClick={handleRequestTaps}>
              {isSubmittingRequest ? 'Enviando...' : 'Enviar pedido'}
            </Button>
            <Button variant="ghost" disabled={isSubmittingRequest} onClick={() => setIsRequestingTaps(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {deviceRequests.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium text-text">Pedidos recientes</p>
          <ul className="space-y-2">
            {deviceRequests.slice(0, 3).map((r: any) => (
              <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-text">{r.quantity}x {r.tapType === 'generico' ? 'Genérico' : 'Personalizado'}</span>
                <Badge tone={r.status === 'fulfilled' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
                  {r.status === 'fulfilled' ? 'Entregado' : r.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-text-muted">
        ¿Prefieres un stand o una placa? Míralos en la{' '}
        <Link href="/hardware" className="font-medium text-primary hover:text-primary-hover">Tienda NFC</Link>.
      </p>
    </Card>
  );
}
