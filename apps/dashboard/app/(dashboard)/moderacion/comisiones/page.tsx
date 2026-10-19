'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminCommissionsApi } from '../../../../lib/api-client';
import { Button, Input, PageHeader, StatTile } from '../../../../components/ui';
import { PayoutDetailSection, PayoutsList } from '../../../../components/admin/comisiones/PayoutsSection';
import { SettingsForm } from '../../../../components/admin/comisiones/SettingsForm';
import { money, type CommissionPayout, type PayoutDetail } from '../../../../components/admin/comisiones/types';

const lastMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function AdminCommissionsPage() {
  const [period, setPeriod] = useState(lastMonth());
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PayoutDetail | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    try {
      setPayouts(await adminCommissionsApi.listPayouts(period));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadPayouts(); }, [loadPayouts]);

  const generate = async () => {
    setBusy(true);
    try {
      const created = await adminCommissionsApi.generate(period);
      toast.success(created.length ? `${created.length} liquidación(es) generada(s)` : 'No hay comisiones nuevas para liquidar en ese mes');
      await loadPayouts();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo generar');
    } finally {
      setBusy(false);
    }
  };

  const pay = async (p: CommissionPayout) => {
    const note = prompt(`Marcar como pagada la liquidación de ${p.salesUserName} (${money(p.totalAmount)}). Nota opcional (ej. operación bancaria):`);
    if (note === null) return;
    try {
      await adminCommissionsApi.pay(p.id, note);
      toast.success('Liquidación pagada');
      await loadPayouts();
      setDetail(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const cancel = async (p: CommissionPayout) => {
    if (!confirm(`¿Anular la liquidación de ${p.salesUserName}? Sus comisiones vuelven a quedar pendientes.`)) return;
    try {
      await adminCommissionsApi.cancel(p.id);
      toast.success('Liquidación anulada');
      await loadPayouts();
      setDetail(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openDetail = (p: CommissionPayout) => {
    adminCommissionsApi.payout(p.id).then(setDetail).catch((err: Error) => toast.error(err.message));
  };

  const sum = (rows: CommissionPayout[]) => rows.reduce((total, p) => total + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comisiones"
        subtitle="Configura las reglas y liquida las comisiones de los comerciales."
        action={
          <div className="flex flex-wrap items-end gap-3">
            <Input label="Mes" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
            <Button loading={busy} onClick={generate}>{busy ? 'Generando…' : 'Generar liquidaciones'}</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total del mes" value={loading ? '—' : money(sum(payouts))} />
        <StatTile label="Pendiente de pago" value={loading ? '—' : money(sum(payouts.filter((p) => p.status === 'pending')))} />
        <StatTile label="Pagado" value={loading ? '—' : money(sum(payouts.filter((p) => p.status === 'paid')))} />
      </div>

      <PayoutsList payouts={payouts} loading={loading} period={period} onDetail={openDetail} onPay={pay} onCancel={cancel} />
      {detail && <PayoutDetailSection detail={detail} onClose={() => setDetail(null)} />}

      <SettingsForm />
    </div>
  );
}
