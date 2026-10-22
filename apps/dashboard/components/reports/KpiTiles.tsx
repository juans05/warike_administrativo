import { Card, Skeleton, StatTile } from '../ui';
import { formatSeconds } from '../../lib/date-range';
import type { ChangeMetric, ReportsData } from '../../hooks/useReports';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';

const PERIOD = 'vs. período anterior';

/** `invert`: en esa métrica subir es malo (sin asignar, pendientes). */
function countTrend(metric: ChangeMetric, invert = false) {
  return {
    value: `${metric.changePct >= 0 ? '+' : ''}${metric.changePct}% ${PERIOD}`,
    positive: invert ? !metric.isPositive : metric.isPositive,
  };
}

/** En los tiempos, que baje es bueno: `isPositive` ya viene en ese sentido desde la API. */
function timeTrend(metric: ChangeMetric) {
  const change = Math.abs(metric.changePct);
  return {
    value: change === 0 ? `Igual que el ${PERIOD.replace('vs. ', '')}` : `${change}% ${metric.isPositive ? 'más rápido' : 'más lento'} ${PERIOD}`,
    positive: change === 0 ? true : metric.isPositive,
  };
}

function TileSkeleton() {
  return (
    <Card padding="md" role="status" aria-label="Cargando">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-3 h-7 w-1/2" />
      <Skeleton className="mt-3 h-3 w-1/3" />
    </Card>
  );
}

export function KpiTiles({ data }: { data: ReportsData | null }) {
  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <TileSkeleton key={i} />)}
      </div>
    );
  }

  const { kpis } = data;
  const tiles: { label: string; metric: ChangeMetric; hint: string; invert?: boolean }[] = [
    { label: 'Contactos', metric: kpis.contacts, hint: 'Contactos nuevos registrados en el período seleccionado.' },
    { label: 'Conversaciones', metric: kpis.conversations, hint: 'Conversaciones con actividad (mensajes) en el período.' },
    { label: 'Atendidas', metric: kpis.attended, hint: 'Conversaciones tomadas por un agente humano.' },
    { label: 'Sin asignar', metric: kpis.unassigned, hint: 'Conversaciones abiertas que todavía no tiene ningún agente.', invert: true },
    { label: 'Pendientes', metric: kpis.pending, hint: 'Conversaciones marcadas como pendientes de atención.', invert: true },
    { label: 'Resueltas', metric: kpis.resolved, hint: 'Conversaciones cerradas en el período.' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {tiles.map((t) => (
        <div key={t.label} title={t.hint}>
          <StatTile label={t.label} value={t.metric.value.toLocaleString('es-PE')} trend={countTrend(t.metric, t.invert)} />
        </div>
      ))}
    </div>
  );
}

/** Los dos tiempos de atención, con su explicación visible bajo el número. */
export function ResponseTimeTiles({ data }: { data: ReportsData | null }) {
  const { customer } = useCustomerLabels();
  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TileSkeleton />
        <TileSkeleton />
      </div>
    );
  }

  const tiles = [
    { label: 'Tiempo promedio de respuesta', metric: data.responseTime, note: `Desde que el ${customer} inicia la conversación hasta la primera respuesta.` },
    { label: 'Tiempo promedio de resolución', metric: data.resolutionTime, note: 'Desde el inicio de la conversación hasta que fue resuelta.' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {tiles.map((t) => (
        <StatTile
          key={t.label}
          label={t.label}
          value={
            <>
              {formatSeconds(t.metric.value)}
              <span className="mt-1 block text-xs font-normal text-text-muted">{t.note}</span>
            </>
          }
          trend={timeTrend(t.metric)}
        />
      ))}
    </div>
  );
}
