'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi, fetchWithAuth } from '../../../lib/api-client';
import GoogleReviews from '../../../components/GoogleReviews';
import { SkeletonPage } from '../../../components/SkeletonLoader';
import { toast } from 'sonner';

export default function ReputacionPage() {
  const { activePlaceId } = useRestaurant();
  const [isLoading, setIsLoading] = useState(true);

  // ── ESTADÍSTICAS CONSOLIDADAS ──
  const [stats, setStats] = useState({
    // NFC / Filtrado
    totalTaps: 0,
    nfcPercent: 0,
    qrPercent: 0,
    ratingAverage: 0,
    // Quejas
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    // Instagram
    totalAccounts: 0,
    totalComments: 0,
    aiReplied: 0,
    pendingReplies: 0,
    // Impacto
    disastersAvoided: 0,
    reviewsSentToGoogle: 0,
    conversionRate: 0,
  });

  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [placeIdCandidates, setPlaceIdCandidates] = useState<any[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);

  // Devices
  const [devices, setDevices] = useState<any[]>([]);
  const [isDeletingDevice, setIsDeletingDevice] = useState<string | null>(null);

  // Pedido de nuevos taps (genérico o personalizado)
  const [deviceRequests, setDeviceRequests] = useState<any[]>([]);
  const [isRequestingTaps, setIsRequestingTaps] = useState(false);
  const [tapType, setTapType] = useState<'generico' | 'personalizado'>('generico');
  const [tapQuantity, setTapQuantity] = useState(5);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const TAP_PRICES = { generico: 20, personalizado: 40 } as const;

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);

    // Cargar perfil para obtener googlePlaceId y estado de conexión Google
    businessApi.getProfile(activePlaceId).then(profile => {
      setGooglePlaceId(profile.googlePlaceId || '');
      setIsGoogleConnected(
        !!profile.googlePlaceId &&
        (!!profile.googleRating || (profile.googleTotalReviews > 0))
      );
    }).catch(() => { });

    // Cargar datos de todas las fuentes en paralelo
    Promise.allSettled([
      businessApi.getComplaints(activePlaceId),
      fetchWithAuth(`/business/places/${activePlaceId}/social/comments`),
      businessApi.getAnalytics(activePlaceId, 'month'),
    ]).then(([complaintsRes, commentsRes, analyticsRes]) => {
      // Quejas
      const complaints = complaintsRes.status === 'fulfilled' ? complaintsRes.value : null;
      if (complaints?.data) {
        const all = complaints.data;
        setRecentComplaints(all.slice(0, 3));
        setStats(prev => ({
          ...prev,
          totalComplaints: complaints.meta?.total || all.length,
          pendingComplaints: all.filter((c: any) => c.status === 'pending').length,
          resolvedComplaints: all.filter((c: any) => c.status === 'resolved').length,
          disastersAvoided: complaints.meta?.total || all.length,
        }));
      }

      // Social Comments
      const comments = commentsRes.status === 'fulfilled' ? commentsRes.value : null;
      if (comments?.data) {
        const replied = comments.data.filter((c: any) => c.isReplied).length;
        setStats(prev => ({
          ...prev,
          totalComments: comments.meta?.total || 0,
          aiReplied: replied,
          pendingReplies: (comments.meta?.total || 0) - replied,
        }));
      }

      // Analytics
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null;
      if (analytics) {
        setStats(prev => ({
          ...prev,
          totalTaps: analytics.scans?.total || 0,
          nfcPercent: analytics.scans?.nfcPercent || 0,
          qrPercent: analytics.scans?.qrPercent || 0,
          reviewsSentToGoogle: analytics.feedback?.positive || 0,
          conversionRate: analytics.feedback?.conversionRate ?? 0,
          pendingComplaints: analytics.complaints?.pending ?? prev.pendingComplaints,
          resolvedComplaints: analytics.complaints?.resolved ?? prev.resolvedComplaints,
        }));
      }

      // Overwrite rating average and total reviews with real Google data if profile loaded
      businessApi.getProfile(activePlaceId).then(profile => {
        setStats(prev => ({
          ...prev,
          ratingAverage: profile.googleRating ? parseFloat(profile.googleRating) : prev.ratingAverage,
          reviewsSentToGoogle: profile.googleTotalReviews || prev.reviewsSentToGoogle
        }));
      }).catch(() => { });
    }).catch(() => {
      // Datos demo si backend no disponible
      setStats({
        totalTaps: 1240, nfcPercent: 65, qrPercent: 35, ratingAverage: 4.8,
        totalComplaints: 12, pendingComplaints: 3, resolvedComplaints: 9,
        totalAccounts: 2, totalComments: 47, aiReplied: 38, pendingReplies: 9,
        disastersAvoided: 12, reviewsSentToGoogle: 85, conversionRate: 7,
      });
      setRecentComplaints([
        { id: '1', rating: 2, comment: 'Esperamos mucho tiempo', customerName: 'María', status: 'pending', createdAt: new Date().toISOString() },
        { id: '2', rating: 1, comment: 'Comida fría', customerName: 'Carlos', status: 'resolved', createdAt: new Date().toISOString() },
      ]);
      setSocialAccounts([
        { id: '1', username: '@mi_huarique', platform: 'instagram' },
        { id: '2', username: '@huarique_sede2', platform: 'instagram' },
      ]);
    }).finally(() => setIsLoading(false));
  }, [activePlaceId]);

  // Cargar dispositivos y solicitudes de taps
  useEffect(() => {
    if (!activePlaceId) return;
    businessApi.getDevices(activePlaceId)
      .then(setDevices)
      .catch(() => setDevices([]));
    businessApi.getDeviceRequests(activePlaceId)
      .then(setDeviceRequests)
      .catch(() => setDeviceRequests([]));
  }, [activePlaceId]);

  // Manejar pedido de nuevos taps
  const handleRequestTaps = async () => {
    if (!activePlaceId || tapQuantity < 5) return;
    setIsSubmittingRequest(true);
    try {
      await businessApi.createDeviceRequest(activePlaceId, { tapType, quantity: tapQuantity });
      setIsRequestingTaps(false);
      setTapType('generico');
      setTapQuantity(5);
      const updated = await businessApi.getDeviceRequests(activePlaceId);
      setDeviceRequests(updated);
      toast.success('Pedido enviado. El equipo Wuarike lo revisará pronto.');
    } catch (err) {
      toast.error('Error al enviar el pedido');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Manejar cambio de acción
  const handleActionChange = async (deviceId: string, newAction: string) => {
    if (!activePlaceId) return;
    try {
      await businessApi.updateDevice(activePlaceId, deviceId, { action: newAction });
      const updated = await businessApi.getDevices(activePlaceId);
      setDevices(updated);
    } catch (err) {
      toast.error('Error al actualizar dispositivo');
    }
  };

  // Manejar eliminar dispositivo
  const handleDeleteDevice = async (deviceId: string) => {
    if (!activePlaceId) return;
    setIsDeletingDevice(deviceId);
    try {
      await businessApi.deleteDevice(activePlaceId, deviceId);
      const updated = await businessApi.getDevices(activePlaceId);
      setDevices(updated);
    } catch (err) {
      toast.error('Error al eliminar dispositivo');
    } finally {
      setIsDeletingDevice(null);
    }
  };

  const publicLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/l/${activePlaceId}`;

  if (isLoading) return <SkeletonPage type="stats" />;

  return (
    <div className="max-w-6xl space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-text tracking-tight font-warike">Motor de Reputación</h1>
        <p className="text-text-muted font-bold text-lg max-w-2xl leading-snug">
          Vista consolidada de cómo va tu negocio: escaneos NFC, quejas interceptadas y rendimiento en redes sociales.
        </p>
      </header>

      {/* ═══════════════════════════════════════════════ */}
      {/* FILA 1: KPIs PRINCIPALES                       */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
        <KpiCard label="Escaneos NFC" value={stats.totalTaps.toLocaleString()} icon="📱" color="bg-blue-500" />
        <KpiCard label="Rating Google" value={stats.ratingAverage.toFixed(1)} icon="⭐" color="bg-yellow-500" />
        <KpiCard label="Reseñas a Google" value={stats.reviewsSentToGoogle} icon="🚀" color="bg-green-500" />
        <KpiCard label="Quejas Interceptadas" value={stats.disastersAvoided} icon="🛡️" color="bg-red-500" />
        <KpiCard label="Comentarios IG" value={stats.totalComments} icon="💬" color="bg-purple-500" />
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* FILA 2: 2 BLOQUES DETALLADOS                   */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">

        {/* ── Bloque 1: Filtrado Inteligente ── */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-2xl shadow-lg">⚡</div>
            <div>
              <h3 className="font-black text-text font-warike">Filtrado NFC</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Escaneos y filtrado</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">NFC</span>
              <span className="text-xs font-black text-text">{stats.nfcPercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${stats.nfcPercent}%` }}></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">QR</span>
              <span className="text-xs font-black text-text">{stats.qrPercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${stats.qrPercent}%` }}></div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Tasa de conversión</p>
            <p className="text-2xl font-black text-green-700">{stats.conversionRate}%</p>
            <p className="text-[9px] font-bold text-green-400">escaneos → reseñas en Google</p>
          </div>
        </div>

        {/* ── Bloque 2: Buzón de Quejas ── */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-2xl shadow-lg">🛡️</div>
            <div>
              <h3 className="font-black text-text font-warike">Quejas Privadas</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Desastres evitados</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-red-600">{stats.pendingComplaints}</p>
              <p className="text-[9px] font-black text-red-400 uppercase">Pendientes</p>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-green-600">{stats.resolvedComplaints}</p>
              <p className="text-[9px] font-black text-green-400 uppercase">Resueltas</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Últimas quejas</p>
            {recentComplaints.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 text-center py-4">🎉 Sin quejas recientes</p>
            ) : (
              recentComplaints.map(c => (
                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border ${c.status === 'pending' ? 'border-red-100 bg-red-50/50' : 'border-green-100 bg-green-50/50'}`}>
                  <span className="text-lg">{c.rating <= 1 ? '😡' : c.rating <= 2 ? '😞' : '😐'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-text truncate">{c.comment}</p>
                    <p className="text-[9px] font-bold text-gray-400">{c.customerName || 'Anónimo'}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <a href="/feedback" className="block w-full text-center py-3 rounded-xl bg-background text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-colors border border-border">
            Ver todas las quejas →
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* FILA 3: DISPOSITIVOS + CONFIGURACIÓN             */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Device Management */}
        <section className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-border space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">⚡</div>
            <div>
              <h3 className="text-xl font-black text-text font-warike">Dispositivos Vinculados</h3>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Tus stands físicos activos</p>
            </div>
          </div>

          <div className="space-y-4">
            {devices.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <p className="font-bold text-sm">Sin dispositivos aún</p>
                <p className="text-xs">Agrega tu primer stand físico abajo</p>
              </div>
            ) : (
              devices.map(device => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onActionChange={(action) => handleActionChange(device.id, action)}
                  onDelete={() => handleDeleteDevice(device.id)}
                  isDeleting={isDeletingDevice === device.id}
                />
              ))
            )}
          </div>

          {/* QR & NFC URLs */}
          <div className="space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">📱 Tu Enlace Base</p>

            <div>
              <p className="text-[9px] font-bold text-gray-500 mb-1 uppercase">QR Genérico:</p>
              <p className="text-xs font-mono text-text break-all bg-white p-2 rounded border border-gray-200">{publicLink}</p>
              <button onClick={() => { navigator.clipboard.writeText(publicLink); toast.success('Copiado'); }} className="mt-2 px-3 py-1.5 text-[9px] bg-text text-white font-black rounded hover:bg-opacity-90 transition-all">
                Copiar QR
              </button>
            </div>

            <div>
              <p className="text-[9px] font-bold text-gray-500 mb-1 uppercase">🏷️ Para Tags NFC:</p>
              <p className="text-xs font-mono text-text break-all bg-white p-2 rounded border border-gray-200">{publicLink}?source=nfc</p>
              <button onClick={() => { navigator.clipboard.writeText(`${publicLink}?source=nfc`); toast.success('Copiado'); }} className="mt-2 px-3 py-1.5 text-[9px] bg-text text-white font-black rounded hover:bg-opacity-90 transition-all">
                Copiar NFC
              </button>
            </div>
          </div>

          {/* Pedido de nuevos taps */}
          <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            {!isRequestingTaps ? (
              <button
                onClick={() => setIsRequestingTaps(true)}
                className="w-full py-3 rounded-xl bg-text text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-colors"
              >
                + Pedir nuevos taps
              </button>
            ) : (
              <>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">🏷️ Pedir Nuevos Taps</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setTapType('generico')}
                    className={`flex-1 p-4 rounded-2xl border text-left transition-colors ${tapType === 'generico' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                  >
                    <p className="font-black text-sm text-text">Genérico</p>
                    <p className="text-[10px] text-text-muted">S/ {TAP_PRICES.generico} c/u</p>
                  </button>
                  <button
                    onClick={() => setTapType('personalizado')}
                    className={`flex-1 p-4 rounded-2xl border text-left transition-colors ${tapType === 'personalizado' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                  >
                    <p className="font-black text-sm text-text">Personalizado</p>
                    <p className="text-[10px] text-text-muted">S/ {TAP_PRICES.personalizado} c/u</p>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Cantidad (mín. 5)</label>
                  <input
                    type="number"
                    min={5}
                    value={tapQuantity}
                    onChange={(e) => setTapQuantity(Math.max(5, Number(e.target.value) || 5))}
                    className="input-premium w-24"
                  />
                </div>

                <p className="text-sm font-black text-text">
                  Total: S/ {(TAP_PRICES[tapType] * tapQuantity).toFixed(2)}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleRequestTaps}
                    disabled={isSubmittingRequest}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-opacity-90 transition-all disabled:opacity-50"
                  >
                    {isSubmittingRequest ? 'Enviando...' : 'Enviar Pedido'}
                  </button>
                  <button
                    onClick={() => setIsRequestingTaps(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-text font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {deviceRequests.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pedidos recientes</p>
                {deviceRequests.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text">{r.quantity}x {r.tapType === 'generico' ? 'Genérico' : 'Personalizado'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      r.status === 'fulfilled' ? 'bg-green-100 text-green-700' :
                      r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.status === 'fulfilled' ? 'Entregado' : r.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Logic Configuration */}
        <section className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-border space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl">⚙️</div>
            <div>
              <h3 className="text-xl font-black text-text font-warike">Filtrado Inteligente</h3>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Configura el umbral de satisfacción</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center p-6 bg-background rounded-3xl border border-border">
              <div>
                <p className="font-black text-text text-sm">Activar Filtrado</p>
                <p className="text-[10px] font-bold text-text-muted">Redirige valoraciones bajas a buzón privado</p>
              </div>
              <div className="w-14 h-8 bg-primary rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full shadow-md"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end px-2">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Google Place ID</label>
                <button
                  onClick={async () => {
                    if (!activePlaceId) return;
                    setIsSearching(true);
                    setPlaceIdCandidates([]);
                    try {
                      const res = await businessApi.findGooglePlaceId(activePlaceId);
                      setPlaceIdCandidates(res.candidates || []);
                      if (!res.candidates?.length) toast.warning('No se encontraron resultados. Intenta ingresar el ID manualmente.');
                    } catch { toast.error('Error al buscar en Google'); }
                    finally { setIsSearching(false); }
                  }}
                  disabled={isSearching}
                  className="text-[9px] font-black text-primary uppercase hover:underline disabled:opacity-50"
                >
                  {isSearching ? 'Buscando...' : '🔍 Buscar automáticamente'}
                </button>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={googlePlaceId}
                  onChange={(e) => { setGooglePlaceId(e.target.value); setPlaceIdCandidates([]); }}
                  placeholder="Ej: ChIJs_-... (ID de tu negocio)"
                  className="input-premium flex-1"
                />
                <button
                  onClick={async () => {
                    if (!activePlaceId) return;
                    setIsSaving(true);
                    try {
                      await businessApi.updateProfile(activePlaceId, { googlePlaceId });
                      setPlaceIdCandidates([]);
                      toast.success('ID de Google guardado. Ahora puedes sincronizar las reseñas.');
                    } catch (e) { toast.error('Error al guardar'); }
                    setIsSaving(false);
                  }}
                  disabled={isSaving}
                  className="bg-text text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50"
                >
                  {isSaving ? '...' : 'Guardar'}
                </button>
              </div>

              {/* Candidatos encontrados */}
              {placeIdCandidates.length > 0 && (
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {placeIdCandidates.map((c: any) => (
                    <button
                      key={c.googlePlaceId}
                      onClick={() => { setGooglePlaceId(c.googlePlaceId); setPlaceIdCandidates([]); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-black text-sm text-text">{c.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{c.address}</p>
                      <p className="text-[9px] text-primary font-black mt-0.5">{c.googlePlaceId}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] font-bold text-text-muted leading-relaxed italic">
              * El filtrado inteligente está activado por defecto. Las valoraciones de 1 a 3 estrellas no verán el enlace de Google Maps y se les invitará a dejar una sugerencia privada.
            </p>

            {/* Botón Google - sincronizar reseñas */}
            {isGoogleConnected && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0">✓</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-green-700">Google Business conectado</p>
                  <p className="text-[10px] font-bold text-green-500">Tus reseñas se importan automáticamente</p>
                </div>
              </div>
            )}
            <GoogleSyncButton
              isConnected={isGoogleConnected}
              activePlaceId={activePlaceId}
              googlePlaceId={googlePlaceId}
              onSuccess={(result) => {
                setIsGoogleConnected(true);
                setStats(prev => ({
                  ...prev,
                  ratingAverage: result.rating ? parseFloat(result.rating) : prev.ratingAverage,
                  reviewsSentToGoogle: result.totalReviews || prev.reviewsSentToGoogle,
                }));
                setReviewsRefreshKey(k => k + 1);
              }}
            />
          </div>
        </section>
      </div>

      <hr className="border-border" />

      {/* Google Reviews */}
      <GoogleReviews refreshKey={reviewsRefreshKey} />
    </div>
  );
}

// ── COMPONENTES ──────────────────────────────────────

function GoogleSyncButton({
  isConnected,
  activePlaceId,
  googlePlaceId,
  onSuccess,
}: {
  isConnected: boolean;
  activePlaceId: string | null;
  googlePlaceId: string;
  onSuccess: (result: any) => void;
}) {
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = async () => {
    if (!activePlaceId || !googlePlaceId) {
      toast.warning('Primero guarda tu Google Place ID arriba.');
      return;
    }
    setIsSyncing(true);
    try {
      const result = await businessApi.syncGoogleReviews(activePlaceId);
      if (result?.rating || result?.totalReviews) {
        onSuccess(result);
        toast.success(`¡Sincronizado! Rating: ${result.rating} ⭐ · ${result.totalReviews} reseñas`);
      } else {
        toast.warning('Sincronizado, pero no se encontraron reseñas. Verifica que el Place ID sea correcto.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al sincronizar. Verifica que el Place ID sea correcto.');
    } finally {
      setIsSyncing(false);
    }
  };

  const GoogleLogo = () => (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );

  if (isConnected) {
    return (
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] group disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSyncing ? (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <GoogleLogo />
        )}
        <span className="text-sm font-black text-[#3c4043] group-hover:text-[#1a1a1a] transition-colors">
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Reseñas de Google'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] group disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isSyncing ? (
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <GoogleLogo />
      )}
      <span className="text-sm font-black text-[#3c4043] group-hover:text-[#1a1a1a] transition-colors">
        {isSyncing ? 'Conectando...' : 'Conectar con Google Business'}
      </span>
    </button>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-3 hover:shadow-xl transition-all group">
      <div className={`w-11 h-11 ${color} rounded-2xl flex items-center justify-center text-xl shadow-lg border-2 border-white group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-text">{value}</p>
        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] mt-1">{label}</p>
      </div>
    </div>
  );
}

function DeviceCard({
  device,
  onActionChange,
  onDelete,
  isDeleting,
}: {
  device: any;
  onActionChange: (action: string) => void;
  onDelete: () => void;
  isDeleting?: boolean;
}) {
  const [showDelete, setShowDelete] = React.useState(false);
  const [showQR, setShowQR] = React.useState(false);
  const qrCanvasRef = React.useRef<HTMLDivElement>(null);
  const baseUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/l/${device.placeId}/device/${device.id}`;
  // If device is NFC type, add source=nfc parameter so it registers correctly
  const deviceQRUrl = device.deviceType === 'NFC' ? `${baseUrl}?source=nfc` : baseUrl;

  const handleDownloadQR = async () => {
    if (!qrCanvasRef.current) return;
    const svg = qrCanvasRef.current.querySelector('svg') as SVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const link = document.createElement('a');
    link.href = 'data:image/svg+xml;base64,' + btoa(svgData);
    link.download = `qr-${device.name.replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    if (!qrCanvasRef.current) return;
    const printWindow = window.open('', '', 'width=600,height=700');
    if (!printWindow) return;

    const svg = qrCanvasRef.current.querySelector('svg') as SVGElement;
    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImage = 'data:image/svg+xml;base64,' + btoa(svgData);
    const safeDeviceName = device.name.replace(/[<>&"']/g, '');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir QR - ${safeDeviceName}</title>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              background-color: #f9fafb;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .card-wrapper {
              background-color: #ffffff;
              width: 420px;
              border: 3px solid #111827;
              border-radius: 32px;
              padding: 35px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.05);
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .card-header-accent {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 12px;
              background: linear-gradient(90deg, #ff4d4d, #ff9966);
            }
            .badge {
              display: inline-block;
              background: linear-gradient(135deg, #ff4d4d, #ff9966);
              color: #ffffff;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 6px 16px;
              border-radius: 50px;
              letter-spacing: 1.5px;
              margin-bottom: 20px;
            }
            h2 { 
              margin: 0 0 8px 0; 
              font-size: 26px; 
              font-weight: 900; 
              color: #111827;
              letter-spacing: -0.5px;
            }
            .zone-label {
              font-size: 12px;
              font-weight: 700;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 25px;
            }
            .qr-frame {
              display: inline-block;
              padding: 16px;
              background-color: #ffffff;
              border: 2px solid #e5e7eb;
              border-radius: 24px;
              box-shadow: 0 8px 20px rgba(0,0,0,0.03);
              margin-bottom: 25px;
            }
            .qr-frame img { 
              display: block;
              border: none;
            }
            .instructions { 
              font-size: 13px; 
              color: #374151; 
              line-height: 1.6;
              margin: 0 0 25px 0;
              padding: 0 10px;
              font-weight: 500;
            }
            .steps {
              display: flex;
              justify-content: space-between;
              background-color: #f3f4f6;
              border-radius: 16px;
              padding: 12px;
              margin-bottom: 30px;
            }
            .step-item {
              flex: 1;
              font-size: 10px;
              font-weight: 700;
              color: #4b5563;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .step-item span {
              display: block;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .footer-brand { 
              font-size: 10px; 
              font-weight: 800; 
              color: #9ca3af; 
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            @media print { 
              body { background-color: #ffffff; }
              .card-wrapper { 
                border: 3px solid #111827; 
                box-shadow: none; 
                margin: 0 auto;
                page-break-inside: avoid;
              } 
            }
          </style>
        </head>
        <body>
          <div class="card-wrapper">
            <div class="card-header-accent"></div>
            
            <div class="badge">¿Nos dejas tu opinión?</div>
            <h2>¡Tu experiencia cuenta!</h2>
            <div class="zone-label">Zona: ${device.name}</div>
            
            <div class="qr-frame">
              <img src="${qrImage}" alt="QR Code" width="240" height="240" />
            </div>
            
            <p class="instructions">
              Escanea el código QR con la cámara de tu celular para ver nuestra carta digital, dejarnos una sugerencia o valorarnos directamente. ¡Nos ayuda un montón!
            </p>
            
            <div class="steps">
              <div class="step-item"><span>📷</span>1. Abre Cámara</div>
              <div style="width: 1px; background-color: #d1d5db; margin: 0 8px;"></div>
              <div class="step-item"><span>🔍</span>2. Escanea QR</div>
              <div style="width: 1px; background-color: #d1d5db; margin: 0 8px;"></div>
              <div class="step-item"><span>⭐</span>3. Valóranos</div>
            </div>
            
            <div class="footer-brand">Powered by Wuarike</div>
          </div>
          <script>
            window.print();
            window.addEventListener('afterprint', () => window.close());
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`flex items-center gap-4 p-4 bg-background rounded-2xl border border-border transition-all ${isDeleting ? 'opacity-50' : 'hover:border-primary'}`}>
      {/* Dispositivo Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-black text-text text-sm truncate">{device.name}</p>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${device.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
          <span className="text-[9px] font-bold text-gray-400 uppercase flex-shrink-0">{device.deviceType}</span>
        </div>
      </div>

      {/* Acción Dropdown */}
      <select
        value={device.action}
        onChange={(e) => onActionChange(e.target.value)}
        className="py-2 px-3 text-[10px] font-bold rounded-lg border border-border hover:border-primary transition-all cursor-pointer"
      >
        <option value="reputation">⭐ Reseña</option>
        <option value="raffle">🎁 Sorteo</option>
        <option value="menu">🍽️ Menú</option>
      </select>

      {/* Ver QR Button */}
      <button
        onClick={() => setShowQR(!showQR)}
        className="px-4 py-2 text-[10px] font-black text-primary uppercase rounded-lg border border-dashed border-primary hover:bg-primary/5 transition-all flex-shrink-0"
      >
        📲 QR
      </button>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-4 animate-in fade-in zoom-in">
            <h3 className="font-black text-lg text-text">QR: {device.name}</h3>
            <div className="flex justify-center p-6 bg-gray-50 rounded-2xl">
              <div ref={qrCanvasRef}>
                <QRCodeSVG
                  value={deviceQRUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <p className="text-[9px] text-center text-gray-500 font-mono break-all">{deviceQRUrl}</p>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadQR}
                className="flex-1 py-2 text-[10px] font-black bg-primary text-white rounded-lg hover:bg-opacity-90"
              >
                ⬇️ Descargar
              </button>
              <button
                onClick={handlePrintQR}
                className="flex-1 py-2 text-[10px] font-black bg-accent text-white rounded-lg hover:bg-opacity-90"
              >
                🖨️ Imprimir
              </button>
            </div>
            <button
              onClick={() => setShowQR(false)}
              className="w-full py-2 text-[10px] font-bold text-text-muted uppercase border border-border rounded-lg hover:bg-background"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
