'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../../lib/api-client';
import { toast } from 'sonner';
import { PageHeader } from '../../../../components/ui';
import { can, usePlatformPermissions } from '../../../../lib/platform';
import {
  OpportunitiesSection,
  RequestsSection,
  type Opportunity,
  type WuarikesHereRequest,
} from '../../../../components/admin/oportunidades/OpportunitiesSections';

export default function OportunidadesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [requests, setRequests] = useState<WuarikesHereRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const perms = usePlatformPermissions(true);
  const canAssign = can(perms, 'oportunidades.todas');
  const [salesUsers, setSalesUsers] = useState<{ id: string; fullName: string }[]>([]);

  const loadData = () => {
    Promise.all([
      adminApi.getOpportunities().catch(() => []),
      adminApi.getWuarikesHereRequests().catch(() => []),
    ]).then(([opps, reqs]) => {
      setOpportunities(Array.isArray(opps) ? opps : []);
      setRequests(Array.isArray(reqs) ? reqs : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (canAssign) adminApi.listSalesUsers().then(setSalesUsers).catch(() => setSalesUsers([])); }, [canAssign]);

  const handleAssignSeller = async (placeId: string, salesUserId: string) => {
    setOpportunities((prev) => prev.map((o) => (o.id === placeId ? { ...o, assignedSalesUserId: salesUserId || null } : o)));
    try {
      await adminApi.assignSalesUser(placeId, salesUserId || null);
      toast.success(salesUserId ? 'Comercial asignado' : 'Local liberado');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo asignar');
      loadData();
    }
  };

  const handleOpportunityStatus = async (placeId: string, status: string) => {
    setOpportunities((prev) => prev.map((o) => (o.id === placeId ? { ...o, commercialStatus: status } : o)));
    try {
      await adminApi.updateOpportunityStatus(placeId, status);
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar');
      loadData();
    }
  };

  const handleRequestStatus = async (id: string, status: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await adminApi.updateWuarikesHereRequestStatus(id, status);
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oportunidades comerciales"
        subtitle="Locales con actividad real que todavía no pagan Wuarikes, más los negocios que la gente está pidiendo."
      />
      <OpportunitiesSection
        opportunities={opportunities}
        loading={loading}
        salesUsers={canAssign ? salesUsers : null}
        onAssign={handleAssignSeller}
        onStatus={handleOpportunityStatus}
      />
      <RequestsSection requests={requests} loading={loading} onStatus={handleRequestStatus} />
    </div>
  );
}
