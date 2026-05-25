'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

function getInitialActivePlaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('activePlaceId');
}

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [activePlaceId, setActivePlaceIdState] = useState<string | null>(getInitialActivePlaceId);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPlaces = async () => {
    try {
      const data = await businessApi.getMyPlaces();
      setPlaces(data);

      const stored = localStorage.getItem('activePlaceId');
      if (stored && data.find((p: Place) => p.id === stored)) {
        setActivePlaceIdState(stored);
      } else if (data.length > 0) {
        setActivePlaceIdState(data[0].id);
        localStorage.setItem('activePlaceId', data[0].id);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setIsLoading(false);
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
