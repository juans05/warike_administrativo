import Link from 'next/link';
import { CheckCircle2, Circle, X } from 'lucide-react';
import { Card } from './Card';
import { buttonStyles } from './Button';

export type ChecklistStep = {
  key: string;
  label: string;
  done: boolean;
  action?: { label: string; href: string };
};

export type ChecklistCardProps = {
  title: string;
  steps: ChecklistStep[];
  onDismiss?(): void;
};

export function ChecklistCard({ title, steps, onDismiss }: ChecklistCardProps) {
  const doneCount = steps.filter((s) => s.done).length;
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <Card padding="lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text">{title}</h2>
          <p className="mt-1 text-sm text-text-muted">
            {doneCount} de {steps.length} pasos listos
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Ocultar lista de pasos"
            className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-text-muted transition-colors duration-200 motion-reduce:transition-none hover:bg-background hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={20} aria-hidden />
          </button>
        )}
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso"
        className="mt-4 h-2 overflow-hidden rounded-full bg-background"
      >
        <div className="h-full rounded-full bg-success transition-all duration-200 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
      </div>

      <ul className="mt-4 divide-y divide-border">
        {steps.map((step) => (
          <li key={step.key} className="flex min-h-14 items-center gap-3 py-2">
            {step.done ? (
              <CheckCircle2 size={20} className="shrink-0 text-success" aria-hidden />
            ) : (
              <Circle size={20} className="shrink-0 text-text-muted" aria-hidden />
            )}
            <span className={`flex-1 text-sm ${step.done ? 'text-text-muted line-through' : 'font-medium text-text'}`}>
              {step.label}
              <span className="sr-only">{step.done ? ' (listo)' : ' (pendiente)'}</span>
            </span>
            {!step.done && step.action && (
              <Link href={step.action.href} className={buttonStyles('secondary', 'sm')}>
                {step.action.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
