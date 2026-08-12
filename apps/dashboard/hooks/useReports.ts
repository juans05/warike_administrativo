import { useState, useCallback, useEffect, useMemo } from 'react';
import { reportsApi } from '../lib/api-client';
import { useRestaurant } from '../context/RestaurantContext';
import { computeRangeForPreset, DateRangePreset } from '../lib/date-range';

export interface ChangeMetric {
  value: number;
  previousValue: number;
  changePct: number;
  isPositive: boolean;
}

export type ConversationBucket = 'attended' | 'unassigned' | 'pending' | 'resolved';

export interface ReportsData {
  range: { from: string; to: string };
  kpis: {
    contacts: ChangeMetric;
    conversations: ChangeMetric;
    attended: ChangeMetric;
    unassigned: ChangeMetric;
    pending: ChangeMetric;
    resolved: ChangeMetric;
  };
  statusDistribution: { status: ConversationBucket; label: string; count: number }[];
  conversationsByDay: { date: string; total: number; attended: number; pending: number; resolved: number }[];
  conversationsByHour: { hour: number; count: number }[];
  conversationsByPhone: {
    phone: string;
    contactName: string | null;
    conversations: number;
    lastConversationAt: string;
    status: ConversationBucket;
  }[];
  responseTime: ChangeMetric;
  resolutionTime: ChangeMetric;
  summary: {
    totalContacts: number;
    totalConversations: number;
    avgConversationsPerContact: number;
    attendedCount: number;
    resolvedCount: number;
    resolutionRate: number;
    attentionRate: number;
    avgResponseSeconds: number;
    avgResolutionSeconds: number;
  };
  agentRanking: {
    userId: string;
    fullName: string;
    conversations: number;
    attended: number;
    resolved: number;
    pending: number;
    avgResponseSeconds: number | null;
    avgResolutionSeconds: number | null;
  }[];
}

export function useReports() {
  const { activePlaceId } = useRestaurant();
  const [preset, setPreset] = useState<DateRangePreset>('last30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => computeRangeForPreset(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const load = useCallback(async () => {
    if (!activePlaceId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.get(activePlaceId, fromIso, toIso);
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, [activePlaceId, fromIso, toIso]);

  useEffect(() => { load(); }, [load]);

  return {
    preset, setPreset,
    customFrom, setCustomFrom,
    customTo, setCustomTo,
    range,
    data, loading, error,
    refresh: load,
  };
}
