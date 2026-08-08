'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../../lib/api-client';
import { toast } from 'sonner';

interface Place {
  id: string;
  name: string;
  category?: { name: string };
  district?: { district: string };
}

type WaNumber = {
  id: string;
  phoneNumber: string;
  phoneNumberId: string;
  isActive: boolean;
  verificationStatus: string;
  createdAt: string;
};

export default function AdminWhatsappConfigPage() {
  const [search, setSearch] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [waNumbers, setWaNumbers] = useState<WaNumber[]>([]);
  const [waForm, setWaForm] = useState({ phoneNumber: '', phoneNumberId: '', whatsappApiToken: '' });
  const [waRegistering, setWaRegistering] = useState(false);
  const [waError, setWaError] = useState('');
  const [waSuccess, setWaSuccess] = useState('');

  useEffect(() => {
    adminApi.getPlaces(1, search).then(res => setPlaces(res.data || [])).catch(() => setPlaces([]));
  }, [search]);

  const loadWaNumbers = useCallback(async (placeId: string) => {
    try {
      const res = await adminApi.getWhatsappNumbers(placeId);
      setWaNumbers(res.data || []);
    } catch {
      setWaNumbers([]);
    }
  }, []);

  const selectPlace = (place: Place) => {
    setSelectedPlace(place);
    setWaError(''); setWaSuccess('');
    setWaForm({ phoneNumber: '', phoneNumberId: '', whatsappApiToken: '' });
    loadWaNumbers(place.id);
  };

  const handleRegisterWaNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;
    if (!waForm.phoneNumber || !waForm.phoneNumberId) {
      setWaError('Completa el número y el Phone Number ID'); return;
    }
    setWaRegistering(true); setWaError(''); setWaSuccess('');
    try {
      await adminApi.createWhatsappNumber({ placeId: selectedPlace.id, ...waForm });
      setWaForm({ phoneNumber: '', phoneNumberId: '', whatsappApiToken: '' });
      setWaSuccess('✅ Número registrado. El webhook se configuró automáticamente en PlazBot.');
      await loadWaNumbers(selectedPlace.id);
    } catch (err: any) {
      setWaError(err.message || 'Error al registrar número');
    } finally { setWaRegistering(false); }
  };

  const handleDeleteWaNumber = async (numberId: string) => {
    if (!confirm('¿Eliminar este número?')) return;
    try {
      await adminApi.deleteWhatsappNumber(numberId);
      setWaNumbers(prev => prev.filter(n => n.id !== numberId));
    } catch {
      toast.error('Error al eliminar el número');
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">WhatsApp Bot por Empresa</h1>
        <p className="text-[#6B7280] font-medium max-w-lg">Registra el número de WhatsApp/Gupshup de cada local. Los dueños ya no pueden configurar esto — solo el superAdmin.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        {/* Selector de local */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4 h-fit">
          <input
            type="text"
            placeholder="Buscar local..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#F7F8FA] py-3 px-4 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-orange-50"
          />
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {places.map(place => (
              <button
                key={place.id}
                onClick={() => selectPlace(place)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                  selectedPlace?.id === place.id ? 'bg-[#F26122]/10 text-[#F26122]' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <p className="font-bold text-sm">{place.name}</p>
                <p className="text-xs text-gray-400">{place.category?.name} · {place.district?.district}</p>
              </button>
            ))}
            {places.length === 0 && (
              <p className="text-xs text-gray-400 px-2 py-4 text-center">Sin resultados.</p>
            )}
          </div>
        </section>

        {/* Configuración del número */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5 h-fit">
          {!selectedPlace ? (
            <p className="text-sm text-gray-400">Selecciona un local para gestionar su número de WhatsApp.</p>
          ) : (
            <>
              <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">
                📱 {selectedPlace.name}
              </h2>

              {waNumbers.length > 0 && (
                <div className="space-y-2">
                  {waNumbers.map(num => (
                    <div key={num.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <div>
                        <p className="text-sm font-black text-gray-900">{num.phoneNumber}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {num.phoneNumberId}</p>
                        <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          num.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {num.isActive ? '🟢 Activo' : '⏳ Pendiente'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteWaNumber(num.id)}
                        className="text-xs text-red-500 font-bold hover:text-red-700 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleRegisterWaNumber} className="space-y-4">
                <p className="text-xs text-gray-400">
                  Registra el número de WhatsApp Business de este local. El webhook de PlazBot se configura automáticamente con el número — no hace falta nada más de Gupshup/Meta si el bot corre por PlazBot.
                </p>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                    Número de Teléfono
                  </label>
                  <input
                    type="tel"
                    placeholder="+51 947 196 047"
                    value={waForm.phoneNumber}
                    onChange={e => setWaForm(p => ({ ...p, phoneNumber: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                    Phone Number ID <span className="normal-case font-normal text-gray-400">(de Gupshup / Meta)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="1125526153979521"
                    value={waForm.phoneNumberId}
                    onChange={e => setWaForm(p => ({ ...p, phoneNumberId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                    API Token de WhatsApp <span className="normal-case font-normal text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="103683••••••6105"
                    value={waForm.whatsappApiToken}
                    onChange={e => setWaForm(p => ({ ...p, whatsappApiToken: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Solo si además vas a mandar mensajes directo con la API de Meta/Gupshup (sin pasar por PlazBot). Si el bot de este local corre 100% por PlazBot, dejalo vacío.
                  </p>
                </div>

                {waError && (
                  <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200 text-sm">{waError}</div>
                )}
                {waSuccess && (
                  <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200 text-sm font-medium">{waSuccess}</div>
                )}

                <button
                  type="submit"
                  disabled={waRegistering}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-black hover:opacity-90 transition-all disabled:opacity-50 text-sm"
                >
                  {waRegistering ? '⏳ Registrando...' : '✅ Registrar Número'}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
