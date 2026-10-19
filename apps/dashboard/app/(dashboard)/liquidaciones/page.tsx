'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { ordersApi } from '../../../lib/api-client';
import { soles } from '../../../lib/orders-format';
import { Badge, Button, EmptyState, Input, PageHeader, StatTile } from '../../../components/ui';
import { SectionCard } from '../../../components/admin/SectionCard';
import { LoadingRows, Table, Td, Tr } from '../../../components/admin/Table';

interface Payout {
  id: string;
  placeId: string;
  gross: number;
  commission: number;
  culqiFees: number;
  net: number;
  status: 'BORRADOR' | 'PAGADO' | 'ANULADO';
  reference: string | null;
}

const lastMonth = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

function StatusBadge({ payout }: { payout: Payout }) {
  if (payout.status === 'PAGADO') {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <Badge tone="success"><Check size={16} aria-hidden />Pagada</Badge>
        {payout.reference && <span className="text-xs text-text-muted">Op. {payout.reference}</span>}
      </span>
    );
  }
  return payout.status === 'ANULADO' ? <Badge>Anulada</Badge> : <Badge tone="warning">Borrador</Badge>;
}

export default function PayoutsPage() {
  const [period, setPeriod] = useState(lastMonth());
  const [rows, setRows] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await ordersApi.adminPayouts(period));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    try {
      const created = await ordersApi.adminGeneratePayouts(period);
      toast.success(`${created.length} liquidaciones nuevas`);
      load();
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo generar');
    } finally {
      setGenerating(false);
    }
  };

  const pay = async (id: string) => {
    const reference = prompt('N.º de operación de la transferencia:');
    if (!reference) return;
    try {
      await ordersApi.adminPayPayout(id, reference);
      load();
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo marcar como pagada');
    }
  };

  // Las anuladas no cuentan; el neto por pagar son solo las que siguen en borrador (las pagadas ya salieron).
  const total = (key: 'gross' | 'commission' | 'net', statuses: Payout['status'][] = ['BORRADOR', 'PAGADO']) =>
    rows.filter((r) => statuses.includes(r.status)).reduce((sum, r) => sum + r[key], 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liquidaciones de ventas"
        subtitle="Lo que Wuarikes liquida a cada local por sus ventas del mes."
        action={
          <div className="flex flex-wrap items-end gap-3">
            <Input label="Mes" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
            <Button loading={generating} onClick={generate}>Generar del mes</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Ventas brutas" value={loading ? '—' : soles(total('gross'))} />
        <StatTile label="Comisión de Wuarikes" value={loading ? '—' : soles(total('commission'))} />
        <StatTile label="Neto por pagar a los locales" value={loading ? '—' : soles(total('net', ['BORRADOR']))} />
      </div>

      <SectionCard title="Liquidaciones" subtitle={`Periodo ${period}`}>
        {loading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Wallet}
            headingLevel="h3"
            title={`No hay liquidaciones para ${period}`}
            description="Usa Generar del mes para crearlas con las ventas cobradas."
          />
        ) : (
          <Table columns={['Local', { label: 'Bruto', align: 'right' }, { label: 'Comisión', align: 'right' }, { label: 'Culqi', align: 'right' }, { label: 'Neto', align: 'right' }, 'Estado', { label: 'Acción', align: 'right' }]}>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td className="font-mono text-xs" title={r.placeId}>{r.placeId.slice(0, 8)}…</Td>
                <Td right>{soles(r.gross)}</Td>
                <Td right>{soles(r.commission)}</Td>
                <Td right>{soles(r.culqiFees)}</Td>
                <Td right className="font-semibold">{soles(r.net)}</Td>
                <Td><StatusBadge payout={r} /></Td>
                <Td right>
                  {r.status === 'BORRADOR' && <Button size="sm" icon={Check} onClick={() => pay(r.id)}>Marcar pagada</Button>}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
