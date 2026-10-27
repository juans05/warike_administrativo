'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { Smartphone, Unplug } from 'lucide-react';
import { Badge, Button, Card, DataList, EmptyState, PageHeader } from '../../../components/ui';
import WhatsAppSetupWizard from '../../../components/WhatsAppSetupWizard';
import { ConsumptionCard } from '../../../components/whatsapp/ConsumptionCard';
import { toast } from 'sonner';

export default function WhatsAppConfigPage() {
  const { activePlaceId } = useRestaurant();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activePlaceId) { setIsLoading(false); return; }
    try {
      const res = await businessApi.getWhatsappNumbers(activePlaceId);
      setNumbers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activePlaceId]);

  useEffect(() => { setIsLoading(true); load(); }, [load]);

  const handleDelete = async (numberId: string) => {
    if (!confirm('¿Desconectar este número de WhatsApp? Dejará de responder y recibir mensajes en Wuarikes.')) return;
    try {
      await businessApi.deleteWhatsappNumber(numberId);
      setNumbers(prev => prev.filter(n => n.id !== numberId));
      toast.success('Número desconectado');
    } catch {
      toast.error('Error al desconectar el número');
    }
  };

  const countLabel = `${numbers.length} ${numbers.length === 1 ? 'número conectado' : 'números conectados'}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Conexión de WhatsApp" subtitle={isLoading ? 'Conecta el número de tu negocio con Facebook.' : `Conecta el número de tu negocio con Facebook · ${countLabel}.`} />

      {activePlaceId && <WhatsAppSetupWizard placeId={activePlaceId} onChanged={load} />}

      <Card padding="lg">
        <h2 className="text-base font-semibold text-text">Números conectados</h2>
        <div className="mt-2">
          <DataList
            items={numbers}
            loading={isLoading}
            empty={
              <EmptyState
                icon={Smartphone}
                title="Todavía no conectaste ningún número"
                description="Sigue los pasos de arriba para conectar tu WhatsApp con Facebook."
                headingLevel="h3"
              />
            }
            renderItem={(num) => (
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold tabular-nums text-text">+{num.phoneNumber}</h3>
                    <Badge tone={num.isActive ? 'success' : 'warning'}>{num.isActive ? 'Activo' : 'Pendiente'}</Badge>
                    <Badge>{num.provider === 'meta' ? (num.isActive ? 'Facebook' : 'Facebook (pausado)') : 'PlazBot'}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">Registrado el {new Date(num.createdAt).toLocaleDateString('es-PE')}</p>
                </div>
                {/* Solo los números conectados con Facebook se pueden desconectar desde aquí; los demás los gestiona el administrador. */}
                {num.provider === 'meta' && (
                  <Button variant="secondary" size="sm" icon={Unplug} onClick={() => handleDelete(num.id)}>
                    Desconectar
                  </Button>
                )}
              </div>
            )}
          />
        </div>
      </Card>

      {activePlaceId && numbers.some((n) => n.provider === 'meta') && <ConsumptionCard placeId={activePlaceId} />}
    </div>
  );
}
