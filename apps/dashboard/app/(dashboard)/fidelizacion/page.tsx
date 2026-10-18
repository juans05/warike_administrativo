'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, Coins, Gift, Info, Lock, Plus, Send, Smartphone, Star, Trash2, Wallet, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '../../../context/RestaurantContext';
import { fetchWithAuth } from '../../../lib/api-client';
import { plural } from '../../../lib/modules';
import {
  Badge, Button, Card, DataList, EmptyState, Input, PageHeader, Skeleton, StatTile, Switch, Textarea, buttonStyles, cn,
} from '../../../components/ui';

type ProgramType = 'stamps' | 'points';

interface ProgramForm {
  type: ProgramType;
  stampsToReward: number;
  pointsPerVisit: number;
  minHoursBetweenVisits: number;
  rewardTitle: string;
  rewardDescription: string;
  isActive: boolean;
  winbackEnabled: boolean;
  winbackMessage: string;
}

const DEFAULT_FORM: ProgramForm = {
  type: 'stamps',
  stampsToReward: 10,
  pointsPerVisit: 10,
  minHoursBetweenVisits: 24,
  rewardTitle: '',
  rewardDescription: '',
  isActive: true,
  winbackEnabled: false,
  winbackMessage: '',
};

const formFromProgram = (p: any): ProgramForm => ({
  type: p.type || 'stamps',
  stampsToReward: p.stampsToReward || 10,
  pointsPerVisit: p.pointsPerVisit || 10,
  minHoursBetweenVisits: p.minHoursBetweenVisits ?? 24,
  rewardTitle: p.rewardTitle || '',
  rewardDescription: p.rewardDescription || '',
  isActive: p.isActive ?? true,
  winbackEnabled: p.winbackEnabled ?? false,
  winbackMessage: p.winbackMessage || '',
});

