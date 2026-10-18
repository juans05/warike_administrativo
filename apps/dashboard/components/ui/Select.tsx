'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { Field, controlStyles, type FieldProps } from './Field';

export type SelectProps = FieldProps & SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, className, 'aria-describedby': describedBy, children, ...rest },
  ref,
) {
  return (
    <Field label={label} error={error} hint={hint} id={id} describedBy={describedBy}>
      {(a11y) => (
        <div className="relative">
          <select ref={ref} {...rest} {...a11y} className={controlStyles(error, `h-11 appearance-none pr-10 ${className ?? ''}`)}>
            {children}
          </select>
          <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>
      )}
    </Field>
  );
});
