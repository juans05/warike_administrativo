'use client';

import React, { useState } from 'react';

const WEEKLY_PACE = 10;

/** Reseñas de 5 estrellas que faltan para que el promedio llegue a la meta: (R*T + 5n) / (T + n) >= meta. */
export function reviewsNeeded(rating: number, total: number, target: number): number {
  if (rating >= target) return 0;
  return Math.ceil((total * (target - rating)) / (5 - target));
}

// Convierte un decimal abstracto en una tarea: cuántas reseñas de 5 estrellas faltan y a qué ritmo.
export default function ReviewGoal({ rating, total }: { rating: number; total: number }) {
  const defaultTarget = rating < 4.5 ? 4.5 : rating < 4.8 ? 4.8 : 4.9;
  const [target, setTarget] = useState<number | null>(null);
  const goal = target ?? defaultTarget;

  if (!rating || !total) return null;

  const needed = reviewsNeeded(rating, total, goal);
  const weeks = Math.ceil(needed / WEEKLY_PACE);

  return (
    <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-border space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-text font-warike">Tu meta de reseñas</h3>
          <p className="text-xs font-bold text-text-muted">Tienes {rating.toFixed(1)} ⭐ con {total} reseñas en Google.</p>
        </div>
        <div className="flex gap-2" role="radiogroup" aria-label="Meta de calificación">
          {[4.5, 4.7, 4.8, 4.9].filter((t) => t > rating).map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={t === goal}
              onClick={() => setTarget(t)}
              className={`min-h-[40px] rounded-full border-2 px-4 text-xs font-black ${t === goal ? 'border-primary bg-primary text-white' : 'border-border text-text'}`}
            >
              {t.toFixed(1)} ⭐
            </button>
          ))}
        </div>
      </div>

      {needed === 0 ? (
        <p className="text-sm font-black text-green-600">Ya alcanzaste esta meta. Mantén el ritmo para no perderla.</p>
      ) : (
        <p className="text-sm font-bold text-text leading-relaxed">
          Te faltan <b className="text-primary">{needed}</b> reseñas de 5 estrellas para llegar a {goal.toFixed(1)}.
          A {WEEKLY_PACE} por semana, lo logras en unas <b>{weeks} {weeks === 1 ? 'semana' : 'semanas'}</b>.
          Lo que más ayuda es que lleguen todas las semanas, no todas juntas.
        </p>
      )}
    </section>
  );
}
