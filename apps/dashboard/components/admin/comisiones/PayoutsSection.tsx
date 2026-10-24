'use client';

import { Check, Eye, Wallet, X } from 'lucide-react';
import { Badge, Button, DataList, EmptyState } from '../../ui';
import { SectionCard } from '../SectionCard';
import { LoadingRows, Table, Td, Tr } from '../Table';
import { ENTRY_TYPE_LABEL, money, type CommissionPayout, type PayoutDetail } from './types';

export function PayoutsList({ payouts, loading, period, onDetail, onPay, onCancel }: {
  payouts: CommissionPayout[];
  loading: boolean;
  period: string;
  onDetail(payout: CommissionPayout): void;
  /** Sin estas acciones (vista del comercial) la lista es de solo lectura. */
  onPay?(payout: CommissionPayout): void;
  onCancel?(payout: CommissionPayout): void;
}) {
  return (
    <SectionCard title="Liquidaciones del mes" subtitle={onPay ? `Comisiones de los comerciales en ${period}` : `Tus comisiones de ${period}`}>
      {loading ? (
        <LoadingRows />
      ) : (
        <div className="px-4">
          <DataList
            items={payouts}
            empty={
              <EmptyState
                icon={Wallet}
                headingLevel="h3"
                title={`No hay liquidaciones para ${period}`}
                description="Usa Generar liquidaciones para crearlas con las comisiones pendientes de ese mes."
              />
            }
            renderItem={(p) => (
              <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">{p.salesUserName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {p.status === 'paid' ? (
                      <Badge tone="success"><Check size={16} aria-hidden />Pagada</Badge>
                    ) : (
                      <Badge tone="warning">Pendiente de pago</Badge>
                    )}
                    {p.status === 'paid' && p.note && <span className="truncate text-xs text-text-muted">{p.note}</span>}
                  </div>
                </div>
                <p className="text-base font-semibold tabular-nums text-text">{money(p.totalAmount)}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" icon={Eye} aria-label={`Ver detalle de ${p.salesUserName}`} onClick={() => onDetail(p)}>Ver detalle</Button>
                  {p.status === 'pending' && onPay && onCancel && (
                    <>
                      <Button size="sm" icon={Check} onClick={() => onPay(p)}>Marcar pagada</Button>
                      <Button size="sm" variant="secondary" icon={X} className="text-danger" onClick={() => onCancel(p)}>Anular</Button>
                    </>
                  )}
                </div>
              </div>
            )}
          />
        </div>
      )}
    </SectionCard>
  );
}

export function PayoutDetailSection({ detail, onClose }: { detail: PayoutDetail; onClose(): void }) {
  return (
    <SectionCard
      title={`Detalle · ${detail.payout.salesUserName ?? ''} · ${detail.payout.period}`}
      action={<Button size="sm" variant="secondary" onClick={onClose}>Cerrar</Button>}
    >
      <Table columns={['Local', 'Tipo', 'Mes', '%', { label: 'Monto', align: 'right' }]}>
        {detail.entries.map((e) => (
          <Tr key={e.id}>
            <Td>{e.placeName}</Td>
            <Td>{ENTRY_TYPE_LABEL[e.type] ?? 'Descuento'}</Td>
            <Td className="tabular-nums">{e.monthNumber}</Td>
            <Td className="tabular-nums">{Math.round(Math.abs(e.rate) * 100)} %</Td>
            <Td right className={e.amount < 0 ? 'font-semibold text-danger' : 'font-semibold'}>{money(e.amount)}</Td>
          </Tr>
        ))}
      </Table>
    </SectionCard>
  );
}
