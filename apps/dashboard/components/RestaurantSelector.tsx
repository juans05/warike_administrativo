'use client';

import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';

export default function RestaurantSelector() {
  const { places, activePlaceId, setActivePlaceId } = useRestaurant();

  if (places.length <= 1) return null;

  const activePlace = places.find(p => p.id === activePlaceId);

  return (
    <div className="relative group">
      <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm border border-gray-100 p-2 pl-4 rounded-2xl group-hover:border-[#F26122]/30 transition-all cursor-pointer">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Restaurante Activo</span>
          <select 
            value={activePlaceId || ''} 
            onChange={(e) => setActivePlaceId(e.target.value)}
            className="bg-transparent border-none p-0 pr-8 font-bold text-sm text-[#1A1A1A] outline-none appearance-none cursor-pointer"
          >
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-8 h-8 rounded-xl bg-[#F7F8FA] flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
          ▼
        </div>
      </div>
    </div>
  );
}
