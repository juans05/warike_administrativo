import type { ReactNode } from 'react';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

// Text colors chosen for >= 4.5:1 on their tinted backgrounds.
const tones: Record<Tone, string> = {
  neutral: 'bg-background text-text-muted border border-border',
  primary: 'bg-primary-soft text-primary-hover',
  success: 'bg-success/10 text-success',
  warning: 'bg-secondary/20 text-text', // secondary is never used as text color
  danger: 'bg-danger/10 text-danger',
};

export type BadgeProps = { tone?: Tone; children: ReactNode };

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${tones[tone]}`}>
      {children}
    </span>
  );
}
