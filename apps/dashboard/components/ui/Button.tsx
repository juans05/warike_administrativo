import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-surface text-text border border-border hover:bg-background',
  ghost: 'bg-transparent text-text hover:bg-primary-soft hover:text-primary-hover',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

// sm is 36px tall; the ::after pseudo-element extends its hit area to 44px.
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 relative after:absolute after:-inset-1',
  md: 'h-11 px-4 text-sm gap-2',
};

/** Shared classes so a next/link can look like a Button. */
export function buttonStyles(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-control font-medium whitespace-nowrap',
    'transition-colors duration-200 motion-reduce:transition-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    className,
  );
}

export type ButtonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, className, disabled, children, type = 'button', ...rest },
  ref,
) {
  const iconSize = size === 'sm' ? 16 : 20;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles(variant, size, className)}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin motion-reduce:animate-none" aria-hidden />
      ) : (
        Icon && <Icon size={iconSize} aria-hidden />
      )}
      {children}
    </button>
  );
});
