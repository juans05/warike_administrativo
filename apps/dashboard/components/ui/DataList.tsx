import type { ReactNode } from 'react';
import { Skeleton } from './Skeleton';

export type DataListProps<T> = {
  items: T[];
  loading?: boolean;
  empty: ReactNode;
  renderItem(item: T): ReactNode;
};

// ponytail: rows are keyed by index; add a getKey prop if a caller reorders rows that hold local state.
export function DataList<T>({ items, loading = false, empty, renderItem }: DataListProps<T>) {
  if (loading) {
    return (
      <div role="status" aria-label="Cargando" className="divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (items.length === 0) return <>{empty}</>;
  return (
    <ul className="divide-y divide-border">
      {items.map((item, i) => (
        <li key={i}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
