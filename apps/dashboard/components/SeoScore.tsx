'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { reputacionApi } from '../lib/api-client';
import { Button, Card } from './ui';

type Item = { key: string; block: string; label: string; points: number; max: number; mission: string };
type Seo = { score: number; level: string; estimated: boolean; items: Item[]; nextMission: Item | null; at: string };

// Puntaje de la ficha de Google (0-100) con la siguiente acción que más suma.
export default function SeoScore({ placeId }: { placeId: string }) {
  const [seo, setSeo] = useState<Seo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSeo(null);
    reputacionApi.seo(placeId).then(setSeo).catch(() => {});
  }, [placeId]);

  const recalc = async () => {
    setBusy(true);
    try {
      setSeo(await reputacionApi.recalcSeo(placeId));
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo calcular');
    } finally {
      setBusy(false);
    }
  };

  const blocks = seo ? Array.from(new Set(seo.items.map((i) => i.block))) : [];

  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Search size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text">Tu ficha en Google</h3>
            <p className="text-sm text-text-muted">Qué tan completa y activa está tu ficha para aparecer en búsquedas cercanas.</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" loading={busy} disabled={busy} onClick={recalc}>
          {busy ? 'Calculando...' : seo ? 'Recalcular' : 'Calcular puntaje'}
        </Button>
      </div>

      {seo && (
        <>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-semibold tabular-nums text-primary">{seo.score}</span>
            <span className="pb-2 text-sm font-medium text-text">/ 100 · {seo.level}</span>
          </div>
          {seo.estimated && (
            <p className="text-sm text-amber-800">Puntaje estimado con datos públicos. Conecta Google Business para medirlo completo.</p>
          )}
          {seo.nextMission && (
            <div className="rounded-card bg-primary-soft p-4">
              <p className="text-xs font-medium text-primary-hover">
                Próxima misión · +{Math.round((seo.nextMission.max - seo.nextMission.points) * 10) / 10} pts
              </p>
              <p className="mt-1 text-sm font-medium text-text">{seo.nextMission.mission}</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {blocks.map((block) => {
              const items = seo.items.filter((i) => i.block === block);
              const pts = items.reduce((s, i) => s + i.points, 0);
              const max = items.reduce((s, i) => s + i.max, 0);
              return (
                <div key={block} className="rounded-card bg-background p-4">
                  <p className="flex justify-between text-sm font-medium text-text">
                    <span>{block}</span>
                    <span className="tabular-nums">{Math.round(pts)} / {max}</span>
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(pts / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-text-muted">Actualizado: {new Date(seo.at).toLocaleString('es-PE')}</p>
        </>
      )}
    </Card>
  );
}
