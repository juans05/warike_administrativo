'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminCommissionsApi } from '../../../../lib/api-client';
import { Input, PageHeader, StatTile } from '../../../../components/ui';
import { PayoutDetailSection, PayoutsList } from '../../../../components/admin/comisiones/PayoutsSection';
import { money, type CommissionPayout, type PayoutDetail } from '../../../../components/admin/comisiones/types';

const lastMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** El comercial ve solo sus liquidaciones (solo lectura). */
export default function MisComisionesPage() {
  const [period, setPeriod] = useState(lastMonth());
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PayoutDetail | null>(null);

  useEffect(() => {
    setLoading(true);
    adminCommissionsApi.mine(period).then(setPayouts).catch((e: Error) => toast.error(e.message)).finally(() => setLoading(false));
  }, [period]);

  const sum = (rows: CommissionPayout[]) => rows.reduce((total, p) => total + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis comisiones"
        subtitle="Lo que ganaste por las suscripciones de tus clientes."
        action={<Input label="Mes" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total del mes" value={loading ? '—' : money(sum(payouts))} />
        <StatTile label="Por cobrar" value={loading ? '—' : money(sum(payouts.filter((p) => p.status === 'pending')))} />
        <StatTile label="Pagado" value={loading ? '—' : money(sum(payouts.filter((p) => p.status === 'paid')))} />
      </div>
      <PayoutsList payouts={payouts} loading={loading} period={period}
        onDetail={(p) => adminCommissionsApi.minePayout(p.id).then(setDetail).catch((e: Error) => toast.error(e.message))} />
      {detail && <PayoutDetailSection detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
