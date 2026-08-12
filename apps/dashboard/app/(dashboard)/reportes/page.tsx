'use client';

import React, { useMemo, useState } from 'react';
import { Users, MessagesSquare, UserCheck, UserX, Clock, CheckCircle2, Download, RefreshCw, Timer, Gauge } from 'lucide-react';
import { useReports } from '../../../hooks/useReports';
import type { ConversationBucket } from '../../../hooks/useReports';
import { DateRangeSelector } from '../../../components/reports/DateRangeSelector';
import { StatTile, StatTileSkeleton } from '../../../components/reports/StatTile';
import { ConversationsByDayChart } from '../../../components/reports/ConversationsByDayChart';
import { ConversationsByHourChart } from '../../../components/reports/ConversationsByHourChart';
import { StatusDonutChart } from '../../../components/reports/StatusDonutChart';
import { ConversationsByPhoneTable } from '../../../components/reports/ConversationsByPhoneTable';
import { AgentRankingTable } from '../../../components/reports/AgentRankingTable';
import { FiltersPanel } from '../../../components/reports/FiltersPanel';
import { formatSeconds } from '../../../lib/date-range';
import { exportReportToCsv } from '../../../lib/reports-export';
import { DELTA_POSITIVE, DELTA_NEGATIVE } from '../../../lib/report-colors';

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function ReportesPage() {
  const {
    preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo,
    range, data, loading, error, refresh,
  } = useReports();
  const [statusFilter, setStatusFilter] = useState<ConversationBucket[]>([]);

  const filteredPhoneRows = useMemo(() => {
    if (!data) return [];
    if (statusFilter.length === 0) return data.conversationsByPhone;
    return data.conversationsByPhone.filter(r => statusFilter.includes(r.status));
  }, [data, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reportes</h1>
          <p className="text-gray-500 mt-1 font-medium">Analiza el rendimiento de tus conversaciones y atención al cliente.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            title="Actualizar"
            className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <DateRangeSelector
            preset={preset}
            onChangePreset={setPreset}
            customFrom={customFrom}
            customTo={customTo}
            onChangeCustomFrom={setCustomFrom}
            onChangeCustomTo={setCustomTo}
            range={range}
          />
          <button
            type="button"
            disabled={!data}
            onClick={() => data && exportReportToCsv(data)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar reporte
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <FiltersPanel statusFilter={statusFilter} onChangeStatusFilter={setStatusFilter} />

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading || !data ? (
          Array.from({ length: 6 }).map((_, i) => <StatTileSkeleton key={i} />)
        ) : (
          <>
            <StatTile
              icon={<Users className="w-4 h-4" />}
              label="Contactos"
              value={data.kpis.contacts.value.toLocaleString('es-PE')}
              changePct={data.kpis.contacts.changePct}
              isPositive={data.kpis.contacts.isPositive}
              tooltip="Contactos nuevos registrados en el período seleccionado."
            />
            <StatTile
              icon={<MessagesSquare className="w-4 h-4" />}
              label="Conversaciones"
              value={data.kpis.conversations.value.toLocaleString('es-PE')}
              changePct={data.kpis.conversations.changePct}
              isPositive={data.kpis.conversations.isPositive}
              tooltip="Total de conversaciones iniciadas en el período."
            />
            <StatTile
              icon={<UserCheck className="w-4 h-4" />}
              label="Atendidas"
              value={data.kpis.attended.value.toLocaleString('es-PE')}
              changePct={data.kpis.attended.changePct}
              isPositive={data.kpis.attended.isPositive}
              tooltip="Conversaciones tomadas por un agente humano."
              accentClassName="bg-blue-50 text-blue-600"
            />
            <StatTile
              icon={<UserX className="w-4 h-4" />}
              label="Sin asignar"
              value={data.kpis.unassigned.value.toLocaleString('es-PE')}
              changePct={data.kpis.unassigned.changePct}
              isPositive={!data.kpis.unassigned.isPositive}
              tooltip="Conversaciones abiertas que todavía no tiene ningún agente."
              accentClassName="bg-orange-50 text-orange-600"
            />
            <StatTile
              icon={<Clock className="w-4 h-4" />}
              label="Pendientes"
              value={data.kpis.pending.value.toLocaleString('es-PE')}
              changePct={data.kpis.pending.changePct}
              isPositive={!data.kpis.pending.isPositive}
              tooltip="Conversaciones marcadas como pendientes de atención."
              accentClassName="bg-amber-50 text-amber-600"
            />
            <StatTile
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Resueltas"
              value={data.kpis.resolved.value.toLocaleString('es-PE')}
              changePct={data.kpis.resolved.changePct}
              isPositive={data.kpis.resolved.isPositive}
              tooltip="Conversaciones cerradas en el período."
              accentClassName="bg-emerald-50 text-emerald-600"
            />
          </>
        )}
      </div>

      {/* Conversaciones por día + Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConversationsByDayChart data={data?.conversationsByDay || []} loading={loading} />
        </div>
        <StatusDonutChart data={data?.statusDistribution || []} loading={loading} />
      </div>

      {/* Inicio de conversaciones por hora */}
      <ConversationsByHourChart data={data?.conversationsByHour || []} loading={loading} />

      {/* Conversaciones por teléfono */}
      <ConversationsByPhoneTable data={filteredPhoneRows} loading={loading} />

      {/* Rendimiento de atención */}
      <div>
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Rendimiento de atención</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading || !data ? (
            <>
              <StatTileSkeleton />
              <StatTileSkeleton />
            </>
          ) : (
            <>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Timer className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Tiempo promedio de respuesta</p>
                </div>
                <p className="text-3xl font-black text-gray-900">{formatSeconds(data.responseTime.value)}</p>
                <p className="text-xs text-gray-400 mt-1">Desde que el cliente inicia la conversación hasta la primera respuesta.</p>
                <div className="flex items-center gap-1 mt-2" style={{ color: data.responseTime.isPositive ? DELTA_POSITIVE : DELTA_NEGATIVE }}>
                  <span className="text-xs font-bold">
                    {data.responseTime.isPositive ? '↓' : '↑'} {Math.abs(data.responseTime.changePct)}% vs. período anterior
                  </span>
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Tiempo promedio de resolución</p>
                </div>
                <p className="text-3xl font-black text-gray-900">{formatSeconds(data.resolutionTime.value)}</p>
                <p className="text-xs text-gray-400 mt-1">Desde el inicio de la conversación hasta que fue resuelta.</p>
                <div className="flex items-center gap-1 mt-2" style={{ color: data.resolutionTime.isPositive ? DELTA_POSITIVE : DELTA_NEGATIVE }}>
                  <span className="text-xs font-bold">
                    {data.resolutionTime.isPositive ? '↓' : '↑'} {Math.abs(data.resolutionTime.changePct)}% vs. período anterior
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Resumen del período */}
      {data && !loading && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Resumen del período</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total de contactos</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{data.summary.totalContacts.toLocaleString('es-PE')}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total de conversaciones</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{data.summary.totalConversations.toLocaleString('es-PE')}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Conversaciones por contacto</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{data.summary.avgConversationsPerContact.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Conversaciones atendidas</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{data.summary.attendedCount.toLocaleString('es-PE')}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tasa de resolución</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{pct(data.summary.resolutionRate)}</p>
              <p className="text-[11px] text-gray-400">{data.summary.resolvedCount.toLocaleString('es-PE')} de {data.summary.totalConversations.toLocaleString('es-PE')}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tasa de atención</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{pct(data.summary.attentionRate)}</p>
              <p className="text-[11px] text-gray-400">{data.summary.attendedCount.toLocaleString('es-PE')} de {data.summary.totalConversations.toLocaleString('es-PE')}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tiempo prom. respuesta</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{formatSeconds(data.summary.avgResponseSeconds)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tiempo prom. resolución</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{formatSeconds(data.summary.avgResolutionSeconds)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ranking de agentes */}
      <AgentRankingTable data={data?.agentRanking || []} loading={loading} />
    </div>
  );
}
