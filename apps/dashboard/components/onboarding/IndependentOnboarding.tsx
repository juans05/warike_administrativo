'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi, type CreateIndependentInput, type NicknameCheck } from '../../lib/api-client';
import { Button, Input, cn } from '../ui';

type Mode = CreateIndependentInput['serviceModes'][number];
type Service = { name: string; price: string; durationMin: string };

const MODES: { key: Mode; label: string }[] = [
  { key: 'local', label: 'En mi local' },
  { key: 'domicilio', label: 'A domicilio' },
  { key: 'silla', label: 'Alquilo una silla' },
];

const DEFAULT_SERVICES: Service[] = [
  { name: 'Corte', price: '25', durationMin: '30' },
  { name: 'Barba', price: '15', durationMin: '20' },
  { name: 'Corte + barba', price: '35', durationMin: '45' },
  { name: 'Cejas', price: '10', durationMin: '10' },
  { name: 'Diseño', price: '10', durationMin: '15' },
];

/** Sugerencia a partir del nombre: minúsculas, sin tildes, espacios → punto. */
const suggestNickname = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    .replace(/\s+/g, '.').replace(/[^a-z0-9._]/g, '').replace(/^\.+|\.+$/g, '').slice(0, 30);

const serviceValid = (s: Service) => {
  const price = Number(s.price);
  const minutes = Number(s.durationMin);
  return s.name.trim().length >= 2 && s.price !== '' && price >= 0 && price <= 10000 && Number.isInteger(minutes) && minutes >= 5 && minutes <= 480;
};

const chipClass = (on: boolean) => cn(
  'flex min-h-12 w-full items-center justify-between gap-3 rounded-card border-2 px-4 text-left text-sm font-medium',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  on ? 'border-primary bg-primary-soft text-primary-hover' : 'border-border bg-surface text-text',
);

