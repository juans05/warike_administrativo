'use client';

import React, { useEffect, useState } from 'react';
import { Broadcast, formatOffset, MetaTemplate } from '../../hooks/useBroadcasts';
import { businessApi } from '../../lib/api-client';
import { Sheet } from '../ui';

// Valores de ejemplo para mostrar cómo llega el mensaje.
const SAMPLE: Record<string, string> = {
  nombre: 'Luis', servicio: 'Corte clásico', profesional: 'Juan', fecha: 'lunes 3 de noviembre',
  hora: '4:00 pm', local: 'tu local', enlace: 'https://wuarike.com/c/…',
};
const SEGMENT_LABEL: Record<string, string> = {
  all: 'Todos', excel: 'Lista de Excel', loyalty: 'Fidelización', inactive: 'Inactivos (+30 días)', normal: 'Sin tarjeta de fidelización', vip: 'VIP',
};

function renderMessage(b: Broadcast, templates: MetaTemplate[]) {
  const body = templates.find(t => t.name === b.templateName)?.body;
  if (!body) return b.templateBody;
  const vars = (b.bodyVariables ?? []).map(v => v.replace(/\{(\w+)\}/g, (m, k) => SAMPLE[k.toLowerCase()] ?? m));
  return body.replace(/\{\{(\d+)\}\}/g, (m, n) => vars[Number(n) - 1] || m);
}

type Send = Awaited<ReturnType<typeof businessApi.getReminderSends>>[number];

/** Lo que envía una campaña: el mensaje con datos de ejemplo, a quién y cómo le fue. */
export function CampaignView({ broadcast, templates, onClose }: { broadcast: Broadcast | null; templates: MetaTemplate[]; onClose: () => void }) {
  const [sends, setSends] = useState<Send[] | null>(null);
  const reminder = broadcast?.kind === 'reminder';

  useEffect(() => {
    setSends(null);
    if (broadcast && reminder) businessApi.getReminderSends(broadcast.id).then(setSends).catch(() => setSends([]));
  }, [broadcast?.id, reminder]);

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right font-medium text-text">{value}</dd>
    </div>
  );

  return (
    <Sheet open={!!broadcast} onClose={onClose} title={broadcast?.campaignName ?? 'Campaña'}>
      {broadcast && (
        <div className="space-y-5 px-4 py-4">
          <section className="space-y-1.5">
            <p className="text-sm font-medium text-text">Mensaje {broadcast.templateName && <span className="text-text-muted">· plantilla {broadcast.templateName}</span>}</p>
            <p className="whitespace-pre-wrap rounded-control border border-border bg-background px-4 py-3 text-sm text-text">{renderMessage(broadcast, templates)}</p>
            <p className="text-xs text-text-muted">Con datos de ejemplo; cada persona recibe los suyos.</p>
          </section>

          <dl className="divide-y divide-border">
            {row('Número', broadcast.whatsappNumber?.phoneNumber ?? '—')}
            {reminder
              ? row('Se envía', `${formatOffset(broadcast.reminderOffsetMin)} antes de cada cita`)
              : row('Segmento', SEGMENT_LABEL[broadcast.segmentFilter?.type ?? 'all'] ?? broadcast.segmentFilter?.type)}
            {row('Enviados', `${broadcast.messagesSent}${broadcast.totalRecipients ? ` de ${broadcast.totalRecipients}` : ''}`)}
            {!!broadcast.messagesFailed && row('Fallidos', broadcast.messagesFailed)}
          </dl>

          {reminder && (
            <section className="space-y-1.5">
              <p className="text-sm font-medium text-text">Últimos envíos</p>
              {sends === null ? <p className="text-sm text-text-muted">Cargando…</p>
                : sends.length === 0 ? <p className="text-sm text-text-muted">Todavía no se envió ningún recordatorio.</p>
                : (
                  <ul className="divide-y divide-border text-sm">
                    {sends.map((s, i) => (
                      <li key={i} className="flex justify-between gap-3 py-2">
                        <span className="min-w-0 truncate text-text">{s.customerName ?? 'Cita'}{s.serviceName ? ` · ${s.serviceName}` : ''}</span>
                        <span className={`shrink-0 tabular-nums ${s.ok === false ? 'text-danger' : 'text-text-muted'}`}>
                          {s.ok === false ? 'Falló · ' : ''}{new Date(s.sentAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
            </section>
          )}
        </div>
      )}
    </Sheet>
  );
}
