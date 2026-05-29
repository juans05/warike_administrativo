'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { SkeletonHeader, SkeletonCard, SkeletonGrid } from '../../../components/SkeletonLoader';

export default function BroadcastsPage() {
  const { activePlaceId } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [isLoading, setIsLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [emailCampaigns, setEmailCampaigns] = useState<any[]>([]);

  useEffect(() => {
    if (!activePlaceId) {
      setIsLoading(false);
      return;
    }
    loadData();
  }, [activePlaceId]);

  const loadData = async () => {
    try {
      const [broadcastsData, emailData] = await Promise.all([
        businessApi.getBroadcasts(activePlaceId),
        businessApi.getEmailCampaigns(activePlaceId),
      ]);
      setBroadcasts(broadcastsData || []);
      setEmailCampaigns(emailData || []);
    } catch (err) {
      console.error('Error cargando campañas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl space-y-10 pb-32">
        <SkeletonHeader />
        <div className="space-y-6">
          <SkeletonCard className="h-80" />
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded-lg w-1/4 animate-pulse"></div>
            <SkeletonGrid count={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-text tracking-tight font-warike">Campañas Masivas</h1>
          <p className="text-text-muted font-bold text-lg">
            Envía mensajes personalizados de WhatsApp y Email a tus clientes.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl ring-1 ring-black/5 w-fit">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-white text-orange-600 shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            💬 WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'email'
                ? 'bg-white text-orange-600 shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            📧 Email
          </button>
        </div>
      </header>

      {/* WhatsApp Section */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Campañas WhatsApp</h2>
          {broadcasts.length === 0 ? (
            <div className="bg-blue-50 p-8 rounded-xl text-center border border-blue-100">
              <p className="text-gray-600">No hay campañas de WhatsApp aún</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {broadcasts.map((broadcast) => (
                <div key={broadcast.id} className="bg-white p-6 rounded-xl border border-gray-100">
                  <h3 className="font-bold text-gray-900">{broadcast.campaignName}</h3>
                  <p className="text-sm text-gray-600 mt-2">{broadcast.templateBody}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Section */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Campañas Email</h2>
          {emailCampaigns.length === 0 ? (
            <div className="bg-green-50 p-8 rounded-xl text-center border border-green-100">
              <p className="text-gray-600">No hay campañas de Email aún</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {emailCampaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white p-6 rounded-xl border border-gray-100">
                  <h3 className="font-bold text-gray-900">{campaign.campaignName}</h3>
                  <p className="text-sm text-gray-600 mt-2">{campaign.subject}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
