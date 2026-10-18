import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Heading level for the title; pick the one that fits the page outline. */
  headingLevel?: 'h2' | 'h3' | 'h4';
};

export function EmptyState({ icon: Icon, title, description, action, headingLevel: Heading = 'h2' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon size={24} aria-hidden />
      </div>
      <Heading className="text-base font-semibold text-text">{title}</Heading>
      {description && <p className="mt-1 max-w-sm text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
