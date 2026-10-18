'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircle, ArrowLeft, Car, CheckCircle2, Gamepad2, Loader2, MapPin, PawPrint, Scissors, Search,
  ShoppingBag, Stethoscope, Store, UtensilsCrossed, Wrench, type LucideIcon,
} from 'lucide-react';
import { businessApi, type BusinessTypesResponse } from '../lib/api-client';
import { Badge, Button, EmptyState, Skeleton, cn } from './ui';

interface OnboardingResult {
  id?: string;
  name: string;
  address: string;
  googlePlaceId: string;
  source: 'wuarike' | 'google' | 'manual';
  isClaimed?: boolean;
}

type Vertical = BusinessTypesResponse['verticals'][number];

// Keys mirror backend VERTICALS (huarique_backend/src/modules/places/business-types.ts); unknown keys fall back to Store.
const VERTICAL_ICONS: Record<string, LucideIcon> = {
  gastronomia: UtensilsCrossed,
  comercio: ShoppingBag,
  belleza: Scissors,
  salud: Stethoscope,
  mascotas: PawPrint,
  automotriz: Car,
  servicios: Wrench,
  entretenimiento: Gamepad2,
};

const tileClass = cn(
  'flex min-h-11 items-center gap-3 rounded-card border border-border bg-surface p-4 text-left shadow-card',
  'transition-colors duration-200 motion-reduce:transition-none hover:border-primary',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
);

export default function OnboardingSearch({ onComplete }: { onComplete: () => void }) {
  const [verticals, setVerticals] = useState<Vertical[] | null>(null);
  const [typesError, setTypesError] = useState(false);
  const [vertical, setVertical] = useState<Vertical | null>(null);
  const [businessType, setBusinessType] = useState<{ key: string; label: string } | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ wuarike: OnboardingResult[], google: OnboardingResult[] }>({ wuarike: [], google: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadTypes = useCallback(() => {
    setTypesError(false);
    businessApi.getBusinessTypes()
      .then((res) => setVerticals(res.verticals ?? []))
      .catch(() => setTypesError(true));
  }, []);

  useEffect(loadTypes, [loadTypes]);

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
    if (!businessType) return; // sin tipo no se puede reclamar, importar ni crear
    setIsLoading(true);
    setStatus(null);
    try {
      let placeId: string | undefined;

      if (item.source === 'wuarike') {
        const res = await businessApi.claimPlace(item.id!, businessType.key);
        placeId = res.placeId || item.id;
      } else if (item.source === 'google') {
        const res = await businessApi.importPlace(item.googlePlaceId, businessType.key);
        placeId = res.placeId;
      } else {
        const res = await businessApi.createPlace({ name: item.name, address: item.address, businessType: businessType.key });
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

  // Paso 1: rubro
  if (!vertical) {
    if (typesError) {
      return (
        <EmptyState
          icon={AlertCircle}
          title="No pudimos cargar los tipos de negocio"
          description="Revisa tu conexión e intenta de nuevo."
          action={<Button variant="secondary" onClick={loadTypes}>Reintentar</Button>}
        />
      );
    }
    return (
      <section className="space-y-4 text-left">
        <h2 className="text-base font-semibold text-text">¿Qué tipo de negocio tienes?</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {verticals === null
            ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-24 rounded-card" />)
            : verticals.map((v) => {
                const Icon = VERTICAL_ICONS[v.key] ?? Store;
                return (
                  <button key={v.key} type="button" onClick={() => setVertical(v)} className={cn(tileClass, 'flex-col justify-center text-center')}>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Icon size={20} aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-text">{v.label}</span>
                  </button>
                );
              })}
        </div>
      </section>
    );
  }

  // Paso 2: tipo dentro del rubro
  if (!businessType) {
    return (
      <section className="space-y-4 text-left">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setVertical(null)}>Rubros</Button>
          <h2 className="text-base font-semibold text-text">{vertical.label}: elige el tipo</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {vertical.types.map((t) => (
            <button key={t.key} type="button" onClick={() => setBusinessType(t)} className={tileClass}>
              <span className="text-sm font-medium text-text">{t.label}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  // Paso 3: buscar y reclamar / importar / crear
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-text-muted">
          Tipo de negocio: <Badge tone="primary">{vertical.label} · {businessType.label}</Badge>
        </p>
        <Button variant="ghost" size="sm" onClick={() => { setBusinessType(null); setStatus(null); }} disabled={isLoading}>
          Cambiar
        </Button>
      </div>

      <div className="relative">
        <Search size={20} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca el nombre de tu local..."
          aria-label="Nombre de tu local"
          className="h-12 w-full rounded-control border border-border bg-surface pl-10 pr-10 text-base text-text placeholder:text-text-muted focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        {isLoading && (
          <Loader2 size={20} aria-hidden className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary motion-reduce:animate-none" />
        )}
      </div>

      {status && (
        <p
          role={status.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-center justify-center gap-2 rounded-control p-3 text-sm font-medium',
            status.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
          )}
        >
          {status.type === 'success' ? <CheckCircle2 size={16} aria-hidden /> : <AlertCircle size={16} aria-hidden />}
          {status.message}
        </p>
      )}

      <div className="space-y-6">
        {results.wuarike.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">Encontrados en Wuarike</h3>
            {results.wuarike.map((item) => (
              <ResultItem key={`wu-${item.id}`} item={item} onAction={handleAction} disabled={isLoading} />
            ))}
          </div>
        )}

        {results.google.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">Disponibles en Google Maps</h3>
            {results.google.map((item) => (
              <ResultItem key={`gm-${item.googlePlaceId}`} item={item} onAction={handleAction} disabled={isLoading} />
            ))}
          </div>
        )}

        {query.length >= 3 && !isLoading && results.wuarike.length === 0 && results.google.length === 0 && !status && (
          <div className="rounded-card border border-dashed border-border bg-surface">
            <EmptyState
              icon={Store}
              headingLevel="h3"
              title="¿Tu local es nuevo?"
              description="No lo encontramos en Wuarike ni en Google Maps."
              action={
                <Button onClick={() => handleAction({ name: query, address: '', googlePlaceId: '', source: 'manual' })}>
                  Registrar &ldquo;{query}&rdquo;
                </Button>
              }
            />
          </div>
        )}

        {query.length >= 3 && !isLoading && !status && (results.wuarike.length > 0 || results.google.length > 0) && (
          <p className="text-center text-sm text-text-muted">
            ¿No es ninguno de estos?{' '}
            <button
              type="button"
              onClick={() => handleAction({ name: query, address: '', googlePlaceId: '', source: 'manual' })}
              className="min-h-11 font-medium text-primary underline hover:text-primary-hover"
            >
              Regístralo manualmente
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function ResultItem({ item, onAction, disabled }: { item: OnboardingResult, onAction: (i: OnboardingResult) => void, disabled?: boolean }) {
  const isWuarike = item.source === 'wuarike';
  const Icon = isWuarike ? Store : MapPin;

  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-text">{item.name}</h4>
          <p className="truncate text-xs text-text-muted">{item.address}</p>
        </div>
      </div>

      {item.isClaimed ? (
        <Badge>Ya reclamado</Badge>
      ) : (
        <Button size="sm" onClick={() => onAction(item)} disabled={disabled}>
          {isWuarike ? 'Reclamar' : 'Importar'}
        </Button>
      )}
    </div>
  );
}
