'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/api-client';

interface OnboardingResult {
  id?: string;
  name: string;
  address: string;
  googlePlaceId: string;
  source: 'wuarike' | 'google';
  isClaimed?: boolean;
}

export default function OnboardingSearch({ onComplete }: { onComplete: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ wuarike: OnboardingResult[], google: OnboardingResult[] }>({ wuarike: [], google: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 3) {
        handleSearch();
      } else {
        setResults({ wuarike: [], google: [] });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithAuth(`/business/onboarding/search?q=${encodeURIComponent(query)}`);
      setResults(data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (item: OnboardingResult) => {
    setIsLoading(true);
    setStatus(null);
    try {
      let endpoint = '';
      let body = {};

      if (item.source === 'wuarike') {
        endpoint = `/business/onboarding/claim/${item.id}`;
      } else {
        endpoint = `/business/onboarding/import`;
        body = { googlePlaceId: item.googlePlaceId };
      }

      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: item.source === 'google' ? JSON.stringify(body) : undefined
      });

      setStatus({ type: 'success', message: '¡Local asignado con éxito! Reiniciando...' });
      setTimeout(() => {
        onComplete();
        window.location.reload(); // Refresh to update context and show dashboard
      }, 2000);
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
          placeholder="Busca el nombre de tu restaurante..."
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
        {/* Wuarike Results */}
        {results.wuarike.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] ml-4">Encontrados en Wuarike</h3>
            {results.wuarike.map((item) => (
              <ResultItem key={item.id} item={item} onAction={handleAction} disabled={isLoading} />
            ))}
          </div>
        )}

        {/* Google Results */}
        {results.google.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] ml-4">Disponibles en Google Maps</h3>
            {results.google.map((item) => (
              <ResultItem key={item.googlePlaceId} item={item} onAction={handleAction} disabled={isLoading} />
            ))}
          </div>
        )}

        {query.length >= 3 && !isLoading && results.wuarike.length === 0 && results.google.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
             <span className="text-4xl block mb-4">🤷‍♂️</span>
             <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">No lo encontramos. Prueba con otro nombre.</p>
          </div>
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
