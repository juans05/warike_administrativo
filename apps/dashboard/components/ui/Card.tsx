import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

const paddings = { sm: 'p-4', md: 'p-5', lg: 'p-6' } as const;

export type CardProps = {
  padding?: keyof typeof paddings;
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'>;

export function Card({ padding = 'md', children, className, ...rest }: CardProps) {
  return (
    <div className={cn('bg-surface border border-border rounded-card shadow-card', paddings[padding], className)} {...rest}>
      {children}
    </div>
  );
}
