'use client';

import { Search } from 'lucide-react';
import { Card, Input, cn } from '../../ui';

export interface Place {
  id: string;
  name: string;
  category?: { name: string } | null;
  district?: { district: string } | null;
}

/** Buscador y lista de locales; el elegido es el que se configura a la derecha. */
export function PlacePicker({ places, search, onSearch, selectedId, onSelect }: {
  places: Place[];
  search: string;
  onSearch(value: string): void;
  selectedId: string | undefined;
  onSelect(place: Place): void;
}) {
  return (
    <Card padding="sm" className="h-fit space-y-3">
      <Input label="Buscar local" type="search" placeholder="Nombre del local" value={search} onChange={(e) => onSearch(e.target.value)} />
      <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
        {places.map((place) => {
          const selected = selectedId === place.id;
          return (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => onSelect(place)}
                aria-current={selected || undefined}
                className={cn(
                  'w-full rounded-control px-3 py-2 text-left transition-colors duration-200 motion-reduce:transition-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  selected ? 'bg-primary-soft' : 'hover:bg-background',
                )}
              >
                <span className="block truncate text-sm font-medium text-text">{place.name}</span>
                <span className="block truncate text-xs text-text-muted">
                  {[place.category?.name, place.district?.district].filter(Boolean).join(' · ') || '—'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {places.length === 0 && (
        <p className="flex items-center justify-center gap-2 px-2 py-4 text-sm text-text-muted">
          <Search size={16} aria-hidden />
          Sin resultados.
        </p>
      )}
    </Card>
  );
}
