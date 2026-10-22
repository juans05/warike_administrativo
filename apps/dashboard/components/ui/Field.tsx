'use client';

import { useId, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from './cn';

export type FieldProps = { label: string; error?: string; hint?: string };

/** Shared control classes for Input/Select/Textarea. */
export function controlStyles(error?: string, className?: string) {
  return cn(
    'w-full rounded-control border bg-surface px-3 text-sm text-text placeholder:text-text-muted',
    'transition-colors duration-200 motion-reduce:transition-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary',
    'disabled:bg-background disabled:cursor-not-allowed disabled:opacity-60',
    error ? 'border-danger' : 'border-border',
    className,
  );
}

/**
 * Label + hint + error wrapper; passes id/aria props to the control via render prop.
 * `describedBy` is the caller's own aria-describedby, merged with the hint/error ids.
 */
export function Field({
  label,
  error,
  hint,
  id,
  describedBy,
  children,
}: FieldProps & {
  id?: string;
  describedBy?: string;
  children: (a11y: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode;
}) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const showHint = Boolean(hint) && !error; // only reference ids that are rendered
  const hintId = showHint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const ariaDescribedBy = [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={controlId} className="text-sm font-medium text-text">
        {label}
      </label>
      {children({ id: controlId, 'aria-invalid': error ? true : undefined, 'aria-describedby': ariaDescribedBy })}
      {showHint && (
        <p id={hintId} className="text-xs text-text-muted">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle size={16} aria-hidden className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
