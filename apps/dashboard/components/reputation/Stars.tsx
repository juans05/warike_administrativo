import { Star } from 'lucide-react';
import { cn } from '../ui';

/** Calificación de 1 a 5. El valor va también como texto accesible: no depende solo del color. */
export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span role="img" aria-label={`${value} de 5 estrellas`} className={cn('inline-flex gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} aria-hidden className={s <= value ? 'fill-secondary text-secondary' : 'text-border'} />
      ))}
    </span>
  );
}
