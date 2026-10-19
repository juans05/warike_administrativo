'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionApi } from '../../../lib/api-client';
import { Badge, EmptyState, PageHeader, Skeleton, StatTile, type BadgeProps } from '../../../components/ui';
import { Pager } from '../../../components/clientes/parts';
import { SectionCard } from '../../../components/admin/SectionCard';
import { LoadingRows, Table, Td, Tr } from '../../../components/admin/Table';

interface SubscriptionRecord {
  id: string;
  userId: string;
  status: string;
  amount: number;
  currency: string;
  cardLast4: string;
  cardBrand: string;
  currentPeriodEnd: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
  place: {
    name: string;
  };
}

interface Stats {
  activeSubscriptions: number;
  canceledSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  planAmount: number;
}

const soles = (n: number) => `S/ ${n.toLocaleString('es-PE')}`;

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, NonNullable<BadgeProps['tone']>> = { active: 'success', past_due: 'danger', canceled: 'neutral' };
  const labels: Record<string, string> = { active: 'Activa', canceled: 'Cancelada', past_due: 'Vencida' };
  return (
    <Badge tone={tones[status] ?? 'neutral'}>
      {status === 'active' && <Check size={16} aria-hidden />}
      {status === 'past_due' && <AlertCircle size={16} aria-hidden />}
      {labels[status] ?? status}
    </Badge>
  );
}

export default function SuscripcionesPage() {
  const [subs, setSubs] = useState<SubscriptionRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subsData, statsData] = await Promise.all([
        subscriptionApi.adminGetAll(page),
        subscriptionApi.adminGetStats(),
      ]);
      setSubs(subsData.data);
      setTotalPages(subsData.meta.totalPages);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading subscriptions', err);
      toast.error('No se pudieron cargar las suscripciones');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Suscripciones" subtitle="Ingresos recurrentes y estado de pagos de la plataforma." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats ? (
          <>
            <StatTile label="Suscripciones activas" value={stats.activeSubscriptions} />
            <StatTile label="Ingresos este mes" value={soles(stats.monthlyRevenue)} />
            <StatTile label="Ingresos totales" value={soles(stats.totalRevenue)} />
            <StatTile label="Canceladas" value={stats.canceledSubscriptions} />
          </>
        ) : (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)
        )}
      </div>

      <SectionCard title="Todas las suscripciones" subtitle={stats ? `${stats.activeSubscriptions} activas` : undefined}>
        {loading && subs.length === 0 ? (
          <LoadingRows rows={5} />
        ) : subs.length === 0 ? (
          <EmptyState icon={CreditCard} headingLevel="h3" title="No hay suscripciones registradas aún" description="Cuando un local se suscriba, lo verás aquí." />
        ) : (
          <div aria-busy={loading}>
            <Table columns={['Sede', 'Usuario', 'Estado', 'Tarjeta', 'Próximo cobro', { label: 'Monto/mes', align: 'right' }]}>
              {subs.map((sub) => (
                <Tr key={sub.id}>
                  <Td className="font-semibold">{sub.place?.name || '—'}</Td>
                  <Td>
                    <p>{sub.user?.fullName || '—'}</p>
                    <p className="text-xs text-text-muted">{sub.user?.email || '—'}</p>
                  </Td>
                  <Td><StatusBadge status={sub.status} /></Td>
                  <Td className="whitespace-nowrap">{sub.cardLast4 ? `${sub.cardBrand} •••• ${sub.cardLast4}` : <span className="text-text-muted">—</span>}</Td>
                  <Td className="whitespace-nowrap">
                    {sub.status === 'active' && sub.currentPeriodEnd ? fmt(sub.currentPeriodEnd) : <span className="text-text-muted">—</span>}
                  </Td>
                  <Td right className="whitespace-nowrap font-semibold">S/ {(sub.amount / 100).toFixed(0)}</Td>
                </Tr>
              ))}
            </Table>
          </div>
        )}
        <Pager page={page} totalPages={totalPages} onPage={setPage} />
      </SectionCard>
    </div>
  );
}
