import type { ReactNode } from 'react';
import { AlertCircle, type LucideIcon } from 'lucide-react';
import { Card } from './ui';

/** Text logo: "wuarikes" with the rocoto-red dot. */
export function AuthLogo({ className = 'text-2xl' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight text-text ${className}`}>
      wuarikes<span className="text-primary">.</span>
    </span>
  );
}

/** Inline error for auth forms: icon + text, never color alone. */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-control bg-danger/10 px-3 py-2.5 text-sm text-danger">
      <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Centered card shared by login, activation and password recovery. */
export default function AuthCard({
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card padding="lg" className="w-full max-w-md sm:p-8">
        <div className="mb-6 text-center">
          <AuthLogo />
          {Icon && (
            <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Icon size={24} aria-hidden />
            </div>
          )}
          <h1 className={`${Icon ? 'mt-4' : 'mt-6'} text-xl font-semibold text-text`}>{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-text-muted">{footer}</div>}
      </Card>
    </main>
  );
}
