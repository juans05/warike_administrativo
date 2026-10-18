import { cn } from './cn';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('h-4 animate-pulse rounded-control bg-border motion-reduce:animate-none', className)} />;
}
