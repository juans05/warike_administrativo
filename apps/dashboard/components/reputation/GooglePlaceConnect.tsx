'use client';

import { useState } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../../lib/api-client';
import { Badge, Button, Input } from '../ui';
import { GoogleIcon } from './GoogleIcon';

/**
 * Conecta el local con su ficha de Google por Place ID (Places API): buscar, guardar y sincronizar.
 * El Place ID y el estado de conexión viven en la página, para que se vean iguales en cualquier pestaña.
 */
export function GooglePlaceConnect({ placeId, googlePlaceId, onChangeGooglePlaceId, isConnected, onSynced }: {
  placeId: string | null;
  googlePlaceId: string;
  onChangeGooglePlaceId(value: string): void;
  isConnected: boolean;
  onSynced(result: any): void;
}) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const search = async () => {
    if (!placeId) return;
    setIsSearching(true);
    setCandidates([]);
    try {
      const res = await businessApi.findGooglePlaceId(placeId);
      setCandidates(res.candidates || []);
      if (!res.candidates?.length) toast.warning('No se encontraron resultados. Intenta ingresar el ID manualmente.');
    } catch { toast.error('Error al buscar en Google'); }
    finally { setIsSearching(false); }
  };

  const save = async () => {
    if (!placeId) return;
    setIsSaving(true);
    try {
      await businessApi.updateProfile(placeId, { googlePlaceId });
      setCandidates([]);
      toast.success('ID de Google guardado. Ahora puedes sincronizar las reseñas.');
    } catch (e) { toast.error('Error al guardar'); }
    setIsSaving(false);
  };

  const sync = async () => {
    if (!placeId || !googlePlaceId) {
      toast.warning('Primero guarda tu Google Place ID.');
      return;
    }
    setIsSyncing(true);
    try {
      const result = await businessApi.syncGoogleReviews(placeId);
      if (result?.rating || result?.totalReviews) {
        onSynced(result);
        toast.success(`¡Sincronizado! Calificación: ${result.rating} · ${result.totalReviews} reseñas`);
      } else {
        toast.warning('Sincronizado, pero no se encontraron reseñas. Verifica que el Place ID sea correcto.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al sincronizar. Verifica que el Place ID sea correcto.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Input
              label="Google Place ID"
              value={googlePlaceId}
              onChange={(e) => { onChangeGooglePlaceId(e.target.value); setCandidates([]); }}
              placeholder="Ej: ChIJs_-... (ID de tu negocio)"
            />
          </div>
          <Button loading={isSaving} onClick={save}>Guardar</Button>
        </div>
        <Button variant="ghost" size="sm" icon={Search} loading={isSearching} onClick={search}>
          {isSearching ? 'Buscando...' : 'Buscar mi negocio automáticamente'}
        </Button>
      </div>

      {candidates.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border">
          {candidates.map((c: any) => (
            <li key={c.googlePlaceId}>
              <button
                type="button"
                onClick={() => { onChangeGooglePlaceId(c.googlePlaceId); setCandidates([]); }}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                <p className="text-sm font-medium text-text">{c.name}</p>
                <p className="text-xs text-text-muted">{c.address}</p>
                <p className="mt-0.5 text-xs text-primary-hover">{c.googlePlaceId}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isConnected && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-text">
          <Badge tone="success"><CheckCircle2 size={16} aria-hidden />Google conectado</Badge>
          Tus reseñas se importan automáticamente.
        </p>
      )}

      <Button variant="secondary" loading={isSyncing} onClick={sync}>
        {!isSyncing && <GoogleIcon />}
        {isSyncing ? (isConnected ? 'Sincronizando...' : 'Conectando...') : isConnected ? 'Sincronizar reseñas de Google' : 'Conectar con Google'}
      </Button>
    </div>
  );
}
