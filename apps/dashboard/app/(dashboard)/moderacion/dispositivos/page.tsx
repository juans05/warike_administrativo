'use client';

import React, { useState, useEffect } from 'react';
import { businessApi, adminApi } from '../../../../lib/api-client';
import { toast } from 'sonner';

export default function DispositivosPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    deviceType: 'NFC',
    placeId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar todos los locales
      const placesRes = await adminApi.getPlaces(1, '');
      setPlaces(placesRes.data || []);

      // Por ahora, simulamos dispositivos (necesitarías endpoint en backend)
      setDevices([]);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async () => {
    if (!formData.name.trim() || !formData.placeId) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      // Llamar al backend para crear dispositivo
      const newDevice = await businessApi.createDevice(formData.placeId, {
        name: formData.name,
        deviceType: formData.deviceType,
      });

      setDevices([...devices, newDevice]);
      setFormData({ name: '', deviceType: 'NFC', placeId: '' });
      setIsAdding(false);
      toast.success('Dispositivo agregado');
    } catch (err: any) {
      toast.error(err?.message || 'Error agregando dispositivo');
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
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Gestión de Dispositivos</h1>
          <p className="text-[#6B7280] font-medium max-w-lg mt-2">Agrega y configura dispositivos NFC/QR globales para todos los warikes</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-[#F26122] text-white font-black text-sm uppercase rounded-2xl hover:bg-opacity-90 transition-all"
          >
            + Nuevo Dispositivo
          </button>
        )}
      </header>

      {/* Form para agregar dispositivo */}
      {isAdding && (
        <div className="bg-white p-10 rounded-3xl border border-orange-100 space-y-6">
          <h2 className="text-2xl font-black text-[#1A1A1A]">Agregar Nuevo Dispositivo</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Nombre / Zona</label>
              <input
                type="text"
                placeholder="Ej: Mesa 1, Entrada, Caja"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Tipo de Dispositivo</label>
              <select
                value={formData.deviceType}
                onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="NFC">🏷️ NFC Reader</option>
                <option value="QR">📱 QR Solo</option>
                <option value="TABLET">💻 Tablet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Asignar a Warike</label>
              <select
                value={formData.placeId}
                onChange={(e) => setFormData({ ...formData, placeId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccionar warike...</option>
                {places.map(place => (
                  <option key={place.id} value={place.id}>
                    {place.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddDevice}
              className="flex-1 py-3 bg-[#F26122] text-white font-black uppercase rounded-xl hover:bg-opacity-90 transition-all"
            >
              Crear Dispositivo
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setFormData({ name: '', deviceType: 'NFC', placeId: '' });
              }}
              className="flex-1 py-3 border-2 border-gray-200 text-[#1A1A1A] font-black uppercase rounded-xl hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de dispositivos */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-50">
          <h2 className="text-xl font-black text-[#1A1A1A]">Dispositivos Activos</h2>
          <p className="text-sm text-gray-500 mt-1">{devices.length} dispositivos registrados</p>
        </div>

        <div className="overflow-x-auto">
          {devices.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <p className="font-bold">Sin dispositivos aún</p>
              <p className="text-sm">Agrega el primer dispositivo arriba</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-600">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-600">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-600">Warike</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-600">Estado</th>
                  <th className="px-6 py-4 text-center text-sm font-black text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(device => (
                  <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1A1A1A]">{device.name}</td>
                    <td className="px-6 py-4 text-sm">{device.deviceType}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{device.placeName || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${device.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {device.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-sm text-orange-600 font-bold hover:underline">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <p className="text-sm text-blue-900 font-bold">
          ℹ️ <strong>Nota:</strong> Los dispositivos creados aquí estarán disponibles en el Motor de Reputación del warike. Los usuarios solo podrán cambiar la acción (encuesta, menú, sorteo), no crear o eliminar dispositivos.
        </p>
      </div>
    </div>
  );
}
