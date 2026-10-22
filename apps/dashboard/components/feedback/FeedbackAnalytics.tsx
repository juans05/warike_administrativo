'use client';

import { BarChart3 } from 'lucide-react';
import { Card, EmptyState, Select, Skeleton, StatTile } from '../ui';
import { shortDate } from '../reputation/InboxRow';
import { ReviewerAvatar } from '../reputation/ReviewerAvatar';
import { Stars } from '../reputation/Stars';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';

const RANGES = [
  { key: 'today', label: 'Hoy' },
  { key: 'month', label: 'Este mes' },
  { key: 'year', label: 'Este año' },
];

export function FeedbackAnalytics({ data, loading, range, onRangeChange }: {
  data: any;
  loading: boolean;
  range: string;
  onRangeChange(range: string): void;
}) {
  const { customers } = useCustomerLabels();
  if (loading) {
    return (
      <div role="status" aria-label="Cargando" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton className="w-1/2" />
            <Skeleton className="mt-3 h-7 w-1/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="Sin datos aún"
          description={`Las analíticas aparecerán cuando tus ${customers} empiecen a dejar reseñas.`}
        />
      </Card>
    );
  }

  const tiles = [
    { label: 'Calificación', value: data.rating?.average?.toFixed(1) || '—' },
    { label: 'Total de opiniones', value: data.rating?.total?.toLocaleString() || '0' },
    { label: 'NPS', value: data.nps?.score || '—' },
    { label: 'Promotores', value: data.nps?.promoters || '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="sm:w-56">
        <Select label="Período" value={range} onChange={(e) => onRangeChange(e.target.value)}>
          {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => <StatTile key={t.label} label={t.label} value={t.value} />)}
      </div>

      {data.recentReviews && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-text">Últimas reseñas públicas</h2>
          <Card padding="sm" className="p-0">
            <ul className="divide-y divide-border">
              {data.recentReviews.map((review: any, i: number) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3">
                  <ReviewerAvatar name={review.userName} photoUrl={review.avatarUrl} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-text">{review.userName}</p>
                      <p className="shrink-0 text-xs text-text-muted">{shortDate(review.date)}</p>
                    </div>
                    <Stars value={review.rating} />
                    <p className="text-sm leading-relaxed text-text-muted">{review.comment || 'Sin comentarios.'}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
