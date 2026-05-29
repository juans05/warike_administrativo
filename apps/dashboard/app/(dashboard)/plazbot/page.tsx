'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { plazbotApi } from '../../../lib/api-client';
import { useRestaurant } from '../../../context/RestaurantContext';

export default function PlazbotSetupPage() {
  const [formData, setFormData] = useState({
    apiKey: '',
    workspaceId: '',
    agentId: '',
    systemPrompt: '',
    tone: 'professional' as 'professional' | 'casual' | 'friendly',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { activePlaceId } = useRestaurant();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const startTime = Date.now();
    const log = (msg: string) => {
      console.log(`[PLAZBOT ${Date.now() - startTime}ms] ${msg}`);
    };

    log('📍 Iniciando conexión con plazbot...');

    try {
      log('📍 Enviando configuración...');
      const data = await plazbotApi.connect({ ...formData, placeId: activePlaceId ?? undefined });
      log('✅ Configuración guardada');
      setSuccess('✅ Plazbot conectado exitosamente');
      setFormData({
        apiKey: '',
        workspaceId: '',
        agentId: '',
        systemPrompt: '',
        tone: 'professional',
      });

      setTimeout(() => {
        router.push('/inicio');
      }, 2000);
    } catch (err: any) {
      const totalTime = Date.now() - startTime;
      console.error(`[PLAZBOT ${totalTime}ms] ❌ Error:`, err.message);
      if (err.name === 'AbortError') {
        setError('La solicitud tardó demasiado');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Conectar PlazBot</h1>
        <p className="text-gray-600 mb-8">
          Configura tus credenciales de PlazBot para integrar el servicio de chat inteligente
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md border border-gray-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleInputChange}
              placeholder="Ingresa tu API Key de PlazBot"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Workspace ID</label>
            <input
              type="text"
              name="workspaceId"
              value={formData.workspaceId}
              onChange={handleInputChange}
              placeholder="Ingresa tu Workspace ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Agent ID</label>
            <input
              type="text"
              name="agentId"
              value={formData.agentId}
              onChange={handleInputChange}
              placeholder="Ingresa tu Agent ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tono de Respuesta</label>
            <select
              name="tone"
              value={formData.tone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            >
              <option value="professional">Profesional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Amistoso</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">System Prompt (Opcional)</label>
            <textarea
              name="systemPrompt"
              value={formData.systemPrompt}
              onChange={handleInputChange}
              placeholder="Instrucciones personalizadas para el agente de IA"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              rows={4}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-200">
              <p className="font-bold">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F26122] text-white py-3 rounded-lg font-bold hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Conectando...' : 'Conectar PlazBot'}
          </button>
        </form>
      </div>
    </div>
  );
}
