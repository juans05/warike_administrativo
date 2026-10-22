'use client';

import { Inbox, TrendingUp } from 'lucide-react';
import { EmptyState, cn } from '../../ui';
import { InlineSelect } from '../InlineSelect';
import { SectionCard } from '../SectionCard';
import { LoadingRows, Table, Td, Tr } from '../Table';

export interface Opportunity {
  id: string;
  name: string;
  category: { name: string } | null;
  district: { district: string } | null;
  checkinsCount: number;
  favoritesCount: number;
  totalReviews: number;
  score: number;
  commercialStatus: string | null;
  assignedSalesUserId: string | null;
}

export interface WuarikesHereRequest {
  id: string;
  restaurantName: string;
  district: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  requestedBy: { fullName: string; email: string } | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'afiliado', label: 'Afiliado' },
  { value: 'no_interesado', label: 'No interesado' },
];

// El estado siempre se lee en el texto de la opción; el color solo refuerza los dos extremos.
const STATUS_STYLES: Record<string, string> = {
  afiliado: 'border-success/50 text-success',
  no_interesado: 'text-text-muted',
};

function StatusSelect({ label, value, onChange }: { label: string; value: string | null; onChange(status: string): void }) {
  const current = value || 'nuevo';
  return (
    <InlineSelect aria-label={label} value={current} onChange={(e) => onChange(e.target.value)} className={cn('font-medium', STATUS_STYLES[current])}>
      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </InlineSelect>
  );
}

/** Locales sin dueño que ya generan actividad real, ordenados por puntaje, para que el equipo comercial los trabaje. */
export function OpportunitiesSection({ opportunities, loading, salesUsers, onAssign, onStatus }: {
  opportunities: Opportunity[];
  loading: boolean;
  salesUsers: { id: string; fullName: string }[];
  onAssign(placeId: string, salesUserId: string): void;
  onStatus(placeId: string, status: string): void;
}) {
  return (
    <SectionCard
      title="Actividad sin reclamar"
      subtitle={`${opportunities.length} locales ya generan check-ins y favoritos reales en Wuarikes, pero nadie los administra`}
    >
      {loading ? (
        <LoadingRows />
      ) : opportunities.length === 0 ? (
        <EmptyState icon={TrendingUp} headingLevel="h3" title="No hay oportunidades por ahora" description="Cuando un local sin dueño tenga actividad, aparecerá aquí." />
      ) : (
        <Table columns={['Local', 'Actividad', { label: 'Puntaje', align: 'right' }, 'Vendedor', 'Estado']}>
          {opportunities.map((o) => (
            <Tr key={o.id}>
              <Td>
                <p className="font-semibold">{o.name}</p>
                <p className="text-xs text-text-muted">{o.category?.name || '—'} · {o.district?.district || '—'}</p>
              </Td>
              <Td className="text-xs text-text-muted">{o.checkinsCount} check-ins · {o.favoritesCount} favoritos · {o.totalReviews} reseñas</Td>
              <Td right className="text-base font-semibold text-primary">{o.score}</Td>
              <Td>
                <InlineSelect aria-label={`Comercial de ${o.name}`} value={o.assignedSalesUserId ?? ''} onChange={(e) => onAssign(o.id, e.target.value)}>
                  <option value="">Sin vendedor</option>
                  {salesUsers.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </InlineSelect>
              </Td>
              <Td><StatusSelect label={`Estado comercial de ${o.name}`} value={o.commercialStatus} onChange={(status) => onStatus(o.id, status)} /></Td>
            </Tr>
          ))}
        </Table>
      )}
    </SectionCard>
  );
}

/** Pedidos de "Quiero Wuarikes aquí": negocios que la gente quiere ver en la plataforma. */
export function RequestsSection({ requests, loading, onStatus }: {
  requests: WuarikesHereRequest[];
  loading: boolean;
  onStatus(id: string, status: string): void;
}) {
  return (
    <SectionCard title="Quiero Wuarikes aquí" subtitle={`${requests.length} pedidos de negocios que todavía no están en la plataforma`}>
      {loading ? (
        <LoadingRows />
      ) : requests.length === 0 ? (
        <EmptyState icon={Inbox} headingLevel="h3" title="Nadie ha pedido ninguno todavía" description="Los pedidos de los usuarios aparecerán aquí." />
      ) : (
        <Table columns={['Negocio pedido', 'Pedido por', 'Estado']}>
          {requests.map((r) => (
            <Tr key={r.id}>
              <Td>
                <p className="font-semibold">{r.restaurantName}</p>
                <p className="text-xs text-text-muted">{[r.district, r.address].filter(Boolean).join(' · ') || '—'}</p>
                {r.notes && <p className="mt-1 text-xs text-text-muted">{r.notes}</p>}
              </Td>
              <Td>
                <p>{r.requestedBy?.fullName || '—'}</p>
                <p className="text-xs text-text-muted">{r.requestedBy?.email}</p>
              </Td>
              <Td><StatusSelect label={`Estado del pedido de ${r.restaurantName}`} value={r.status} onChange={(status) => onStatus(r.id, status)} /></Td>
            </Tr>
          ))}
        </Table>
      )}
    </SectionCard>
  );
}
