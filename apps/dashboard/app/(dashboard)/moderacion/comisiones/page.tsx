'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminCommissionsApi } from '../../../../lib/api-client';

interface Settings { firstMonthRate: number; recurringRate: number; recurringMonths: number; clawbackDays: number; updatedAt: string | null }
interface Payout { id: string; period: string; totalAmount: number; status: 'pending' | 'paid'; paidAt: string | null; note: string | null; salesUserName: string }
interface Detail { payout: Payout; entries: { id: string; type: string; monthNumber: number; rate: number; amount: number; placeName: string; createdAt: string }[] }

const money = (c: number) => `S/ ${(c / 100).toFixed(2)}`;
const lastMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function AdminCommissionsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({ firstMonthRate: '', recurringRate: '', recurringMonths: '', clawbackDays: '' });
  const [period, setPeriod] = useState(lastMonth());
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPayouts = useCallback(() => adminCommissionsApi.listPayouts(period).then(setPayouts).catch((e) => toast.error(e.message)), [period]);

  useEffect(() => {
    adminCommissionsApi.getSettings().then((s: Settings) => {
      setSettings(s);
      setForm({
        firstMonthRate: String(Math.round(s.firstMonthRate * 100)),
        recurringRate: String(Math.round(s.recurringRate * 100)),
        recurringMonths: String(s.recurringMonths),
        clawbackDays: String(s.clawbackDays),
      });
    }).catch((e) => toast.error(e.message));
  }, []);
  useEffect(() => { loadPayouts(); }, [loadPayouts]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Los cambios aplican solo a pagos nuevos. ¿Guardar?')) return;
    try {
      const s = await adminCommissionsApi.updateSettings({
        firstMonthRate: Number(form.firstMonthRate) / 100,
        recurringRate: Number(form.recurringRate) / 100,
        recurringMonths: Number(form.recurringMonths),
        clawbackDays: Number(form.clawbackDays),
      });
      setSettings(s);
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar');
    }
  };

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

  const pay = async (p: Payout) => {
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

  const cancel = async (p: Payout) => {
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

  const field = (key: keyof typeof form, label: string, suffix: string) => (
    <label className="block text-xs font-bold text-gray-600">{label}
      <div className="mt-1 flex items-center gap-2">
        <input required type="number" min={0} step={1} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-28 h-10 rounded-xl border border-gray-200 px-3 text-sm" />
        <span className="text-sm text-gray-500">{suffix}</span>
      </div>
    </label>
  );

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <h1 className="text-3xl font-black text-[#1A1A1A]">Comisiones</h1>
        <p className="text-sm text-gray-500">Configura las reglas y liquida las comisiones de los comerciales.</p>
      </header>

      <form onSubmit={saveSettings} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-black">Configuración</h2>
        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">Los cambios aplican solo a pagos nuevos. Lo ya generado o pagado no cambia.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('firstMonthRate', 'Comisión del primer mes', '%')}
          {field('recurringRate', 'Comisión mensual', '%')}
          {field('recurringMonths', 'Meses con comisión mensual', 'meses')}
          {field('clawbackDays', 'Descuento si cancela dentro de', 'días')}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{settings?.updatedAt ? `Último cambio: ${new Date(settings.updatedAt).toLocaleString('es-PE')}` : 'Valores iniciales'}</span>
          <button className="h-10 px-4 rounded-xl text-sm font-bold bg-[#1A1A1A] text-white">Guardar</button>
        </div>
      </form>

      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block text-xs font-bold text-gray-600">Mes
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1 block h-10 rounded-xl border border-gray-200 px-3 text-sm" />
          </label>
          <button onClick={generate} disabled={busy} className="h-10 px-4 rounded-xl text-sm font-bold bg-[#F26122] text-white disabled:opacity-60">
            {busy ? 'Generando…' : 'Generar liquidaciones'}
          </button>
        </div>
        {payouts.length === 0 ? <p className="text-sm text-gray-500">No hay liquidaciones para {period}.</p> : (
          <div className="divide-y divide-gray-100">
            {payouts.map((p) => (
              <div key={p.id} className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={() => adminCommissionsApi.payout(p.id).then(setDetail)} className="text-left">
                  <p className="font-bold">{p.salesUserName}</p>
                  <p className="text-xs text-gray-500">{p.status === 'paid' ? `Pagada${p.note ? ' · ' + p.note : ''}` : 'Pendiente de pago'} · ver detalle</p>
                </button>
                <div className="flex items-center gap-3">
                  <span className="font-black">{money(p.totalAmount)}</span>
                  {p.status === 'pending' && (
                    <>
                      <button onClick={() => pay(p)} className="h-9 px-3 rounded-lg text-xs font-bold bg-green-600 text-white">Marcar pagada</button>
                      <button onClick={() => cancel(p)} className="h-9 px-3 rounded-lg text-xs font-bold border border-gray-200 text-red-600">Anular</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {detail && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Detalle · {detail.payout.salesUserName ?? ''} · {detail.payout.period}</h2>
            <button onClick={() => setDetail(null)} className="text-xs font-bold text-gray-500 underline">Cerrar</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-400 uppercase">
                <tr><th className="p-2">Local</th><th className="p-2">Tipo</th><th className="p-2">Mes</th><th className="p-2">%</th><th className="p-2 text-right">Monto</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.entries.map((e) => (
                  <tr key={e.id}>
                    <td className="p-2">{e.placeName}</td>
                    <td className="p-2">{e.type === 'first_month' ? 'Primer mes' : e.type === 'recurring' ? 'Mensual' : 'Descuento'}</td>
                    <td className="p-2">{e.monthNumber}</td>
                    <td className="p-2">{Math.round(Math.abs(e.rate) * 100)} %</td>
                    <td className={`p-2 text-right font-bold ${e.amount < 0 ? 'text-red-600' : ''}`}>{money(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
