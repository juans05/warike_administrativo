import { cn } from '../ui';

/** Foto del cliente o, sin foto, su inicial. */
export function ReviewerAvatar({ name, photoUrl, size = 'md' }: { name?: string | null; photoUrl?: string | null; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-base';
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- foto externa de Google, sin dominio fijo para next/image
    return <img src={photoUrl} alt="" className={cn('shrink-0 rounded-full object-cover', box)} />;
  }
  return (
    <div aria-hidden className={cn('flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-hover', box)}>
      {((name ?? '').trim()[0] ?? '?').toUpperCase()}
    </div>
  );
}
