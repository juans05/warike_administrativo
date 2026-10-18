'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { Field, controlStyles, type FieldProps } from './Field';

export type TextareaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className, 'aria-describedby': describedBy, rows = 4, ...rest },
  ref,
) {
  return (
    <Field label={label} error={error} hint={hint} id={id} describedBy={describedBy}>
      {(a11y) => (
        <textarea ref={ref} rows={rows} {...rest} {...a11y} className={controlStyles(error, `py-2.5 ${className ?? ''}`)} />
      )}
    </Field>
  );
});
