'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi, reputacionApi, type ReviewAutoSettings } from '../lib/api-client';
import { useRestaurant } from '../context/RestaurantContext';
import { Button, Card, Input, Select, Switch, Textarea } from './ui';
import { GBP_API_ENABLED } from './reputation/googleReviews';
import { useCustomerLabels } from '../hooks/useCustomerLabels';

const DEFAULT_AUTO = { enabled: false, stars: [4, 5], delayMin: 30, delayMax: 180 };
const STAR_OPTIONS = [1, 2, 3, 4, 5];

type Quota = { limit: number; used: number; remaining: number };

const toggle = (list: number[], s: number) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s].sort());

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-card border border-border p-4">
      <legend className="px-1 text-sm font-semibold text-text">{title}</legend>
      {children}
    </fieldset>
  );
}

function StarChecks({ label, value, onChange }: { label: string; value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-x-4 gap-y-2">
      {STAR_OPTIONS.map((s) => (
        <label key={s} className="flex min-h-11 items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={value.includes(s)} onChange={() => onChange(toggle(value, s))} />
          {s} {s === 1 ? 'estrella' : 'estrellas'}
        </label>
      ))}
    </div>
  );
}

// Alertas por correo, palabras clave, respuesta automática y estilo de las respuestas de la sede.
export default function ReviewAutomation({ placeId }: { placeId: string }) {
  const { places } = useRestaurant();
  const { customer } = useCustomerLabels();
  const [settings, setSettings] = useState<ReviewAutoSettings | null>(null);
  const [draft, setDraft] = useState<ReviewAutoSettings | null>(null);
  const [keywordsText, setKeywordsText] = useState('');
  const [quota, setQuota] = useState<Quota | null>(null);
  const [saving, setSaving] = useState(false);
  const [oldStars, setOldStars] = useState<number[]>([4, 5]);
  const [oldMax, setOldMax] = useState(50);
  const [busyOld, setBusyOld] = useState(false);

  const apply = (s: ReviewAutoSettings) => {
    setSettings(s);
    setDraft(s);
    setKeywordsText((s.keywords ?? []).join(', '));
  };

  useEffect(() => {
    setSettings(null);
    setDraft(null);
    setQuota(null);
    businessApi.getReviewAuto(placeId).then(apply).catch(() => { /* sin datos: no se muestra */ });
    reputacionApi.quota(placeId).then(setQuota).catch(() => setQuota(null));
  }, [placeId]);

  if (!settings || !draft) return null;

  const canAutoReply = GBP_API_ENABLED && !!settings.googleConnected;
  const auto = draft.autoReply ?? DEFAULT_AUTO;
  const set = (patch: Partial<ReviewAutoSettings>) => setDraft({ ...draft, ...patch });
  const setAuto = (patch: Partial<typeof auto>) => set({ autoReply: { ...auto, ...patch } });
  const keywords = () => keywordsText.split(',').map((s) => s.trim()).filter(Boolean);

  const save = async () => {
    setSaving(true);
    try {
      const { googleConnected: _g, ...body } = draft;
      apply(await businessApi.setReviewAuto(placeId, { ...body, keywords: keywords() }));
      toast.success('Cambios guardados');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const replyOld = async () => {
    setBusyOld(true);
    try {
      const r = await reputacionApi.replyOld(placeId, { stars: oldStars, max: oldMax });
      let msg = `${r.encoladas} respuestas en cola. Se publican de a 8 cada 5 minutos.`;
      if (r.encoladas > r.cupoIaRestante) msg += ' Algunas saldrán con frases predefinidas porque se acaba tu cupo de IA.';
      toast.success(msg);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo encolar');
    } finally {
      setBusyOld(false);
    }
  };

  const copyToOthers = async () => {
    const others = places.filter((p) => p.id !== placeId);
    const { lowRatingMax, alertEmail, autoReply, tone, toneNotes, language, contactEmail } = settings;
    const results = await Promise.allSettled(
      others.map((p) => businessApi.setReviewAuto(p.id, { lowRatingMax, keywords: settings.keywords, alertEmail, autoReply, tone, toneNotes, language, contactEmail })),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const ok = results.length - failed;
    if (failed) toast.warning(`Copiado a ${ok} sedes. ${failed} no se pudieron copiar.`);
    else toast.success(`Copiado a ${ok} sedes`);
  };

  return (
    <Card padding="lg" className="space-y-5 lg:col-span-2">
      <div className="flex items-start gap-3">
        <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Bell size={20} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text">Automatizaciones de reseñas</h3>
          <p className="text-sm text-text-muted">Tú decides qué se responde solo y qué revisas tú.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Alertas por correo">
          <Switch label="Avisarme por correo" checked={draft.alerts} onChange={(alerts) => set({ alerts })} />
          <Select label="Avisar desde" value={draft.lowRatingMax ?? 3} onChange={(e) => set({ lowRatingMax: Number(e.target.value) })}>
            <option value={1}>1 estrella</option>
            <option value={2}>2 estrellas o menos</option>
            <option value={3}>3 estrellas o menos</option>
          </Select>
          <Textarea
            label="Palabras clave"
            hint={`Separadas por coma, máx. 20. También avisan las opiniones que llegan por tu QR/NFC si un ${customer} las menciona.`}
            rows={2}
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            placeholder="frío, demoró, mala atención"
          />
          <Input
            label="Enviar copia a (opcional)"
            type="email"
            value={draft.alertEmail ?? ''}
            onChange={(e) => set({ alertEmail: e.target.value })}
            placeholder="encargado@tulocal.pe"
          />
        </Section>

        <Section title="Estilo de las respuestas">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Tono" value={draft.tone ?? 'cercano'} onChange={(e) => set({ tone: e.target.value as ReviewAutoSettings['tone'] })}>
              <option value="cercano">Cercano</option>
              <option value="formal">Formal</option>
              <option value="divertido">Divertido</option>
            </Select>
            <Select label="Idioma" value={draft.language ?? 'cliente'} onChange={(e) => set({ language: e.target.value as ReviewAutoSettings['language'] })}>
              <option value="cliente">En el idioma de la reseña</option>
              <option value="es">Siempre en español</option>
            </Select>
          </div>
          <Textarea
            label="Indicaciones para la IA (opcional)"
            hint="Máx. 300 caracteres."
            rows={2}
            maxLength={300}
            value={draft.toneNotes ?? ''}
            onChange={(e) => set({ toneNotes: e.target.value })}
          />
          <Input
            label="Correo de contacto para reseñas de 1 a 3 estrellas"
            type="email"
            value={draft.contactEmail ?? ''}
            onChange={(e) => set({ contactEmail: e.target.value })}
            placeholder="hola@tulocal.pe"
          />
        </Section>

        <Section title="Respuesta automática en Google">
          {canAutoReply ? (
            <>
              <Switch label="Responder solas las reseñas nuevas" checked={auto.enabled} onChange={(enabled) => setAuto({ enabled })} />
              <StarChecks label="Calificaciones que se responden solas" value={auto.stars} onChange={(stars) => setAuto({ stars })} />
              {auto.stars.some((s) => s <= 3) && (
                <p className="text-sm text-amber-800">Recomendamos responder tú mismo las reseñas negativas.</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Esperar desde (min)" type="number" min={5} max={1440} value={auto.delayMin} onChange={(e) => setAuto({ delayMin: Number(e.target.value) })} />
                <Input label="Hasta (min)" type="number" min={5} max={1440} value={auto.delayMax} onChange={(e) => setAuto({ delayMax: Number(e.target.value) })} />
              </div>
              <p className="text-xs text-text-muted">Cada respuesta sale con una espera al azar para que se vea natural. Puedes cancelar las programadas desde la reseña.</p>
            </>
          ) : (
            <p className="text-sm text-text-muted">Conecta Google Business para responder automáticamente las reseñas de Google.</p>
          )}
        </Section>

        <div className="space-y-4">
          {quota && (
            <Section title="Respuestas con IA este mes">
              <p className="text-sm tabular-nums text-text"><b>{quota.used}</b> de {quota.limit} usadas</p>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (quota.used / Math.max(1, quota.limit)) * 100)}%` }} />
              </div>
              {quota.limit === 10 && <p className="text-xs text-text-muted">Al acabarse, las de 4 y 5 estrellas se responden con frases predefinidas.</p>}
            </Section>
          )}

          {canAutoReply && (
            <Section title="Responder reseñas antiguas">
              <StarChecks label="Calificaciones a responder" value={oldStars} onChange={setOldStars} />
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-28">
                  <Input label="Máximo" type="number" min={1} max={200} value={oldMax} onChange={(e) => setOldMax(Math.min(200, Math.max(1, Number(e.target.value) || 1)))} />
                </div>
                <Button variant="secondary" loading={busyOld} disabled={busyOld || oldStars.length === 0} onClick={replyOld}>
                  {busyOld ? 'Encolando...' : 'Responder antiguas'}
                </Button>
              </div>
            </Section>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button loading={saving} disabled={saving} onClick={save}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        {places.length > 1 && (
          <Button variant="ghost" onClick={copyToOthers}>Copiar a mis otras sedes</Button>
        )}
      </div>
    </Card>
  );
}
