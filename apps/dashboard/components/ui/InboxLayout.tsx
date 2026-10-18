'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Sheet } from './Sheet';

export type InboxLayoutProps = {
  list: ReactNode;
  detail: ReactNode | null;
  emptyDetail: ReactNode;
  /** Called when the mobile detail Sheet is closed; the parent should clear its selection. */
  onCloseDetail(): void;
};

/** True below Tailwind's lg breakpoint. Starts false so SSR/first paint never mounts the Sheet. */
function useBelowLg() {
  const [below, setBelow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023.98px)');
    setBelow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setBelow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return below;
}

const pane = 'bg-surface border border-border rounded-card shadow-card overflow-y-auto';

// ponytail: desktop pane height is a fixed viewport calc; tune once the new layout header height is final.
export function InboxLayout({ list, detail, emptyDetail, onCloseDetail }: InboxLayoutProps) {
  const belowLg = useBelowLg();

  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-12rem)] lg:min-h-[480px] lg:grid-cols-[minmax(280px,360px)_1fr]">
      <section aria-label="Lista" className={pane}>{list}</section>
      {/* Desktop pane is CSS-hidden below lg: no layout shift, and the selection survives resizes.
          Its content renders only at lg+ so `detail` is never mounted twice (Sheet below lg). */}
      <section aria-label="Detalle" className={`hidden lg:block ${pane}`}>{!belowLg && (detail ?? emptyDetail)}</section>
      {belowLg && (
        <Sheet open={detail != null} onClose={onCloseDetail} side="right">
          {detail}
        </Sheet>
      )}
    </div>
  );
}
