'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Field, controlStyles, type FieldProps } from './Field';

export type InputProps = FieldProps & InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...rest },
  ref,
) {
  return (
    <Field label={label} error={error} hint={hint} id={id}>
      {(a11y) => <input ref={ref} {...rest} {...a11y} className={controlStyles(error, `h-11 ${className ?? ''}`)} />}
    </Field>
  );
});
