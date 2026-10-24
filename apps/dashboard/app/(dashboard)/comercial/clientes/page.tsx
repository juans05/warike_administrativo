'use client';

import React, { useEffect, useState } from 'react';
import { Briefcase, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { platformAccessApi, type SalesClient } from '../../../../lib/api-client';
import { can, usePlatformPermissions } from '../../../../lib/platform';
import { Badge, Button, EmptyState, PageHeader, type BadgeProps } from '../../../../components/ui';
import { SectionCard } from '../../../../components/admin/SectionCard';
import { LoadingRows, Table, Td, Tr } from '../../../../components/admin/Table';

const SUB_LABEL: Record<string, { label: string; tone: NonNullable<BadgeProps['tone']> }> = {
  active: { label: 'Activa', tone: 'success' },
  trialing: { label: 'En prueba', tone: 'primary' },
  past_due: { label: 'Pago vencido', tone: 'warning' },
  canceled: { label: 'Cancelada', tone: 'danger' },
};

export default function MisClientesPage() {
  const perms = usePlatformPermissions(true);
  const [clients, setClients] = useState<SalesClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformAccessApi.myClients().then(setClients).catch((e: Error) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  // El dueño entra (o se registra) y elige su plan; la venta queda a nombre del comercial asignado al local.
  const planLink = typeof window !== 'undefined' ? `${window.location.origin}/login?next=/suscripcion` : '';
  const canLink = can(perms, 'suscripciones.link');
  const showSeller = can(perms, 'oportunidades.todas');
  const message = (c: SalesClient) => `Hola, te comparto el link para activar Wuarikes en ${c.name}: ${planLink}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Mis clientes" subtitle="Tus locales asignados, su estado comercial y su suscripción." />
      <SectionCard title="Locales" subtitle={loading ? undefined : `${clients.length} local${clients.length === 1 ? '' : 'es'}`}>
        {loading ? (
          <LoadingRows />
        ) : clients.length === 0 ? (
          <EmptyState icon={Briefcase} headingLevel="h3" title="Aún no tienes locales asignados" description="Cuando te asignen un local en Oportunidades aparecerá aquí." />
        ) : (
          <Table columns={['Local', ...(showSeller ? ['Comercial'] : []), 'Estado', 'Suscripción', ...(canLink ? [{ label: 'Link de pago', align: 'right' as const }] : [])]}>
            {clients.map((c) => {
              const sub = c.subscriptionStatus ? SUB_LABEL[c.subscriptionStatus] ?? { label: c.subscriptionStatus, tone: 'neutral' as const } : null;
              return (
                <Tr key={c.id}>
                  <Td>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-text-muted">{c.address || '—'}{c.claimed ? '' : ' · sin dueño registrado'}</p>
                  </Td>
                  {showSeller && <Td className="text-sm">{c.salesUserName || '—'}</Td>}
                  <Td className="text-sm capitalize">{c.commercialStatus || 'nuevo'}</Td>
                  <Td>
                    {sub ? <Badge tone={sub.tone}>{sub.label}{c.tier ? ` · ${c.tier}` : ''}</Badge> : <Badge>Sin plan</Badge>}
                    {c.periodEnd && <p className="mt-1 text-xs text-text-muted">Hasta {new Date(c.periodEnd).toLocaleDateString('es-PE')}</p>}
                  </Td>
                  {canLink && (
                    <Td right className="whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" icon={Copy} aria-label={`Copiar link para ${c.name}`}
                          onClick={() => navigator.clipboard.writeText(message(c)).then(() => toast.success('Mensaje con link copiado'))}>
                          Copiar
                        </Button>
                        <a className="inline-flex min-h-9 items-center gap-1 rounded-control px-3 text-sm font-medium text-primary hover:bg-primary-soft"
                          href={`https://wa.me/?text=${encodeURIComponent(message(c))}`} target="_blank" rel="noreferrer" aria-label={`Enviar link por WhatsApp a ${c.name}`}>
                          <MessageCircle size={16} aria-hidden /> WhatsApp
                        </a>
                      </div>
                    </Td>
                  )}
                </Tr>
              );
            })}
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
