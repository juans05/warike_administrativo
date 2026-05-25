'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { businessApi } from '../lib/api-client';

interface OnboardingResult {
  id?: string;
  name: string;
  address: string;
  googlePlaceId: string;
  source: 'wuarike' | 'google' | 'manual';
  isClaimed?: boolean;
}

export default function OnboardingSearch({ onComplete }: { onComplete: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ wuarike: OnboardingResult[], google: OnboardingResult[] }>({ wuarike: [], google: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setStatus(null);
    try {
      const data = await businessApi.searchOnboarding(searchQuery);
      if (!controller.signal.aborted) {
        setResults(data);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      setStatus({ type: 'error', message: 'Error al buscar. Intenta de nuevo.' });
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (query.length >= 3) {
      const timer = setTimeout(() => handleSearch(query), 500);
      return () => clearTimeout(timer);
    }
    setResults({ wuarike: [], google: [] });
    setStatus(null);
  }, [query, handleSearch]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleAction = async (item: OnboardingResult) => {
    setIsLoading(true);
    setStatus(null);
    try {
      let placeId: string | undefined;

      if (item.source === 'wuarike') {
        const res = await businessApi.claimPlace(item.id!);
        placeId = res.placeId || item.id;
      } else if (item.source === 'google') {
        const res = await businessApi.importPlace(item.googlePlaceId);
        placeId = res.placeId;
      } else {
        const res = await businessApi.createPlace({ name: item.name, address: item.address });
        placeId = res.placeId;
      }

      if (placeId) {
        localStorage.setItem('activePlaceId', placeId);
      }

      setStatus({ type: 'success', message: '¡Local asignado con éxito!' });
      setTimeout(() => onComplete(), 1500);
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Error al procesar la solicitud' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative">
        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca el nombre de tu local..."
          className="w-full bg-white border-2 border-[var(--border)] rounded-[2.5rem] py-6 pl-16 pr-8 text-lg font-bold focus:border-[var(--primary)] outline-none shadow-xl shadow-black/5 transition-all"
        />
        {isLoading && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {status && (
        <div className={`p-6 rounded-3xl font-black text-center text-sm uppercase tracking-widest ${
          status.type === 'success' ? 'bg-green-50 text-green-600 border-2 border-green-100' : 'bg-red-50 text-red-600 border-2 border-red-100'
        }`}>
          {status.type === 'success' ? '✨' : '⚠️'} {status.message}
        </div>
      )}

      <div className="space-y-6">
        {results.wuarike.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] ml-4">Encontrados en Wuarike</h3>
            {results.wuarike.map((item) => (
              <ResultItem key={`wu-${item.id}`} item={item} onAction={handleAction} disabled={isLoading} />
            ))}
          </div>
        )}

        {results.google.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] ml-4">Disponibles en Google Maps</h3>
            {results.google.map((item) => (
              <ResultItem key={`gm-${item.googlePlaceId}`} item={item} onAction={handleAction} disabled={isLoading} />
            ))}
          </div>
        )}

        {query.length >= 3 && !isLoading && results.wuarike.length === 0 && results.google.length === 0 && !status && (
          <div className="text-center py-12 bg-white rounded-[3rem] border-2 border-dashed border-[var(--border)] space-y-6">
             <span className="text-5xl block">🍳</span>
             <div className="space-y-2">
               <p className="text-[var(--text)] font-black uppercase tracking-widest text-sm font-warike">¿Tu local es nuevo?</p>
               <p className="text-[var(--text-muted)] font-bold text-xs">No lo encontramos en Wuarike ni en Google Maps.</p>
             </div>
             <button
              onClick={() => handleAction({ name: query, address: '', googlePlaceId: '', source: 'manual' })}
              className="bg-[var(--primary)] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:scale-105 transition-all"
             >
                Registrar &ldquo;{query}&rdquo; Manualmente
             </button>
          </div>
        )}

        {query.length >= 3 && !isLoading && !status && (results.wuarike.length > 0 || results.google.length > 0) && (
          <p className="text-center text-[10px] font-bold text-[var(--text-muted)] pt-4">
            ¿No es ninguno de estos? <button onClick={() => handleAction({ name: query, address: '', googlePlaceId: '', source: 'manual' })} className="text-[var(--primary)] font-black underline ml-1 uppercase">Regístralo manualmente</button>
          </p>
        )}
      </div>
    </div>
  );
}

function ResultItem({ item, onAction, disabled }: { item: OnboardingResult, onAction: (i: OnboardingResult) => void, disabled?: boolean }) {
  const isWuarike = item.source === 'wuarike';

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-[var(--border)] shadow-sm flex items-center justify-between group hover:shadow-xl hover:border-[var(--primary)] transition-all">
      <div className="flex items-center gap-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${isWuarike ? 'bg-orange-50' : 'bg-blue-50'}`}>
          {isWuarike ? '🍽️' : '📍'}
        </div>
        <div className="max-w-[250px] md:max-w-md">
          <h4 className="font-black text-[var(--text)] text-lg leading-tight uppercase font-warike">{item.name}</h4>
          <p className="text-[11px] text-[var(--text-muted)] font-bold mt-1 line-clamp-1">{item.address}</p>
        </div>
      </div>

      {item.isClaimed ? (
        <span className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Ya Reclamado</span>
      ) : (
        <button
          onClick={() => onAction(item)}
          disabled={disabled}
          className="bg-[var(--text)] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--primary)] transition-all shadow-lg shadow-black/10 active:scale-95"
        >
          {isWuarike ? 'Reclamar' : 'Importar'}
        </button>
      )}
    </div>
  );
}
