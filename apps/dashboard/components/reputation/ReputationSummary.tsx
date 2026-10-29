'use client';

import Link from 'next/link';
import { PartyPopper, ShieldAlert, Smartphone } from 'lucide-react';
import { Badge, Card, EmptyState, Skeleton, StatTile, buttonStyles } from '../ui';
import ReviewGoal from '../ReviewGoal';
import TeamRanking from '../TeamRanking';
import SeoScore from '../SeoScore';
import { Stars } from './Stars';
import type { ReputationStats } from './useReputationStats';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';

function Bar({ label, percent, barClass }: { label: string; percent: number; barClass: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">{label}</span>
        <span className="font-semibold tabular-nums text-text">{percent}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function IconBadge({ icon: Icon }: { icon: typeof Smartphone }) {
  return (
    <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
      <Icon size={20} />
    </div>
  );
}

/** Pestaña "Resumen": cómo va la reputación del negocio (escaneos, quejas privadas y meta de reseñas). */
export function ReputationSummary({ placeId, stats, recentComplaints, isLoading, googleReviewCount }: {
  placeId: string;
  stats: ReputationStats;
  recentComplaints: any[];
  isLoading: boolean;
  googleReviewCount: number;
}) {
  const { customers } = useCustomerLabels();
  const tiles = [
    { label: 'Escaneos NFC', value: stats.totalTaps.toLocaleString() },
    { label: 'Calificación en Google', value: stats.ratingAverage.toFixed(1) },
    { label: 'Reseñas a Google', value: stats.reviewsSentToGoogle },
    { label: 'Comentarios privados', value: stats.disastersAvoided },
    { label: 'Comentarios de Instagram', value: stats.totalComments },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {isLoading
          ? tiles.map((t) => (
              <Card key={t.label} role="status" aria-label="Cargando">
                <Skeleton className="w-2/3" />
                <Skeleton className="mt-3 h-7 w-1/3" />
              </Card>
            ))
          : tiles.map((t) => <StatTile key={t.label} label={t.label} value={t.value} />)}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding="lg" className="space-y-5">
          <div className="flex items-start gap-3">
            <IconBadge icon={Smartphone} />
            <div>
              <h3 className="text-base font-semibold text-text">Escaneos y filtrado</h3>
              <p className="text-sm text-text-muted">Cómo llegan tus {customers} a calificarte.</p>
            </div>
          </div>
          <Bar label="NFC" percent={stats.nfcPercent} barClass="bg-primary" />
          <Bar label="QR" percent={stats.qrPercent} barClass="bg-text-muted" />
          <div className="rounded-card bg-success/10 p-4 text-center">
            <p className="text-sm font-medium text-success">Tasa de conversión</p>
            <p className="text-2xl font-semibold tabular-nums text-success">{stats.conversionRate}%</p>
            <p className="text-sm text-text-muted">de escaneos que terminan en una reseña en Google</p>
          </div>
          <p className="text-sm text-text-muted">
            Todos los {customers} ven el enlace a Google Maps (Google prohíbe filtrar reseñas por calificación). Quienes califican de 1 a 3 estrellas además pueden dejar un mensaje privado al equipo.
          </p>
        </Card>

        <Card padding="lg" className="space-y-5">
          <div className="flex items-start gap-3">
            <IconBadge icon={ShieldAlert} />
            <div>
              <h3 className="text-base font-semibold text-text">Quejas privadas</h3>
              <p className="text-sm text-text-muted">Críticas que te llegaron a ti antes que a Google.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card bg-danger/10 p-4 text-center">
              <p className="text-2xl font-semibold tabular-nums text-danger">{stats.pendingComplaints}</p>
              <p className="text-sm font-medium text-danger">Pendientes</p>
            </div>
            <div className="rounded-card bg-success/10 p-4 text-center">
              <p className="text-2xl font-semibold tabular-nums text-success">{stats.resolvedComplaints}</p>
              <p className="text-sm font-medium text-success">Resueltas</p>
            </div>
          </div>

          {recentComplaints.length === 0 ? (
            <EmptyState icon={PartyPopper} title="Sin quejas recientes" headingLevel="h4" />
          ) : (
            <ul className="divide-y divide-border">
              {recentComplaints.map((c) => (
                <li key={c.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Stars value={c.rating} />
                    <p className="truncate text-sm text-text">{c.comment || 'Sin comentario'}</p>
                    <p className="text-xs text-text-muted">{c.customerName || 'Anónimo'}</p>
                  </div>
                  {c.status === 'pending' ? <Badge tone="danger">Pendiente</Badge> : <Badge tone="success">Atendida</Badge>}
                </li>
              ))}
            </ul>
          )}

          <Link href="/feedback" className={buttonStyles('secondary', 'md', 'w-full')}>Ver todas las quejas</Link>
        </Card>
      </div>

      <SeoScore placeId={placeId} />
      <ReviewGoal placeId={placeId} rating={stats.ratingAverage} total={googleReviewCount} />
      <TeamRanking placeId={placeId} />
    </div>
  );
}
