'use client';

import { useRef, type KeyboardEvent } from 'react';

export type TabItem = { key: string; label: string; badge?: number };

export type TabsProps = {
  tabs: TabItem[];
  value: string;
  onChange(key: string): void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // WAI-ARIA tabs pattern: arrows/Home/End move focus and select.
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(tabs[next].key);
  };

  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab, i) => {
        const selected = tab.key === value;
        return (
          <button
            key={tab.key}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`-mb-px inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              selected ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="rounded-full bg-primary-soft px-1.5 text-xs font-semibold tabular-nums text-primary-hover">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
