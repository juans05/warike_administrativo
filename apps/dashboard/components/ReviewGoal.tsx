'use client';

import { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';
import { Card, cn } from './ui';

const WEEKLY_PACE = 10;

/** Reseñas de 5 estrellas que faltan para que el promedio llegue a la meta: (R*T + 5n) / (T + n) >= meta. */
export function reviewsNeeded(rating: number, total: number, target: number): number {
  if (rating >= target) return 0;
  return Math.ceil((total * (target - rating)) / (5 - target));
}

// Convierte un decimal abstracto en una tarea: cuántas reseñas de 5 estrellas faltan y a qué ritmo.
export default function ReviewGoal({ placeId, rating, total }: { placeId: string; rating: number; total: number }) {
  const defaultTarget = rating < 4.5 ? 4.5 : rating < 4.8 ? 4.8 : 4.9;
  const [target, setTarget] = useState<number | null>(null);
  // La meta elegida se guarda en la configuración de reseñas de la sede.
  useEffect(() => {
    setTarget(null);
    businessApi.getReviewAuto(placeId).then((s) => { if (s?.goalRating > rating) setTarget(s.goalRating); }).catch(() => {});
  }, [placeId, rating]);
  const choose = (t: number) => {
    setTarget(t);
    businessApi.setReviewAuto(placeId, { goalRating: t }).catch(() => toast.error('No se pudo guardar tu meta'));
  };
  const goal = target ?? defaultTarget;

  if (!rating || !total) return null;

  const needed = reviewsNeeded(rating, total, goal);
  const weeks = Math.ceil(needed / WEEKLY_PACE);

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Target size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text">Tu meta de reseñas</h3>
            <p className="text-sm text-text-muted">Tienes {rating.toFixed(1)} estrellas con {total} reseñas en Google.</p>
          </div>
        </div>
        <div className="flex gap-2" role="radiogroup" aria-label="Meta de calificación">
          {[4.5, 4.7, 4.8, 4.9].filter((t) => t > rating).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={t === goal}
              onClick={() => choose(t)}
              className={cn(
                'min-h-11 rounded-control border px-4 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                t === goal ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-text hover:bg-background',
              )}
            >
              {t.toFixed(1)}
            </button>
          ))}
        </div>
      </div>

      {needed === 0 ? (
        <p className="text-sm font-medium text-success">Ya alcanzaste esta meta. Mantén el ritmo para no perderla.</p>
      ) : (
        <p className="text-sm leading-relaxed text-text">
          Te faltan <b className="text-primary-hover">{needed}</b> reseñas de 5 estrellas para llegar a {goal.toFixed(1)}.
          A {WEEKLY_PACE} por semana, lo logras en unas <b>{weeks} {weeks === 1 ? 'semana' : 'semanas'}</b>.
          Lo que más ayuda es que lleguen todas las semanas, no todas juntas.
        </p>
      )}
    </Card>
  );
}
