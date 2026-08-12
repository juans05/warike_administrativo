import { ReportsData } from '../hooks/useReports';
import { STATUS_LABELS } from './report-colors';
import { formatSeconds } from './date-range';

function csvEscape(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map(row => row.map(csvEscape).join(',')).join('\n');
}

export function exportReportToCsv(data: ReportsData) {
  const sections: string[] = [];

  sections.push(toCsv([
    ['Reporte Wuarikes', `${data.range.from} a ${data.range.to}`],
  ]));

  sections.push(toCsv([
    [],
    ['KPIs', 'Valor', 'Período anterior', 'Variación %'],
    ['Contactos', data.kpis.contacts.value, data.kpis.contacts.previousValue, data.kpis.contacts.changePct],
    ['Conversaciones', data.kpis.conversations.value, data.kpis.conversations.previousValue, data.kpis.conversations.changePct],
    ['Atendidas', data.kpis.attended.value, data.kpis.attended.previousValue, data.kpis.attended.changePct],
    ['Sin asignar', data.kpis.unassigned.value, data.kpis.unassigned.previousValue, data.kpis.unassigned.changePct],
    ['Pendientes', data.kpis.pending.value, data.kpis.pending.previousValue, data.kpis.pending.changePct],
    ['Resueltas', data.kpis.resolved.value, data.kpis.resolved.previousValue, data.kpis.resolved.changePct],
    ['Tiempo promedio de respuesta', formatSeconds(data.responseTime.value), formatSeconds(data.responseTime.previousValue), data.responseTime.changePct],
    ['Tiempo promedio de resolución', formatSeconds(data.resolutionTime.value), formatSeconds(data.resolutionTime.previousValue), data.resolutionTime.changePct],
  ]));

  sections.push(toCsv([
    [],
    ['Conversaciones por día'],
    ['Fecha', 'Total', 'Atendidas', 'Pendientes', 'Resueltas'],
    ...data.conversationsByDay.map(d => [d.date, d.total, d.attended, d.pending, d.resolved]),
  ]));

  sections.push(toCsv([
    [],
    ['Inicio de conversaciones por hora'],
    ['Hora', 'Conversaciones'],
    ...data.conversationsByHour.map(h => [`${String(h.hour).padStart(2, '0')}:00`, h.count]),
  ]));

  sections.push(toCsv([
    [],
    ['Conversaciones por teléfono'],
    ['Teléfono', 'Contacto', 'Conversaciones', 'Última conversación', 'Estado'],
    ...data.conversationsByPhone.map(p => [p.phone, p.contactName || '', p.conversations, p.lastConversationAt, STATUS_LABELS[p.status]]),
  ]));

  sections.push(toCsv([
    [],
    ['Rendimiento por agente'],
    ['Agente', 'Conversaciones', 'Atendidas', 'Resueltas', 'Pendientes', 'T. respuesta', 'T. resolución'],
    ...data.agentRanking.map(a => [
      a.fullName,
      a.conversations,
      a.attended,
      a.resolved,
      a.pending,
      a.avgResponseSeconds != null ? formatSeconds(a.avgResponseSeconds) : '',
      a.avgResolutionSeconds != null ? formatSeconds(a.avgResolutionSeconds) : '',
    ]),
  ]));

  const csv = '﻿' + sections.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-wuarikes-${data.range.from.slice(0, 10)}-a-${data.range.to.slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
