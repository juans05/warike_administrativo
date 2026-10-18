'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { useReports } from '../../../hooks/useReports';
import { useRestaurant } from '../../../context/RestaurantContext';
import { teamApi } from '../../../lib/api-client';
import { exportReportToCsv } from '../../../lib/reports-export';
import { Button, PageHeader } from '../../../components/ui';
import { DateRangeSelector } from '../../../components/reports/DateRangeSelector';
import { FiltersPanel } from '../../../components/reports/FiltersPanel';
import { KpiTiles, ResponseTimeTiles } from '../../../components/reports/KpiTiles';
import { ConversationsByDayChart } from '../../../components/reports/ConversationsByDayChart';
import { ConversationsByHourChart } from '../../../components/reports/ConversationsByHourChart';
import { StatusDonutChart } from '../../../components/reports/StatusDonutChart';
import { ConversationsByPhoneTable } from '../../../components/reports/ConversationsByPhoneTable';
import { AgentRankingTable } from '../../../components/reports/AgentRankingTable';
import { PeriodSummary } from '../../../components/reports/PeriodSummary';
import { useCustomerLabels } from '../../../hooks/useCustomerLabels';

export default function ReportesPage() {
  const { activePlaceId } = useRestaurant();
  const { customers } = useCustomerLabels();
  const {
    preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo,
    statusFilter, setStatusFilter, agentFilter, setAgentFilter, clearFilters,
    range, data, loading, error, refresh,
  } = useReports();
  const [agents, setAgents] = useState<{ userId: string; fullName: string }[]>([]);

  useEffect(() => {
    if (!activePlaceId) return;
    teamApi.list(activePlaceId)
      .then((res) => setAgents((res.data || []).map((m: any) => ({ userId: m.userId, fullName: m.fullName }))))
      .catch(() => setAgents([]));
  }, [activePlaceId]);

  // Mientras carga o si falló, las piezas muestran su esqueleto; el error va arriba, con ícono y texto.
  const ready = loading ? null : data;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Reportes"
        subtitle={`Analiza el rendimiento de tus conversaciones y la atención a tus ${customers}.`}
        action={
          <Button icon={Download} disabled={!data} onClick={() => data && exportReportToCsv(data)}>
            Exportar reporte
          </Button>
        }
      />

      <div className="-mt-2 flex flex-wrap items-center gap-2">
        <DateRangeSelector
          preset={preset}
          onChangePreset={setPreset}
          customFrom={customFrom}
          customTo={customTo}
          onChangeCustomFrom={setCustomFrom}
          onChangeCustomTo={setCustomTo}
          range={range}
        />
        <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={() => refresh()}>
          Actualizar
        </Button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-card border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
          <AlertTriangle size={20} aria-hidden className="shrink-0" />
          {error}
        </div>
      )}

      <FiltersPanel
        statusFilter={statusFilter}
        onChangeStatusFilter={setStatusFilter}
        agentFilter={agentFilter}
        onChangeAgentFilter={setAgentFilter}
        agents={agents}
        onClear={clearFilters}
      />

      <KpiTiles data={ready} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ConversationsByDayChart data={data?.conversationsByDay || []} loading={loading} />
        </div>
        <StatusDonutChart data={data?.statusDistribution || []} loading={loading} />
      </div>

      <ConversationsByHourChart data={data?.conversationsByHour || []} loading={loading} />

      <ConversationsByPhoneTable data={data?.conversationsByPhone || []} loading={loading} />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text">Rendimiento de atención</h2>
        <ResponseTimeTiles data={ready} />
      </section>

      {ready && <PeriodSummary summary={ready.summary} />}

      <AgentRankingTable data={data?.agentRanking || []} loading={loading} />
    </div>
  );
}
