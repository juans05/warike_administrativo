'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Sheet } from './Sheet';

export type InboxLayoutProps = {
  list: ReactNode;
  detail: ReactNode | null;
  emptyDetail: ReactNode;
  /** Called when the mobile detail Sheet is closed; the parent should clear its selection. */
  onCloseDetail?(): void;
};

const DESKTOP = '(min-width: 1024px)';

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    setDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return desktop;
}

const pane = 'bg-surface border border-border rounded-card shadow-card overflow-y-auto';

// ponytail: desktop pane height is a fixed viewport calc; tune once the new layout header height is final.
export function InboxLayout({ list, detail, emptyDetail, onCloseDetail }: InboxLayoutProps) {
  const desktop = useIsDesktop();

  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-12rem)] lg:min-h-[480px] lg:grid-cols-[minmax(280px,360px)_1fr]">
      <section aria-label="Lista" className={pane}>{list}</section>
      {desktop ? (
        <section aria-label="Detalle" className={pane}>{detail ?? emptyDetail}</section>
      ) : (
        <Sheet open={detail != null} onClose={() => onCloseDetail?.()} side="right">
          {detail}
        </Sheet>
      )}
    </div>
  );
}
