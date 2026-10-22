'use client';

import { Check, Nfc, X } from 'lucide-react';
import { Badge, Button, EmptyState } from '../../ui';
import { SectionCard } from '../SectionCard';
import { Table, Td, Tr } from '../Table';

const STATUS: Record<string, { label: string; tone: 'success' | 'danger' | 'warning' }> = {
  fulfilled: { label: 'Entregado', tone: 'success' },
  rejected: { label: 'Rechazado', tone: 'danger' },
  pending: { label: 'Pendiente', tone: 'warning' },
};

/** Pedidos de Taps (NFC) que hacen los negocios. */
export function DeviceRequests({ requests, placeName, onStatus }: {
  requests: any[];
  placeName(placeId: string): string;
  onStatus(id: string, status: 'fulfilled' | 'rejected'): void;
}) {
  return (
    <SectionCard title="Pedidos de Taps" subtitle={`${requests.filter((r) => r.status === 'pending').length} pendientes`}>
      {requests.length === 0 ? (
        <EmptyState icon={Nfc} headingLevel="h3" title="Sin pedidos aún" description="Cuando un negocio pida Taps, lo verás aquí." />
      ) : (
        <Table columns={['Local', 'Tipo', { label: 'Cantidad', align: 'right' }, { label: 'Total', align: 'right' }, 'Estado', { label: 'Acciones', align: 'right' }]}>
          {requests.map((r) => {
            const status = STATUS[r.status] ?? STATUS.pending;
            return (
              <Tr key={r.id}>
                <Td className="font-semibold">{placeName(r.placeId)}</Td>
                <Td className="capitalize">{r.tapType}</Td>
                <Td right>{r.quantity}</Td>
                <Td right>S/ {Number(r.totalPrice).toFixed(2)}</Td>
                <Td><Badge tone={status.tone}>{status.label}</Badge></Td>
                <Td right>
                  {r.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" icon={Check} onClick={() => onStatus(r.id, 'fulfilled')}>Entregar</Button>
                      <Button size="sm" variant="secondary" icon={X} className="text-danger" onClick={() => onStatus(r.id, 'rejected')}>Rechazar</Button>
                    </div>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}
    </SectionCard>
  );
}
