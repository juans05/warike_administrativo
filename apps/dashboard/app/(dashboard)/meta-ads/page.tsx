'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { metaAdsApi } from '../../../lib/api-client';
import { SkeletonHeader, SkeletonCard } from '../../../components/SkeletonLoader';

export default function MetaAdsPage() {
  const { activePlaceId } = useRestaurant();
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
      alert('Por favor ingresa un Access Token válido primero.');
      return;
    }
    setIsLoadingAccounts(true);
    try {
      const accounts = await metaAdsApi.getAdAccounts(accessToken);
      setAdAccountsList(accounts);
      if (accounts.length > 0) {
        setAdAccountId(accounts[0].id);
      } else {
        alert('No se encontraron cuentas publicitarias vinculadas a este token.');
      }
    } catch (err: any) {
      alert(err.message || 'Error al cargar las cuentas publicitarias.');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleConnect = async () => {
    if (!accessToken.trim() || !adAccountId.trim()) {
      alert('Completa el Access Token y selecciona una cuenta publicitaria.');
      return;
    }
    setIsConnecting(true);
    try {
      await metaAdsApi.connect(activePlaceId, {
        accessToken: accessToken.trim(),
        adAccountId: adAccountId.trim(),
      });
      alert('¡Cuenta publicitaria de Facebook conectada exitosamente!');
      await fetchStatus();
    } catch (err: any) {
      alert(err.message || 'Error al conectar.');
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
      alert('Integración desconectada.');
      await fetchStatus();
    } catch (err: any) {
      alert(err.message || 'Error al desconectar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await metaAdsApi.syncAudience(activePlaceId);
      alert(res.message || 'Sincronización exitosa.');
      await fetchStatus();
    } catch (err: any) {
      alert(err.message || 'Error al sincronizar.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-10 pb-32">
        <SkeletonHeader />
        <SkeletonCard className="h-80" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">👥</div>
          <div>
            <h1 className="text-4xl font-black text-text tracking-tight font-warike">Meta Ads Retargeting</h1>
            <p className="text-text-muted font-bold text-sm">Sincroniza tus clientes NFC de forma encriptada para campañas en Facebook e Instagram.</p>
          </div>
        </div>
      </header>

      {/* Explicativo Premium de Valor */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="text-4xl">🚀</div>
        <div className="space-y-1 flex-1">
          <h3 className="font-black text-blue-900 text-sm uppercase tracking-wider">¿Cómo funciona esta súper integración?</h3>
          <p className="text-xs text-blue-800 leading-relaxed font-semibold">
            Cada vez que un comensal escanea un Tag NFC en tu mesa y da su consentimiento, guardamos su contacto.
            Esta integración toma esos correos/teléfonos, los **encripta en códigos hashes SHA-256 privados** (cumpliendo con la ley) y los envía a tu cuenta publicitaria de Facebook.
            ¡Podrás mostrar anuncios en Instagram/Facebook únicamente a quienes ya consumieron en tu local físico!
          </p>
        </div>
      </div>

      {status?.connected ? (
        /* VISTA: CONECTADO Y CONFIGURADO */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-text text-lg">Estado de Conexión</h3>
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                  🟢 Conectado
                </span>
              </div>

              <div className="divide-y divide-gray-50 text-sm">
                <div className="py-4 flex justify-between">
                  <span className="font-bold text-text-muted">Cuenta Publicitaria:</span>
                  <span className="font-black text-text font-mono">{status.adAccountId}</span>
                </div>
                <div className="py-4 flex justify-between">
                  <span className="font-bold text-text-muted">ID de Audiencia en Meta:</span>
                  <span className="font-black text-text font-mono">{status.customAudienceId || 'Pendiente de creación'}</span>
                </div>
                <div className="py-4 flex justify-between">
                  <span className="font-bold text-text-muted">Última Sincronización:</span>
                  <span className="font-black text-text">
                    {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString('es-PE') : 'Nunca sincronizado'}
                  </span>
                </div>
                <div className="py-4 flex justify-between">
                  <span className="font-bold text-text-muted">Clientes Sincronizados:</span>
                  <span className="font-black text-primary text-base">{status.syncCount} clientes</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="bg-primary text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sincronizando...
                    </>
                  ) : (
                    '🔄 Sincronizar Ahora'
                  )}
                </button>

                <button
                  onClick={handleDisconnect}
                  className="border-2 border-red-200 text-red-600 bg-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-300 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  🚪 Desconectar Meta Ads
                </button>
              </div>
            </div>
          </div>

          {/* TARJETA COLATERAL: CRON JOB AUTOMÁTICO */}
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-4xl">⏰</div>
              <h3 className="font-black text-text text-lg leading-tight">Sincronización Automática</h3>
              <p className="text-xs text-text-muted font-bold leading-relaxed">
                ¡No tienes que preocuparte! El sistema realiza de forma automática un barrido y sincronización encriptada SHA-256 todos los días a las **2:00 AM**.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">
              Próxima: Mañana 2:00 AM
            </div>
          </div>
        </div>
      ) : (
        /* VISTA: CONFIGURAR VINCULACIÓN */
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
          <div className="space-y-2">
            <h3 className="font-black text-text text-lg">Configurar Integración con Meta</h3>
            <p className="text-xs text-text-muted font-bold">Sigue los pasos a continuación para conectar tu cuenta publicitaria.</p>
          </div>

          <div className="space-y-6">
            {/* Paso 1: Access Token */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                Paso 1: Pegar Access Token de Facebook Business
              </label>
              <textarea
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Escribe el Token de Acceso del Sistema de Meta Developer..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:ring-primary/20"
              />
              <p className="text-[10px] text-text-muted leading-relaxed font-bold">
                💡 Consigue tu System User Access Token en tu <strong>Business Manager de Meta (Configuración del Negocio &gt; Usuarios del Sistema)</strong> con permisos en tu cuenta de anuncios.
              </p>
            </div>

            {/* Cargar Cuentas */}
            {adAccountsList.length === 0 && (
              <button
                onClick={handleLoadAccounts}
                disabled={isLoadingAccounts || !accessToken}
                className="bg-slate-900 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-40 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isLoadingAccounts ? 'Cargando cuentas...' : '🔌 Cargar Cuentas Publicitarias'}
              </button>
            )}

            {/* Paso 2: Selección de cuenta publicitaria */}
            {adAccountsList.length > 0 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    Paso 2: Selecciona la Cuenta Publicitaria de Facebook
                  </label>
                  <select
                    value={adAccountId}
                    onChange={(e) => setAdAccountId(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-primary"
                  >
                    {adAccountsList.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — ({acc.account_id})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-md"
                >
                  {isConnecting ? 'Vinculando...' : '🎯 Guardar y Sincronizar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
