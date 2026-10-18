'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '../ui';

export type SortDir = 'asc' | 'desc';

/** Estado de orden de una tabla: pulsar la misma columna invierte el sentido; otra columna empieza en descendente. */
export function useSort<K extends string>(initialKey: K) {
  const [sortKey, setSortKey] = useState<K>(initialKey);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const toggleSort = (key: K) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };
  return { sortKey, sortDir, toggleSort };
}

export function SortTh<K extends string>({ label, sortKey, active, dir, onSort, align = 'left' }: {
  label: string;
  sortKey: K;
  active: boolean;
  dir: SortDir;
  onSort(key: K): void;
  align?: 'left' | 'right';
}) {
  const Arrow = dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined} className={cn('px-3 text-xs font-medium text-text-muted', align === 'right' ? 'text-right' : 'text-left')}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-control hover:text-text',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {label}
        {active && <Arrow size={16} aria-hidden />}
      </button>
    </th>
  );
}
