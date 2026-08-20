'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Download, Link2, Unlink, PauseCircle, PlayCircle, History, MoreVertical, type LucideIcon } from 'lucide-react';
import { adminApi, qrApi, publicApi, AssignQrPayload } from '../../../../lib/api-client';
import { copyQrUrls, downloadQrPng, openPrintSheet } from '../../../../lib/qrImage';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  ASSIGNED: 'Asignado',
  SUSPENDED: 'Suspendido',
  DISABLED: 'Desactivado',
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  DISABLED: 'bg-red-100 text-red-700',
};

const DESTINATION_LABELS: Record<string, string> = {
  REPUTATION: 'Reputación (Google)',
  MENU: 'Menú digital',
  CUSTOM_URL: 'URL personalizada',
};

export default function DispositivosPage() {
  const [places, setPlaces] = useState<any[]>([]);
  const [deviceRequests, setDeviceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<any>(null);
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [showGenerate, setShowGenerate] = useState(false);
  const [assignTarget, setAssignTarget] = useState<any>(null); // el QrCode que se está (re)asignando
  const [historyTarget, setHistoryTarget] = useState<any>(null); // { qrCode, history }

  useEffect(() => {
    loadData();
    loadQr();
  }, []);

  useEffect(() => {
    loadQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const placesRes = await adminApi.getPlaces(1, '');
      setPlaces(placesRes.data || []);
      const requestsRes = await adminApi.getDeviceRequests();
      setDeviceRequests(requestsRes || []);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const loadQr = async () => {
    try {
      const [statsRes, listRes] = await Promise.all([qrApi.getStats(), qrApi.list(statusFilter || undefined)]);
      setStats(statsRes);
      setQrCodes(listRes || []);
    } catch (err) {
      console.error('Error loading QR data:', err);
      toast.error('Error cargando el banco de QR');
    }
  };

  const filteredQr = search
    ? qrCodes.filter((q) => q.code.toLowerCase().includes(search.toLowerCase()))
    : qrCodes;

  const placeName = (placeId: string) => places.find((p) => p.id === placeId)?.name || placeId;

  const handleRequestStatus = async (id: string, status: 'fulfilled' | 'rejected') => {
    try {
      await adminApi.updateDeviceRequestStatus(id, status);
      const requestsRes = await adminApi.getDeviceRequests();
      setDeviceRequests(requestsRes || []);
      toast.success('Pedido actualizado');
    } catch (err) {
      toast.error('Error actualizando el pedido');
    }
  };

  const handleGenerate = async (count: number, physicalType: 'QR' | 'NFC' | 'TABLET') => {
    try {
      const created = await qrApi.generateBatch(count, physicalType);
      toast.success(`${count} códigos generados`);
      setShowGenerate(false);
      loadQr();
      if (physicalType === 'QR') openPrintSheet(created);
    } catch (err: any) {
      toast.error(err?.message || 'Error generando el lote');
    }
  };

  const handleDownload = async (qr: any) => {
    try {
      await downloadQrPng(qr);
    } catch (err: any) {
      toast.error('Error generando la imagen del QR');
    }
  };

  const handleCopyUrl = async (qr: any) => {
    try {
      await copyQrUrls([qr]);
      toast.success('URL copiada');
    } catch (err: any) {
      toast.error('No se pudo copiar');
    }
  };

  const handleCopyAllUrls = async () => {
    if (filteredQr.length === 0) return;
    try {
      await copyQrUrls(filteredQr);
      toast.success(`${filteredQr.length} URLs copiadas`);
    } catch (err: any) {
      toast.error('No se pudo copiar');
    }
  };

  const handlePrintAll = async () => {
    if (filteredQr.length === 0) return;
    try {
      await openPrintSheet(filteredQr);
    } catch (err: any) {
      toast.error('No se pudo generar la hoja imprimible');
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await qrApi.suspend(id);
      toast.success('QR suspendido');
      loadQr();
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await qrApi.activate(id);
      toast.success('QR reactivado');
      loadQr();
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    }
  };

  const handleUnassign = async (id: string) => {
    try {
      await qrApi.unassign(id);
      toast.success('QR desasignado, vuelve a estar disponible');
      loadQr();
    } catch (err: any) {
      toast.error(err?.message || 'Error');
    }
  };

  const openHistory = async (qrCode: any) => {
    try {
      const detail = await qrApi.getOne(qrCode.id);
      setHistoryTarget(detail);
    } catch (err: any) {
      toast.error(err?.message || 'Error cargando historial');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] tracking-tight">Códigos QR</h1>
          <p className="text-[#6B7280] font-medium max-w-lg mt-2">
            Banco de QR: imprime, asigna, reasigna y desactiva los QR físicos de Wuarikes.
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="px-6 py-3 bg-[#F26122] text-white font-black text-sm uppercase rounded-2xl hover:bg-opacity-90 transition-all shrink-0"
        >
          + Generar lote
        </button>
      </header>

      {/* Contadores */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.qrCodes.total} />
          <StatCard label="Disponibles" value={stats.qrCodes.available} />
          <StatCard label="Asignados" value={stats.qrCodes.assigned} />
          <StatCard label="Suspendidos" value={stats.qrCodes.suspended} />
          <StatCard label="Escaneos totales" value={stats.scans.total} />
          <StatCard label="Escaneos hoy" value={stats.scans.today} />
          <StatCard label="Escaneos este mes" value={stats.scans.month} />
        </div>
      )}

      {/* Banco de QR */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="p-4 sm:p-6 md:p-10 border-b border-gray-50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#1A1A1A]">Banco de QR</h2>
            <p className="text-sm text-gray-500 mt-1">{filteredQr.length} códigos</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar por código (QR-000042)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleCopyAllUrls}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50"
            >
              Copiar todas las URLs
            </button>
            <button
              onClick={handlePrintAll}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50"
            >
              Imprimir todas
            </button>
          </div>
        </div>

        {filteredQr.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p className="font-bold">Sin códigos QR aún</p>
            <p className="text-sm">Genera el primer lote arriba</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredQr.map((qr) => {
              const actions: QrAction[] = [
                { label: 'Copiar URL', icon: Copy, color: 'blue', onClick: () => handleCopyUrl(qr) },
                { label: 'Descargar', icon: Download, color: 'blue', onClick: () => handleDownload(qr) },
              ];
              if (qr.status === 'AVAILABLE') {
                actions.push({ label: 'Asignar', icon: Link2, color: 'orange', onClick: () => setAssignTarget({ qrCode: qr, mode: 'assign' }) });
              }
              if (qr.status === 'ASSIGNED') {
                actions.push(
                  { label: 'Reasignar', icon: Link2, color: 'orange', onClick: () => setAssignTarget({ qrCode: qr, mode: 'reassign' }) },
                  { label: 'Desasignar', icon: Unlink, color: 'gray', onClick: () => handleUnassign(qr.id) },
                );
              }
              if (qr.status === 'SUSPENDED') {
                actions.push({ label: 'Activar', icon: PlayCircle, color: 'green', onClick: () => handleActivate(qr.id) });
              } else if (qr.status !== 'DISABLED') {
                actions.push({ label: 'Suspender', icon: PauseCircle, color: 'yellow', onClick: () => handleSuspend(qr.id) });
              }
              actions.push({ label: 'Historial', icon: History, color: 'gray', onClick: () => openHistory(qr) });

              return (
                <div key={qr.id} className="flex items-start justify-between gap-3 p-4 sm:p-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#1A1A1A]">{qr.code}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[qr.status]}`}>
                        {STATUS_LABELS[qr.status]}
                      </span>
                    </div>
                    <a
                      href={`/q/${qr.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-gray-400 hover:underline"
                    >
                      /q/{qr.token}
                    </a>
                    <p className="mt-1 text-sm text-gray-500">
                      {qr.physicalType} · {qr.currentPlaceName || 'Sin asignar'}
                    </p>
                  </div>
                  <div className="hidden md:flex flex-wrap justify-end gap-2 shrink-0">
                    {actions.map((action) => (
                      <InlineActionButton key={action.label} action={action} />
                    ))}
                  </div>
                  <div className="md:hidden">
                    <ActionsMenu actions={actions} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pedidos de taps de los negocios */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-50">
          <h2 className="text-xl font-black text-[#1A1A1A]">Pedidos de Taps</h2>
          <p className="text-sm text-gray-500 mt-1">{deviceRequests.filter(r => r.status === 'pending').length} pendientes</p>
        </div>
        <div className="overflow-x-auto">
          {deviceRequests.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <p className="font-bold">Sin pedidos aún</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-600">Wuarike</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-600">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-600">Cantidad</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-600">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-600">Estado</th>
                  <th className="px-6 py-4 text-center text-sm font-black text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deviceRequests.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1A1A1A]">{placeName(r.placeId)}</td>
                    <td className="px-6 py-4 text-sm capitalize">{r.tapType}</td>
                    <td className="px-6 py-4 text-sm">{r.quantity}</td>
                    <td className="px-6 py-4 text-sm">S/ {Number(r.totalPrice).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        r.status === 'fulfilled' ? 'bg-green-100 text-green-700' :
                        r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {r.status === 'fulfilled' ? 'Entregado' : r.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-3">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => handleRequestStatus(r.id, 'fulfilled')} className="text-sm text-green-600 font-bold hover:underline">
                            Entregar
                          </button>
                          <button onClick={() => handleRequestStatus(r.id, 'rejected')} className="text-sm text-red-600 font-bold hover:underline">
                            Rechazar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showGenerate && (
        <GenerateModal onClose={() => setShowGenerate(false)} onGenerate={handleGenerate} />
      )}

      {assignTarget && (
        <AssignModal
          qrCode={assignTarget.qrCode}
          mode={assignTarget.mode}
          places={places}
          onClose={() => setAssignTarget(null)}
          onDone={() => {
            setAssignTarget(null);
            loadQr();
            loadData();
          }}
        />
      )}

      {historyTarget && (
        <HistoryModal target={historyTarget} onClose={() => setHistoryTarget(null)} />
      )}
    </div>
  );
}

type ActionColor = 'blue' | 'orange' | 'gray' | 'yellow' | 'green';

type QrAction = {
  label: string;
  icon: LucideIcon;
  color: ActionColor;
  onClick: () => void;
};

const ACTION_TEXT_COLORS: Record<ActionColor, string> = {
  blue: 'text-blue-700',
  orange: 'text-orange-700',
  gray: 'text-gray-700',
  yellow: 'text-yellow-700',
  green: 'text-green-700',
};

const ACTION_BG_COLORS: Record<ActionColor, string> = {
  blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
  gray: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
  green: 'bg-green-50 text-green-700 hover:bg-green-100',
};

// Botón individual — solo se muestra en desktop (md+), donde sí hay
// espacio para todas las acciones en línea sin salirse de pantalla.
function InlineActionButton({ action }: { action: QrAction }) {
  return (
    <button
      onClick={action.onClick}
      aria-label={action.label}
      title={action.label}
      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${ACTION_BG_COLORS[action.color]}`}
    >
      <action.icon size={20} />
    </button>
  );
}

// Menú "⋮" con las acciones de un QR — evita que N botones se salgan de
// pantalla en mobile; se cierra solo al elegir una opción o tocar afuera.
function ActionsMenu({ actions }: { actions: QrAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Más acciones"
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <MoreVertical size={20} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold hover:bg-gray-50 ${ACTION_TEXT_COLORS[action.color]}`}
            >
              <action.icon size={16} />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <p className="text-2xl font-black text-[#1A1A1A]">{value.toLocaleString()}</p>
      <p className="text-xs font-bold text-gray-500 uppercase mt-1">{label}</p>
    </div>
  );
}

function GenerateModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (count: number, physicalType: 'QR' | 'NFC' | 'TABLET') => void }) {
  const [count, setCount] = useState(100);
  const [physicalType, setPhysicalType] = useState<'QR' | 'NFC' | 'TABLET'>('QR');

  return (
    <Modal onClose={onClose} title="Generar lote de QR">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Cantidad</label>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Tipo físico</label>
          <select
            value={physicalType}
            onChange={(e) => setPhysicalType(e.target.value as any)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="QR">📱 QR (papel/sticker)</option>
            <option value="NFC">🏷️ NFC</option>
            <option value="TABLET">💻 Tablet</option>
          </select>
        </div>
        <button
          onClick={() => onGenerate(count, physicalType)}
          className="w-full py-3 bg-[#F26122] text-white font-black uppercase rounded-xl hover:bg-opacity-90 transition-all"
        >
          Generar {count} códigos
        </button>
      </div>
    </Modal>
  );
}

function AssignModal({
  qrCode,
  mode,
  places,
  onClose,
  onDone,
}: {
  qrCode: any;
  mode: 'assign' | 'reassign';
  places: any[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [creatingNew, setCreatingNew] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [newPlace, setNewPlace] = useState({ name: '', categoryId: '', district: '', address: '', phone: '' });
  const [destinationType, setDestinationType] = useState<'REPUTATION' | 'MENU' | 'CUSTOM_URL'>('REPUTATION');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    publicApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const filteredPlaces = placeSearch
    ? places.filter((p) => p.name.toLowerCase().includes(placeSearch.toLowerCase()))
    : places;

  const handleSubmit = async () => {
    if (!creatingNew && !placeId) {
      toast.error('Selecciona un local o crea uno nuevo');
      return;
    }
    if (creatingNew && (!newPlace.name || !newPlace.categoryId || !newPlace.district)) {
      toast.error('Completa nombre, categoría y distrito del local nuevo');
      return;
    }
    if (destinationType === 'CUSTOM_URL' && !destinationUrl) {
      toast.error('Ingresa la URL de destino');
      return;
    }

    const payload: AssignQrPayload = creatingNew
      ? { newPlace, destinationType, destinationUrl: destinationUrl || undefined, reason: reason || undefined }
      : { placeId, destinationType, destinationUrl: destinationUrl || undefined, reason: reason || undefined };

    setSaving(true);
    try {
      if (mode === 'assign') {
        await qrApi.assign(qrCode.id, payload);
      } else {
        await qrApi.reassign(qrCode.id, payload);
      }
      toast.success(mode === 'assign' ? 'QR asignado' : 'QR reasignado');
      onDone();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar la asignación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`${mode === 'assign' ? 'Asignar' : 'Reasignar'} ${qrCode.code}`} wide>
      <div className="space-y-6">
        {mode === 'reassign' && qrCode.currentPlaceName && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-900">
            Este QR está asignado a <strong>{qrCode.currentPlaceName}</strong>. Al reasignarlo, los siguientes escaneos irán al nuevo destino.
          </div>
        )}

        <div>
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => setCreatingNew(false)}
              className={`text-sm font-bold px-4 py-2 rounded-xl ${!creatingNew ? 'bg-[#F26122] text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Local existente
            </button>
            <button
              onClick={() => setCreatingNew(true)}
              className={`text-sm font-bold px-4 py-2 rounded-xl ${creatingNew ? 'bg-[#F26122] text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Crear local nuevo
            </button>
          </div>

          {!creatingNew ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Buscar local por nombre..."
                value={placeSearch}
                onChange={(e) => setPlaceSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <select
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                size={5}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {filteredPlaces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre del local"
                value={newPlace.name}
                onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <select
                value={newPlace.categoryId}
                onChange={(e) => setNewPlace({ ...newPlace, categoryId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Categoría...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Distrito (ej. Miraflores)"
                value={newPlace.district}
                onChange={(e) => setNewPlace({ ...newPlace, district: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="Dirección (opcional)"
                value={newPlace.address}
                onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="Teléfono (opcional)"
                value={newPlace.phone}
                onChange={(e) => setNewPlace({ ...newPlace, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Tipo de destino</label>
          <select
            value={destinationType}
            onChange={(e) => setDestinationType(e.target.value as any)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {Object.entries(DESTINATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {destinationType === 'CUSTOM_URL' && (
            <input
              type="text"
              placeholder="https://..."
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          )}
        </div>

        {mode === 'reassign' && (
          <div>
            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Motivo (opcional)</label>
            <input
              type="text"
              placeholder="Ej: el negocio anterior cerró"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 bg-[#F26122] text-white font-black uppercase rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? 'Guardando...' : mode === 'assign' ? 'Asignar QR' : 'Confirmar reasignación'}
        </button>
      </div>
    </Modal>
  );
}

function HistoryModal({ target, onClose }: { target: { qrCode: any; history: any[] }; onClose: () => void }) {
  return (
    <Modal onClose={onClose} title={`Historial de ${target.qrCode.code}`}>
      {target.history.length === 0 ? (
        <p className="text-sm text-gray-500">Este QR nunca fue asignado.</p>
      ) : (
        <ul className="space-y-4">
          {target.history.map((a: any) => (
            <li key={a.id} className="border-b border-gray-100 pb-4 last:border-0">
              <p className="font-bold text-[#1A1A1A]">{a.place?.name || a.placeId}</p>
              <p className="text-xs text-gray-500">
                {new Date(a.assignedAt).toLocaleDateString()} → {a.unassignedAt ? new Date(a.unassignedAt).toLocaleDateString() : 'Actualidad'}
              </p>
              <p className="text-xs text-gray-500">Destino: {DESTINATION_LABELS[a.destinationType] || a.destinationType}</p>
              {a.assignedByUser?.email && <p className="text-xs text-gray-400">Por: {a.assignedByUser.email}</p>}
              {a.reason && <p className="text-xs text-gray-400">Motivo: {a.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function Modal({ children, title, onClose, wide }: { children: React.ReactNode; title: string; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`bg-white rounded-3xl p-8 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[#1A1A1A]">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