export default function FidelizacionPage() {
  const { activePlaceId, activePlace } = useRestaurant();
  const customer = (activePlace?.verticalConfig?.labels.customer ?? 'Cliente').toLowerCase();
  const customers = plural(customer);

  const [program, setProgram] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<string | null>(null);

  // `form` es lo que se edita; `savedForm`, lo último guardado (para saber si hay cambios).
  const [form, setForm] = useState<ProgramForm>(DEFAULT_FORM);
  const [savedForm, setSavedForm] = useState<ProgramForm>(DEFAULT_FORM);
  const set = (patch: Partial<ProgramForm>) => setForm((prev) => ({ ...prev, ...patch }));
  const isDirty = !program || (Object.keys(form) as (keyof ProgramForm)[]).some((key) => form[key] !== savedForm[key]);

  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardStamps, setNewRewardStamps] = useState(10);
  const [isAddingReward, setIsAddingReward] = useState(false);

  const [campaignHeader, setCampaignHeader] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  // { walletAudience, whatsappConfigured } — null mientras carga o si falla
  const [notifStatus, setNotifStatus] = useState<{ walletAudience: number; whatsappConfigured: boolean } | null>(null);

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    // Si cambia el local antes de que responda el anterior, esa respuesta no debe llenar el formulario del nuevo.
    let cancelled = false;
    let failed = false;
    setIsLoading(true);
    setLoadFailed(false);
    setSubscriptionBlocked(null);
    Promise.all([
      fetchWithAuth(`/business/places/${activePlaceId}/loyalty/program`).catch((err) => {
        if (cancelled) return null;
        if (err?.message?.includes('suscripción activa') || err?.message?.includes('requiere el plan')) {
          setSubscriptionBlocked(err.message);
        } else {
          failed = true; // sin esto, "Guardar" pisaría el programa real con los valores por defecto
        }
        return null;
      }),
      fetchWithAuth(`/business/places/${activePlaceId}/loyalty/rewards`).catch(() => []),
      fetchWithAuth(`/business/places/${activePlaceId}/loyalty/notifications-status`).catch(() => null),
    ]).then(([prog, rwds, status]) => {
      if (cancelled) return;
      setNotifStatus(status);
      setProgram(prog);
      const loaded = prog ? formFromProgram(prog) : DEFAULT_FORM;
      setForm(loaded);
      setSavedForm(loaded);
      setRewards(Array.isArray(rwds) ? rwds : []);
      setLoadFailed(failed);
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [activePlaceId, reloadKey]);

  const handleSave = async () => {
    if (!activePlaceId) return;
    setIsSaving(true);
    try {
      const saved = await fetchWithAuth(`/business/places/${activePlaceId}/loyalty/program`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setProgram(saved);
      setSavedForm(form);
      toast.success('Programa guardado');
    } catch { toast.error('Error al guardar'); }
    setIsSaving(false);
  };

  const handleAddReward = async () => {
    if (!activePlaceId || !newRewardTitle) return;
    setIsAddingReward(true);
    try {
      const reward = await fetchWithAuth(`/business/places/${activePlaceId}/loyalty/rewards`, {
        method: 'POST',
        body: JSON.stringify({ title: newRewardTitle, stampsCost: newRewardStamps }),
      });
      setRewards(prev => [...prev, reward]);
      setNewRewardTitle('');
      setNewRewardStamps(10);
    } catch { toast.error('Error al crear premio'); }
    setIsAddingReward(false);
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!activePlaceId) return;
    try {
      await fetchWithAuth(`/business/places/${activePlaceId}/loyalty/rewards/${rewardId}`, { method: 'DELETE' });
      setRewards(prev => prev.filter(r => r.id !== rewardId));
    } catch { toast.error('Error al eliminar el premio'); }
  };

  const handleSendCampaign = async () => {
    if (!activePlaceId || !campaignHeader || !campaignBody) return;
    setIsSendingCampaign(true);
    try {
      const res = await fetchWithAuth(`/business/places/${activePlaceId}/loyalty/wallet-campaign`, {
        method: 'POST',
        body: JSON.stringify({ header: campaignHeader, body: campaignBody }),
      });
      toast.success(`Enviado a ${res.totalQueued} ${res.totalQueued === 1 ? customer : customers}`);
      setCampaignHeader('');
      setCampaignBody('');
    } catch (err: any) { toast.error(err?.message || 'Error al enviar la campaña'); }
    setIsSendingCampaign(false);
  };

  if (isLoading) return <FidelizacionSkeleton />;

  if (subscriptionBlocked) {
    return (
      <EmptyState
        icon={Lock}
        title="Fidelización disponible en un plan superior"
        description={subscriptionBlocked}
        action={<Link href="/suscripcion" className={buttonStyles('primary')}>Ver planes</Link>}
      />
    );
  }

  if (loadFailed) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No pudimos cargar tu programa"
        description="Revisa tu conexión e inténtalo de nuevo."
        action={<Button variant="secondary" onClick={() => setReloadKey((n) => n + 1)}>Reintentar</Button>}
      />
    );
  }

  const audience = notifStatus?.walletAudience ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fidelización"
        subtitle={`Recompensa a tus ${customers} frecuentes con sellos o puntos canjeables.`}
      />

      {program && (
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Tarjetas" value={program.totalCards || 0} />
          <StatTile label="Canjes" value={program.totalRedemptions || 0} />
          <StatTile label="Escaneos" value={program.totalScans || 0} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          {/* Programa */}
          <Card padding="lg" className="space-y-5">
            <CardTitle title="Programa" />
            <Switch label="Programa activo" checked={form.isActive} onChange={(isActive) => set({ isActive })} />

            <div role="radiogroup" aria-label="Tipo de programa" className="grid grid-cols-2 gap-3">
              {([
                ['stamps', 'Sellos', '1 sello por visita', Star],
                ['points', 'Puntos', 'Puntos según el consumo', Coins],
              ] as [ProgramType, string, string, LucideIcon][]).map(([value, label, hint, Icon]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={form.type === value}
                  onClick={() => set({ type: value })}
                  className={cn(
                    'flex min-h-11 flex-col items-center gap-1 rounded-card border-2 p-4 text-center transition-colors duration-200 motion-reduce:transition-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    form.type === value ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary',
                  )}
                >
                  <Icon size={24} aria-hidden className="text-primary" />
                  <span className="text-sm font-medium text-text">{label}</span>
                  <span className="text-xs text-text-muted">{hint}</span>
                </button>
              ))}
            </div>

            {form.type === 'stamps' ? (
              <NumberInput
                label="Sellos para ganar premio"
                min={1}
                max={50}
                value={form.stampsToReward}
                onChange={(stampsToReward) => set({ stampsToReward })}
                hint={`${form.stampsToReward} sellos = 1 premio`}
              />
            ) : (
              <NumberInput
                label="Puntos por visita"
                min={1}
                value={form.pointsPerVisit}
                onChange={(pointsPerVisit) => set({ pointsPerVisit })}
              />
            )}

            <NumberInput
              label="Espera mínima entre visitas (horas)"
              min={0}
              value={form.minHoursBetweenVisits}
              onChange={(minHoursBetweenVisits) => set({ minHoursBetweenVisits })}
              hint={`Evita que el mismo ${customer} sume sellos varias veces seguidas. Usa 0 para desactivar el límite.`}
            />
            <Input
              label="Premio principal"
              value={form.rewardTitle}
              onChange={(e) => set({ rewardTitle: e.target.value })}
              placeholder="Ej: 20% de descuento en tu próxima visita"
            />
            <Textarea
              label="Descripción del premio"
              rows={2}
              value={form.rewardDescription}
              onChange={(e) => set({ rewardDescription: e.target.value })}
              placeholder="Ej: Válido por 30 días, no acumulable con otras promociones"
            />
          </Card>

          {/* Recompensas */}
          <Card padding="lg" className="space-y-4">
            <CardTitle title="Recompensas" subtitle={`Premios adicionales que tus ${customers} canjean con sellos.`} />
            <DataList
              items={rewards}
              empty={
                <EmptyState
                  icon={Gift}
                  headingLevel="h3"
                  title="Aún no tienes recompensas adicionales"
                  description="Agrega premios con distinto costo en sellos."
                />
              }
              renderItem={(reward) => (
                <div className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{reward.title}</p>
                    <p className="text-xs tabular-nums text-text-muted">{reward.stampsCost} sellos</p>
                  </div>
                  <Button
                    variant="ghost"
                    icon={Trash2}
                    aria-label={`Eliminar ${reward.title}`}
                    onClick={() => handleDeleteReward(reward.id)}
                    className="w-11 px-0"
                  />
                </div>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-[1fr_6rem_auto] sm:items-end">
              <Input
                label="Nombre del premio"
                value={newRewardTitle}
                onChange={(e) => setNewRewardTitle(e.target.value)}
                placeholder="Nombre del premio"
              />
              <NumberInput label="Sellos" min={1} value={newRewardStamps} onChange={setNewRewardStamps} />
              <Button variant="secondary" icon={Plus} loading={isAddingReward} disabled={!newRewardTitle} onClick={handleAddReward}>
                Agregar
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Mensaje automático de reactivación */}
          <Card padding="lg" className="space-y-4">
            <CardTitle
              title="Mensaje automático de reactivación"
              subtitle={`Si un ${customer} con tarjeta no vuelve en 30 días, le enviamos este mensaje por WhatsApp automáticamente a las 10:00 a. m. Si sigue sin volver, se lo reenviamos cada 30 días.`}
            />
            {notifStatus && !notifStatus.whatsappConfigured && (
              <Notice tone="warning" icon={AlertTriangle}>
                Tu local no tiene un número de WhatsApp Business conectado, así que estos mensajes no se enviarán.{' '}
                <Link href="/plazbot" className="font-medium text-primary-hover underline">Conectar WhatsApp</Link>
              </Notice>
            )}
            <Switch label="Activar mensaje de reactivación" checked={form.winbackEnabled} onChange={(winbackEnabled) => set({ winbackEnabled })} />
            <Textarea
              label="Mensaje"
              rows={3}
              maxLength={300}
              disabled={!form.winbackEnabled}
              value={form.winbackMessage}
              onChange={(e) => set({ winbackMessage: e.target.value })}
              placeholder="Ej. ¡Te extrañamos! Vuelve por tu sello y no pierdas tu progreso."
            />
          </Card>

          {/* Wallet */}
          <Card padding="lg" className="space-y-5">
            <CardTitle
              title="Wallet"
              subtitle={`Tus ${customers} pueden agregar su tarjeta al wallet de su móvil desde la página de su tarjeta. Los sellos se reflejan en tiempo real.`}
            />
            <ul className="divide-y divide-border rounded-card border border-border">
              {([
                ['Apple Wallet', 'iOS · Pase .pkpass nativo', Smartphone],
                ['Google Wallet', 'Android · JWT firmado', Wallet],
              ] as [string, string, LucideIcon][]).map(([name, detail, Icon]) => (
                <li key={name} className="flex items-center gap-3 p-3">
                  <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">{name}</p>
                    <p className="text-xs text-text-muted">{detail}</p>
                  </div>
                  <Badge tone="success">Activo</Badge>
                </li>
              ))}
            </ul>
            <p className="text-sm text-text-muted">
              Los botones aparecen automáticamente en la tarjeta según el dispositivo (iOS o Android).
            </p>

            {/* Vista previa de la tarjeta */}
            <div className="relative h-36 overflow-hidden rounded-card bg-primary p-5 text-white">
              <div aria-hidden className="absolute right-0 top-0 h-40 w-40 -translate-y-10 translate-x-10 rounded-full bg-white/10" />
              <div aria-hidden className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-8 rounded-full bg-white/10" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs">Tarjeta de fidelización</p>
                    <p className="truncate text-base font-semibold">{activePlace?.name ?? 'Tu negocio'}</p>
                  </div>
                  <Star size={24} aria-hidden />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div aria-hidden className="flex items-center gap-1.5">
                    {Array.from({ length: Math.min(form.stampsToReward, 8) }).map((_, i) => (
                      <span key={i} className={cn('h-4 w-4 rounded-full border-2 border-white', i < 3 && 'bg-white')} />
                    ))}
                    {form.stampsToReward > 8 && <span className="text-xs font-medium">+{form.stampsToReward - 8}</span>}
                  </div>
                  <p className="text-xs tabular-nums">3 / {form.stampsToReward} sellos (ejemplo)</p>
                </div>
              </div>
            </div>

            {/* Aviso masivo por Wallet */}
            <div className="space-y-3 border-t border-border pt-5">
              <div>
                <h3 className="text-base font-semibold text-text">Notificar a mis {customers}</h3>
                <p className="mt-0.5 text-sm text-text-muted">
                  Manda un aviso a la tarjeta de tus {customers} (ej. &quot;Hoy 20% de descuento&quot;). Solo llega a quienes guardaron su tarjeta en <b>Google Wallet</b>; les aparece como notificación en el celular. Máximo 3 avisos por día.
                </p>
              </div>
              {notifStatus && (
                audience > 0 ? (
                  <Notice tone="info" icon={Info}>
                    Llegará a {audience} {audience === 1 ? customer : customers} con Google Wallet
                  </Notice>
                ) : (
                  <Notice tone="warning" icon={AlertTriangle}>
                    Aún ningún {customer} guardó su tarjeta en Google Wallet. Invítalos desde la página de su tarjeta.
                  </Notice>
                )
              )}
              <Input
                label="Título"
                value={campaignHeader}
                onChange={(e) => setCampaignHeader(e.target.value)}
                placeholder="Ej. Promo de hoy"
                maxLength={60}
              />
              <Textarea
                label="Mensaje"
                rows={2}
                value={campaignBody}
                onChange={(e) => setCampaignBody(e.target.value)}
                placeholder="Ej. 20% de descuento hasta las 8 p. m."
                maxLength={200}
              />
              <Button
                variant="secondary"
                icon={Send}
                loading={isSendingCampaign}
                disabled={!campaignHeader || !campaignBody || notifStatus?.walletAudience === 0}
                onClick={handleSendCampaign}
              >
                {isSendingCampaign ? 'Enviando...' : 'Enviar notificación'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {isDirty && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-modal">
          <p className="text-sm text-text-muted">{program ? 'Tienes cambios sin guardar.' : 'Aún no guardaste tu programa.'}</p>
          <Button onClick={handleSave} loading={isSaving}>Guardar</Button>
        </div>
      )}
    </div>
  );
}

/** Número editable: mientras se escribe se guarda el texto (se puede vaciar) y se ajusta al rango al salir del campo. */
function NumberInput({ label, value, min, max = Infinity, hint, onChange }: {
  label: string;
  value: number;
  min: number;
  max?: number;
  hint?: string;
  onChange(value: number): void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => { setText(String(value)); }, [value]);
  return (
    <Input
      label={label}
      type="number"
      inputMode="numeric"
      min={min}
      max={Number.isFinite(max) ? max : undefined}
      value={text}
      hint={hint}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value !== '' && Number.isInteger(n) && n >= min && n <= max) onChange(n);
      }}
      onBlur={() => {
        const n = Math.min(max, Math.max(min, Math.round(Number(text)) || min));
        setText(String(n));
        onChange(n);
      }}
    />
  );
}

function CardTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-text">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
    </div>
  );
}

function Notice({ tone, icon: Icon, children }: { tone: 'info' | 'warning'; icon: LucideIcon; children: ReactNode }) {
  return (
    <p className={cn('flex items-start gap-2 rounded-control p-3 text-sm text-text', tone === 'info' ? 'bg-primary-soft' : 'bg-secondary/20')}>
      <Icon size={20} aria-hidden className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function FidelizacionSkeleton() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} padding="lg" className="space-y-3">
            <Skeleton className="w-32" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </Card>
        ))}
      </div>
    </div>
  );
}
