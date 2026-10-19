'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { metaAdsApi } from '../../../lib/api-client';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Info, Plug, RefreshCw, Target, Unplug } from 'lucide-react';
import { Badge, Button, Card, PageHeader, Select, Skeleton, Textarea } from '../../../components/ui';
import { plural } from '../../../lib/modules';
import { redirect } from 'next/navigation';
import { META_ADS_ENABLED } from '../../../lib/features';

export default function Page() {
  if (!META_ADS_ENABLED) redirect('/inicio');
  return <MetaAdsPage />;
}

function MetaAdsPage() {
  const { activePlaceId, activePlace } = useRestaurant();
  const customer = activePlace?.verticalConfig?.labels.customer ?? 'Cliente';
  const customerLower = customer.toLowerCase();
  const customersLower = plural(customer).toLowerCase();
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Form states
  const [accessToken, setAccessToken] = useState('');
  const [adAccountId, setAdAccountId] = useState('');
  const [adAccountsList, setAdAccountsList] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  useEffect(() => {
    if (!activePlaceId) {
      setIsLoading(false);
      return;
    }
    fetchStatus();
  }, [activePlaceId]);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await metaAdsApi.getStatus(activePlaceId);
      setStatus(res);
      if (res.connected) {
        setAdAccountId(res.adAccountId || '');
      }
    } catch (err) {
      console.error('Error fetching connection status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadAccounts = async () => {
    if (!accessToken.trim()) {
      toast.warning('Por favor ingresa un Access Token válido primero.');
      return;
    }
    setIsLoadingAccounts(true);
    try {
      const accounts = await metaAdsApi.getAdAccounts(accessToken);
      setAdAccountsList(accounts);
      if (accounts.length > 0) {
        setAdAccountId(accounts[0].id);
      } else {
        toast.warning('No se encontraron cuentas publicitarias vinculadas a este token.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar las cuentas publicitarias.');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleConnect = async () => {
    if (!accessToken.trim() || !adAccountId.trim()) {
      toast.warning('Completa el Access Token y selecciona una cuenta publicitaria.');
      return;
    }
    setIsConnecting(true);
    try {
      await metaAdsApi.connect(activePlaceId, {
        accessToken: accessToken.trim(),
        adAccountId: adAccountId.trim(),
      });
      toast.success('¡Cuenta publicitaria de Facebook conectada exitosamente!');
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.message || 'Error al conectar.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que deseas desconectar la integración de Meta Ads? Se detendrá la sincronización diaria.')) return;
    setIsLoading(true);
    try {
      await metaAdsApi.disconnect(activePlaceId);
      setStatus(null);
      setAccessToken('');
      setAdAccountId('');
      setAdAccountsList([]);
      toast.success('Integración desconectada.');
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.message || 'Error al desconectar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await metaAdsApi.syncAudience(activePlaceId);
      toast.success(res.message || 'Sincronización exitosa.');
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.message || 'Error al sincronizar.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6" role="status" aria-label="Cargando">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-80 rounded-card" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 pb-32">
      <PageHeader
        title="Meta Ads"
        subtitle={`Sincroniza tus ${customersLower} de forma encriptada para campañas en Facebook e Instagram.`}
      />

      <Card padding="lg" className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Info size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text">¿Cómo funciona?</h2>
          <p className="mt-1 text-sm text-text-muted">
            Cada vez que un {customerLower} escanea un tag NFC en tu local y da su consentimiento, guardamos su contacto.
            Esta integración toma esos correos y teléfonos, los <strong className="font-medium text-text">encripta con códigos hash SHA-256 privados</strong> (cumpliendo con la ley)
            y los envía a tu cuenta publicitaria de Facebook. Así podrás mostrar anuncios en Instagram y Facebook únicamente a quienes ya visitaron tu local.
          </p>
        </div>
      </Card>

      {status?.connected ? (
        /* VISTA: CONECTADO Y CONFIGURADO */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card padding="lg" className="space-y-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-text">Estado de la conexión</h2>
              <Badge tone="success"><CheckCircle2 size={16} aria-hidden /> Conectado</Badge>
            </div>

            <dl className="divide-y divide-border text-sm">
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3">
                <dt className="text-text-muted">Cuenta publicitaria</dt>
                <dd className="break-all font-mono text-text">{status.adAccountId}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3">
                <dt className="text-text-muted">ID de audiencia en Meta</dt>
                <dd className="break-all font-mono text-text">{status.customAudienceId || 'Pendiente de creación'}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3">
                <dt className="text-text-muted">Última sincronización</dt>
                <dd className="text-text">
                  {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString('es-PE') : 'Nunca sincronizado'}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3">
                <dt className="text-text-muted">{plural(customer)} sincronizados</dt>
                <dd className="font-semibold tabular-nums text-text">{status.syncCount} {customersLower}</dd>
              </div>
            </dl>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button icon={RefreshCw} onClick={handleSyncNow} loading={isSyncing} className="flex-1">
                {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </Button>
              <Button variant="secondary" icon={Unplug} onClick={handleDisconnect} className="flex-1">
                Desconectar Meta Ads
              </Button>
            </div>
          </Card>

          {/* TARJETA COLATERAL: CRON JOB AUTOMÁTICO */}
          <Card padding="lg" className="flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Clock size={20} aria-hidden />
              </span>
              <h2 className="text-base font-semibold text-text">Sincronización automática</h2>
              <p className="text-sm text-text-muted">
                No tienes que preocuparte: el sistema sincroniza tus contactos de forma encriptada (SHA-256) todos los días a las <strong className="font-medium text-text">2:00 AM</strong>.
              </p>
            </div>
            <p className="rounded-control bg-background px-3 py-2 text-center text-sm text-text-muted">
              Próxima: mañana 2:00 AM
            </p>
          </Card>
        </div>
      ) : (
        /* VISTA: CONFIGURAR VINCULACIÓN */
        <Card padding="lg" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-text">Configura la integración con Meta</h2>
            <p className="mt-1 text-sm text-text-muted">Sigue los pasos para conectar tu cuenta publicitaria.</p>
          </div>

          {/* Paso 1: Access Token */}
          <Textarea
            label="Paso 1: Pega el Access Token de Facebook Business"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Escribe el token de acceso del sistema de Meta Developer..."
            hint="Consigue tu System User Access Token en tu Business Manager de Meta (Configuración del negocio > Usuarios del sistema), con permisos en tu cuenta de anuncios."
            rows={3}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />

          {/* Cargar Cuentas */}
          {adAccountsList.length === 0 && (
            <Button
              variant="secondary"
              icon={Plug}
              onClick={handleLoadAccounts}
              loading={isLoadingAccounts}
              disabled={!accessToken}
            >
              {isLoadingAccounts ? 'Cargando cuentas...' : 'Cargar cuentas publicitarias'}
            </Button>
          )}

          {/* Paso 2: Selección de cuenta publicitaria */}
          {adAccountsList.length > 0 && (
            <div className="space-y-4">
              <Select
                label="Paso 2: Selecciona la cuenta publicitaria de Facebook"
                value={adAccountId}
                onChange={(e) => setAdAccountId(e.target.value)}
              >
                {adAccountsList.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — ({acc.account_id})
                  </option>
                ))}
              </Select>

              <Button className="w-full" icon={Target} onClick={handleConnect} loading={isConnecting}>
                {isConnecting ? 'Vinculando...' : 'Guardar y sincronizar'}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
