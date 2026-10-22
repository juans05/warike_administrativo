'use client';

import React from 'react';
import { Store } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Select } from './ui';

export default function RestaurantSelector() {
  const { places, activePlaceId, activePlace, setActivePlaceId } = useRestaurant();

  if (places.length === 0) return null;

  if (places.length === 1) {
    return (
      <div className="flex min-h-11 items-center gap-2 rounded-control border border-border bg-background px-3 text-sm">
        <Store size={16} aria-hidden className="shrink-0 text-text-muted" />
        <span className="truncate font-medium text-text">{activePlace?.name ?? places[0].name}</span>
      </div>
    );
  }

  return (
    <Select label="Local activo" value={activePlaceId || ''} onChange={(e) => setActivePlaceId(e.target.value)}>
      {places.map((place) => (
        <option key={place.id} value={place.id}>
          {place.name}
        </option>
      ))}
    </Select>
  );
}
