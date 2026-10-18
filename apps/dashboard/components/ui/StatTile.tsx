import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from './Card';

export type StatTileProps = {
  label: string;
  value: ReactNode;
  trend?: { value: string; positive: boolean };
};

export function StatTile({ label, value, trend }: StatTileProps) {
  const TrendIcon = trend?.positive ? TrendingUp : TrendingDown;
  return (
    <Card padding="md">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-text">{value}</p>
      {trend && (
        <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-success' : 'text-danger'}`}>
          <TrendIcon size={16} aria-hidden />
          {trend.value}
        </p>
      )}
    </Card>
  );
}
