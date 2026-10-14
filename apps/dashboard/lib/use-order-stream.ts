'use client';

import { useEffect, useRef } from 'react';
import { API_BASE_URL } from './api-client';

export type OrderStreamEvent = { type: string; orderId?: string; tabId?: string; tableId?: string; status?: string };

// EventSource reconecta solo; al reconectar avisamos para que la pantalla vuelva a pedir el estado completo
// (los eventos emitidos mientras estuvo caída no se reenvían).
export function useOrderStream(url: string | null, onEvent: (event: OrderStreamEvent) => void) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!url) return;
    const source = new EventSource(url);
    let opened = false;
    source.onopen = () => {
      if (opened) handler.current({ type: 'reconnected' });
      opened = true;
    };
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as OrderStreamEvent;
        if (event.type !== 'ping') handler.current(event);
      } catch { /* mensaje inválido: se ignora */ }
    };
    return () => source.close();
  }, [url]);
}


export function staffStreamUrl(placeId: string | null): string | null {
  if (!placeId || typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  return token ? `${API_BASE_URL}/api/business/places/${placeId}/orders/stream?token=${encodeURIComponent(token)}` : null;
}

export function publicStreamUrl(token: string | null): string | null {
  return token ? `${API_BASE_URL}/api/public/stream/${token}` : null;
}
