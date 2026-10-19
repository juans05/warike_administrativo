'use client';

import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, controlStyles } from '../ui';

/** Select compacto para celdas de tabla y filtros: la etiqueta es solo para lectores de pantalla (`aria-label`). */
export function InlineSelect({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { 'aria-label': string }) {
  return (
    <div className="relative inline-block">
      <select {...rest} className={cn(controlStyles(undefined, 'h-11 appearance-none pr-8 md:h-9'), className)}>
        {children}
      </select>
      <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted" />
    </div>
  );
}
