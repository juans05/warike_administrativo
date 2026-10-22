'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { ordersApi } from '../../../../lib/api-client';
import { useRestaurant } from '../../../../context/RestaurantContext';
import Link from 'next/link';
import { Badge, Button, Card, Input, PageHeader, Skeleton, Switch } from '../../../../components/ui';

function Radio({ checked, onChange, disabled, children }: { checked: boolean; onChange?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex min-h-11 items-start gap-3 py-2 text-sm text-text ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <input type="radio" className="mt-0.5 h-4 w-4 shrink-0 accent-primary" checked={checked} disabled={disabled} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-base font-semibold text-text">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
    </div>
  );
}

export default function OrderSettingsPage() {
  const { activePlaceId } = useRestaurant();
  const [settings, setSettings] = useState<any>(null);
  // Copia de lo último que vino del servidor: el botón Guardar aparece solo si hay cambios.
  const [savedJson, setSavedJson] = useState('');
  const [secret, setSecret] = useState('');
  const [saving, setSaving] = useState(false);

  const applyServer = useCallback((s: any) => { setSettings(s); setSavedJson(JSON.stringify(s)); }, []);

  const load = useCallback(() => {
    if (!activePlaceId) return;
    ordersApi.getSettings(activePlaceId).then(applyServer).catch((err: Error) => toast.error(err.message));
  }, [activePlaceId, applyServer]);
  useEffect(() => { load(); }, [load]);

  if (!settings) {
    return (
      <div role="status" aria-label="Cargando" className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-card" />)}
      </div>
    );
  }
  const set = (patch: Record<string, unknown>) => setSettings({ ...settings, ...patch });
  const isDirty = JSON.stringify(settings) !== savedJson || secret !== '';

  const save = async () => {
    setSaving(true);
    try {
      // El backend rechaza campos que no están en el DTO (forbidNonWhitelisted): se quitan los de solo lectura.
      const { culqiConfigured, culqiPublicKeyLast4, webhookUrl, placeId, updatedAt, wuarikesCommissionPct, deliveryFeeSoles, ...body } = settings;
      const deliveryFee = Math.round(Number(deliveryFeeSoles ?? settings.deliveryFee / 100) * 100);
      const saved = await ordersApi.updateSettings(activePlaceId!, { ...body, deliveryFee, ...(secret ? { culqiSecretKey: secret } : {}) });
      applyServer(saved); setSecret(''); toast.success('Configuración guardada');
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const testKeys = async () => {
    try {
      const r = await ordersApi.testCulqi(activePlaceId!);
      r.ok ? toast.success(r.message) : toast.error(r.message);
    } catch (err: any) {
      toast.error(err.message || 'No se pudieron probar las llaves');
    }
  };

  return (
    <div className="max-w-3xl space-y-4 pb-20">
      <PageHeader title="Configurar pedidos" subtitle="Cómo recibes y cobras los pedidos de la carta con QR y de WhatsApp." />

      <Card padding="lg">
        <SectionTitle title="Pedidos" />
        <Switch label="Recibir pedidos (carta con QR y WhatsApp)" checked={settings.ordersEnabled} onChange={(v) => set({ ordersEnabled: v })} />
        <fieldset className="mt-3 border-t border-border pt-3">
          <legend className="text-sm font-medium text-text">Cobro en mesa</legend>
          <Radio checked={settings.tablePaymentMode === 'CUENTA_ABIERTA'} onChange={() => set({ tablePaymentMode: 'CUENTA_ABIERTA' })}>Cuenta abierta: piden en rondas y pagan al final</Radio>
          <Radio checked={settings.tablePaymentMode === 'PREPAGO'} onChange={() => set({ tablePaymentMode: 'PREPAGO' })}>Pago por pedido: pagan antes de que vaya a cocina</Radio>
        </fieldset>
        <div className="mt-3 border-t border-border pt-3">
          <Switch label="Aceptar efectivo o POS en caja" checked={settings.cashPaymentEnabled} onChange={(v) => set({ cashPaymentEnabled: v })} />
          <Switch label="Los precios de mi carta incluyen IGV" checked={settings.pricesIncludeIgv} onChange={(v) => set({ pricesIncludeIgv: v })} />
        </div>
        <div className="mt-3 max-w-xs">
          <Input label="Tiempo de preparación estimado (min)" type="number" min={1} max={180} value={settings.prepTimeMin} onChange={(e) => set({ prepTimeMin: +e.target.value })} />
        </div>
      </Card>

      <Card padding="lg">
        <SectionTitle title="WhatsApp: recojo y delivery" />
        <Switch label="Recojo en el local" checked={settings.pickupEnabled} onChange={(v) => set({ pickupEnabled: v })} />
        <Switch label="Delivery" checked={settings.deliveryEnabled} onChange={(v) => set({ deliveryEnabled: v })} />
        {settings.deliveryEnabled && (
          <div className="mt-3 max-w-xs">
            <Input label="Tarifa de delivery (S/)" type="number" min={0} step="0.5" value={settings.deliveryFeeSoles ?? settings.deliveryFee / 100} onChange={(e) => set({ deliveryFeeSoles: e.target.value })} />
          </div>
        )}
      </Card>

      <Card padding="lg">
        <SectionTitle title="Series de comprobantes" subtitle="Caja numera cada comprobante con su serie: B001-00000001, B001-00000002..." />
        <div className="grid gap-3 sm:grid-cols-4">
          {([['TICKET', 'Serie ticket'], ['BOLETA', 'Serie boleta'], ['FACTURA', 'Serie factura'], ['NOTA_CREDITO', 'Serie nota de crédito']] as const).map(([key, label]) => (
            <Input
              key={key}
              label={label}
              maxLength={4}
              className="font-mono uppercase"
              value={settings.receiptSeries?.[key] ?? ''}
              onChange={(e) => set({ receiptSeries: { ...settings.receiptSeries, [key]: e.target.value.toUpperCase() } })}
            />
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <fieldset>
          <legend className="sr-only">¿Dónde recibes el dinero?</legend>
          <SectionTitle title="¿Dónde recibes el dinero?" />
          <Radio disabled checked={settings.paymentDestination === 'WUARIKES'}>A través de Wuarikes (próximamente: requiere validación legal y de Culqi)</Radio>
          <Radio checked={settings.paymentDestination === 'LOCAL'} onChange={() => set({ paymentDestination: 'LOCAL' })}>En mi propia cuenta Culqi</Radio>
        </fieldset>
        {settings.paymentDestination === 'LOCAL' && (
          <div className="mt-3 space-y-4 border-t border-border pt-4">
            <Input label="Llave pública (pk_...)" value={settings.culqiPublicKey ?? ''} onChange={(e) => set({ culqiPublicKey: e.target.value })} />
            <div className="space-y-1.5">
              {settings.culqiConfigured && <Badge tone="success">Llave secreta configurada</Badge>}
              <Input
                label="Llave secreta (sk_...)"
                type="password"
                autoComplete="off"
                placeholder={settings.culqiConfigured ? 'Déjala vacía para mantener la actual' : ''}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            </div>
            <p className="text-sm text-text">
              Registra este webhook en tu CulqiPanel (Eventos → Webhooks):{' '}
              <code className="break-all rounded bg-background px-2 py-0.5 text-text">{settings.webhookUrl}</code>
            </p>
            <Button variant="secondary" icon={KeyRound} onClick={testKeys}>Probar llaves</Button>
          </div>
        )}
      </Card>

      {isDirty && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-modal">
          <p className="text-sm text-text-muted">Tienes cambios sin guardar.</p>
          <Button onClick={save} loading={saving}>{saving ? 'Guardando...' : 'Guardar configuración'}</Button>
        </div>
      )}

      <p className="text-sm text-text-muted">Las mesas, sus QR y PIN se gestionan en <Link href="/mesas" className="font-medium text-primary underline">Mesas</Link>.</p>
    </div>
  );
}
