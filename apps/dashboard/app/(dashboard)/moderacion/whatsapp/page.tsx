'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { adminApi } from '../../../../lib/api-client';
import { toast } from 'sonner';
import { Card, EmptyState, PageHeader } from '../../../../components/ui';
import { ConnectExistingForm } from '../../../../components/admin/whatsapp/ConnectExistingForm';
import { NumbersList, type WaNumber } from '../../../../components/admin/whatsapp/NumbersList';
import { PlacePicker, type Place } from '../../../../components/admin/whatsapp/PlacePicker';
import { TestMessageCard } from '../../../../components/admin/whatsapp/TestMessageCard';
import { WebhookNotice } from '../../../../components/admin/whatsapp/WebhookNotice';

export default function AdminWhatsappConfigPage() {
  const [search, setSearch] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [waNumbers, setWaNumbers] = useState<WaNumber[]>([]);
  const [metaWebhookUrl, setMetaWebhookUrl] = useState('');
  // Local elegido en este momento: descarta respuestas tardías de un local anterior.
  const currentPlaceId = useRef<string | null>(null);

  useEffect(() => {
    adminApi.getPlaces(1, search).then(res => setPlaces(res.data || [])).catch(() => setPlaces([]));
  }, [search]);

  const loadWaNumbers = useCallback(async (placeId: string) => {
    try {
      const res = await adminApi.getWhatsappNumbers(placeId);
      if (currentPlaceId.current !== placeId) return;
      setWaNumbers(res.data || []);
      setMetaWebhookUrl(res.metaWebhookUrl || '');
    } catch {
      if (currentPlaceId.current === placeId) setWaNumbers([]);
    }
  }, []);

  const selectPlace = (place: Place) => {
    currentPlaceId.current = place.id;
    setSelectedPlace(place);
    // Se vacía ya: hasta que lleguen los números del nuevo local no debe quedar ninguno del anterior.
    setWaNumbers([]);
    setMetaWebhookUrl('');
    loadWaNumbers(place.id);
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
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp por local"
        subtitle="Registra y conecta el número de WhatsApp de cada local. Los dueños no pueden configurar esto: solo el equipo de Wuarikes."
      />

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <PlacePicker places={places} search={search} onSearch={setSearch} selectedId={selectedPlace?.id} onSelect={selectPlace} />

        <Card padding="lg" className="h-fit space-y-6">
          {!selectedPlace ? (
            <EmptyState icon={MessageCircle} headingLevel="h2" title="Elige un local" description="Selecciona un local para gestionar su número de WhatsApp." />
          ) : (
            <>
              <h2 className="text-base font-semibold text-text">{selectedPlace.name}</h2>

              {metaWebhookUrl && (
                <WebhookNotice tone="info" title="API de WhatsApp de Meta" url={metaWebhookUrl}>
                  En el panel de Meta (WhatsApp → Configuración → Webhook) pega esta URL y el token de verificación
                  (<code className="font-mono">WHATSAPP_WEBHOOK_TOKEN</code>), y suscríbete al campo <code className="font-mono">messages</code>.
                </WebhookNotice>
              )}

              {waNumbers.length > 0 && <NumbersList numbers={waNumbers} onDelete={handleDeleteWaNumber} />}

              <ConnectExistingForm key={`connect-${selectedPlace.id}`} placeId={selectedPlace.id} onConnected={() => loadWaNumbers(selectedPlace.id)} />

            </>
          )}
        </Card>
      </div>

      {/* key: al cambiar de local se vacía el número elegido, para que la prueba no salga por el número del local anterior. */}
      <TestMessageCard key={selectedPlace?.id ?? 'none'} numbers={waNumbers} />
    </div>
  );
}
