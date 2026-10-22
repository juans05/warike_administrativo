import { Card } from '../ui';
import { formatSeconds } from '../../lib/date-range';
import type { ReportsData } from '../../hooks/useReports';

const num = (n: number) => n.toLocaleString('es-PE');
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

export function PeriodSummary({ summary }: { summary: ReportsData['summary'] }) {
  const items: { label: string; value: string; note?: string }[] = [
    { label: 'Total de contactos', value: num(summary.totalContacts) },
    { label: 'Total de conversaciones', value: num(summary.totalConversations) },
    { label: 'Conversaciones por contacto', value: summary.avgConversationsPerContact.toFixed(1) },
    { label: 'Conversaciones atendidas', value: num(summary.attendedCount) },
    { label: 'Tasa de resolución', value: pct(summary.resolutionRate), note: `${num(summary.resolvedCount)} de ${num(summary.totalConversations)}` },
    { label: 'Tasa de atención', value: pct(summary.attentionRate), note: `${num(summary.attendedCount)} de ${num(summary.totalConversations)}` },
    { label: 'Tiempo prom. respuesta', value: formatSeconds(summary.avgResponseSeconds) },
    { label: 'Tiempo prom. resolución', value: formatSeconds(summary.avgResolutionSeconds) },
  ];

  return (
    <Card padding="lg">
      <h2 className="mb-4 text-base font-semibold text-text">Resumen del período</h2>
      <dl className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-sm text-text-muted">{item.label}</dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums text-text">{item.value}</dd>
            {item.note && <dd className="text-xs tabular-nums text-text-muted">{item.note}</dd>}
          </div>
        ))}
      </dl>
    </Card>
  );
}
