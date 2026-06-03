'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { businessApi } from '../lib/api-client';

interface Place {
  id: string;
  name: string;
  coverImageUrl?: string;
}

interface RestaurantContextValue {
  places: Place[];
  activePlaceId: string | null;
  setActivePlaceId: (id: string) => void;
  isLoading: boolean;
  refreshPlaces: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextValue | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
  // Inicializar en null — se asigna solo después de validar con el backend
  const [activePlaceId, setActivePlaceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshingRef = useRef(false);

  const refreshPlaces = async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const rawData = await businessApi.getMyPlaces();
      const data: Place[] = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
      setPlaces(data);

      const stored = typeof window !== 'undefined' ? localStorage.getItem('activePlaceId') : null;
      if (stored && data.find(p => p.id === stored)) {
        setActivePlaceIdState(stored);
      } else if (data.length > 0) {
        setActivePlaceIdState(data[0].id);
        localStorage.setItem('activePlaceId', data[0].id);
      } else {
        setActivePlaceIdState(null);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setIsLoading(false);
      refreshingRef.current = false;
    }
  };

  useEffect(() => {
    refreshPlaces();
  }, []);

  const setActivePlaceId = (id: string) => {
    setActivePlaceIdState(id);
    localStorage.setItem('activePlaceId', id);
  };

  return (
    <RestaurantContext.Provider 
      value={{ 
        places, 
        activePlaceId, 
        setActivePlaceId, 
        isLoading, 
        refreshPlaces 
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