export default function IndependentOnboarding({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameTouched, setNicknameTouched] = useState(false);
  const [check, setCheck] = useState<NicknameCheck | null>(null);
  const [zone, setZone] = useState('');
  const [modes, setModes] = useState<Mode[]>([]);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [saving, setSaving] = useState(false);

  const shownNickname = nicknameTouched ? nickname : suggestNickname(displayName);

  // Comprueba el nickname 400 ms después de dejar de escribir.
  useEffect(() => {
    setCheck(null);
    if (shownNickname.length < 3) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      businessApi.checkNickname(shownNickname)
        .then((res) => { if (!cancelled) setCheck(res); })
        .catch(() => { if (!cancelled) setCheck(null); });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [shownNickname]);

  const step1Ok = displayName.trim().length >= 2 && !!check?.valid && !!check?.available && check.nickname === shownNickname.replace(/^@/, '').toLowerCase();
  const step3Ok = services.length > 0 && services.every(serviceValid);

  const updateService = (i: number, patch: Partial<Service>) =>
    setServices((list) => list.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const submit = async () => {
    setSaving(true);
    try {
      const res = await businessApi.createIndependent({
        displayName: displayName.trim(),
        nickname: shownNickname,
        ...(zone.trim() ? { zone: zone.trim() } : {}),
        serviceModes: modes,
        services: services.map((s) => ({ name: s.name.trim(), price: Number(s.price), durationMin: Number(s.durationMin) })),
      });
      localStorage.setItem('activePlaceId', res.placeId);
      toast.success('¡Listo! Tu perfil está creado');
      onComplete();
    } catch (err: any) {
      const message = err?.message || 'No se pudo crear tu perfil';
      toast.error(message);
      // Alguien tomó el nickname mientras completaba los pasos.
      if (/nickname/i.test(message)) { setStep(1); setCheck(null); }
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md space-y-6 text-left">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => (step === 1 ? onBack() : setStep(step - 1))} disabled={saving}>
            Atrás
          </Button>
          <span className="text-xs font-medium text-text-muted">Paso {step} de 3</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
          <div className="h-full rounded-full bg-primary transition-all motion-reduce:transition-none" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text">Tus datos</h2>
          <Input label="¿Cómo te conocen tus clientes?" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Carlos" autoComplete="name" />
          <div className="space-y-1.5">
            <Input
              label="Tu nickname"
              value={shownNickname ? `@${shownNickname}` : ''}
              onChange={(e) => { setNicknameTouched(true); setNickname(e.target.value.replace(/^@/, '').toLowerCase().replace(/\s/g, '')); }}
              placeholder="@carlos.fade"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <NicknameStatus check={check} value={shownNickname} onPick={(v) => { setNicknameTouched(true); setNickname(v); }} />
            {shownNickname && <p className="text-xs text-text-muted">Tu link será wuarikes.pe/b/{shownNickname}</p>}
          </div>
          <Input label="¿En qué zona atiendes? (opcional)" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="San Juan de Miraflores" />
          <Button className="h-12 w-full" disabled={!step1Ok} onClick={() => setStep(2)}>Siguiente</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text">¿Dónde atiendes?</h2>
          <p className="text-sm text-text-muted">Marca todas las que apliquen.</p>
          <div className="space-y-2">
            {MODES.map((m) => {
              const on = modes.includes(m.key);
              return (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setModes((list) => (on ? list.filter((x) => x !== m.key) : [...list, m.key]))}
                  className={chipClass(on)}
                >
                  {m.label}
                  {on && <Check size={18} aria-hidden />}
                </button>
              );
            })}
          </div>
          <Button className="h-12 w-full" disabled={modes.length === 0} onClick={() => setStep(3)}>Siguiente</Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text">Tus servicios</h2>
          <p className="text-sm text-text-muted">Ajusta el precio y los minutos. Puedes cambiarlos cuando quieras.</p>
          <ul className="space-y-3">
            {services.map((s, i) => (
              <li key={i} className={cn('space-y-2 rounded-card border p-3', serviceValid(s) ? 'border-border' : 'border-danger')}>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input label="Servicio" value={s.name} onChange={(e) => updateService(i, { name: e.target.value })} />
                  </div>
                  <Button variant="ghost" icon={Trash2} aria-label={`Quitar ${s.name || 'servicio'}`} onClick={() => setServices((list) => list.filter((_, j) => j !== i))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Precio S/" type="number" inputMode="decimal" min={0} value={s.price} onChange={(e) => updateService(i, { price: e.target.value })} />
                  <Input label="Minutos" type="number" inputMode="numeric" min={5} max={480} value={s.durationMin} onChange={(e) => updateService(i, { durationMin: e.target.value })} />
                </div>
              </li>
            ))}
          </ul>
          <Button variant="secondary" icon={Plus} className="h-12 w-full" onClick={() => setServices((list) => [...list, { name: '', price: '', durationMin: '30' }])}>
            Agregar servicio
          </Button>
          <Button className="h-12 w-full" disabled={!step3Ok || saving} loading={saving} onClick={submit}>
            {saving ? 'Creando…' : 'Crear mi perfil'}
          </Button>
        </div>
      )}
    </section>
  );
}

function NicknameStatus({ check, value, onPick }: { check: NicknameCheck | null; value: string; onPick: (v: string) => void }) {
  if (value.length < 3) return <p className="text-xs text-text-muted">De 3 a 30 letras, números, punto o guion bajo.</p>;
  if (!check) return <p className="text-xs text-text-muted" aria-live="polite">Comprobando…</p>;
  if (!check.valid) {
    return <p role="alert" className="text-xs text-danger">Usa de 3 a 30 letras, números, punto o guion bajo (sin punto al inicio ni al final).</p>;
  }
  if (check.available) return <p className="text-xs font-medium text-success" aria-live="polite">✓ @{check.nickname} está libre</p>;
  return (
    <div className="space-y-1.5" aria-live="polite">
      <p className="text-xs text-danger">@{check.nickname} ya está en uso, prueba:</p>
      <div className="flex flex-wrap gap-2">
        {check.suggestions.map((s) => (
          <button key={s} type="button" onClick={() => onPick(s)} className="min-h-11 rounded-full border border-border px-3 text-xs font-medium text-text hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            @{s}
          </button>
        ))}
      </div>
    </div>
  );
}
