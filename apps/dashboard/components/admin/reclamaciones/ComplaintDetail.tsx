'use client';

import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Badge, Button, Textarea } from '../../ui';
import { ComplaintTypeBadge } from './ComplaintList';
import { formatDate, type Complaint } from './types';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-text">{children}</dd>
    </div>
  );
}

/** Detalle de un reclamo y su respuesta. Se monta con `key` = id para que el texto no pase de un reclamo a otro. */
export function ComplaintDetail({ complaint, onResolve }: { complaint: Complaint; onResolve(id: string, response: string): Promise<void> }) {
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = complaint.status === 'pending';

  const submit = async () => {
    setSaving(true);
    try {
      await onResolve(complaint.id, response);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 p-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-mono text-xl font-semibold text-text">{complaint.folio}</h2>
          <ComplaintTypeBadge type={complaint.type} />
          <Badge tone={pending ? 'warning' : 'success'}>{pending ? 'Pendiente' : 'Resuelto'}</Badge>
        </div>
        <p className="text-sm text-text-muted">Recibido el {formatDate(complaint.createdAt)}</p>
      </header>

      <dl className="grid gap-4 rounded-card bg-background p-4 sm:grid-cols-2">
        <Fact label="Consumidor">{complaint.consumerFullName}</Fact>
        <Fact label="Documento">{complaint.consumerDocumentType} {complaint.consumerDocumentNumber}</Fact>
        <Fact label="Correo">{complaint.consumerEmail}</Fact>
        <Fact label="Teléfono">{complaint.consumerPhone || '—'}</Fact>
        <Fact label="Dirección">{complaint.consumerAddress}</Fact>
        {complaint.claimedAmount != null && <Fact label="Monto reclamado">S/ {Number(complaint.claimedAmount).toFixed(2)}</Fact>}
        <div className="sm:col-span-2"><Fact label="Bien contratado">{complaint.contractedGood}</Fact></div>
        <div className="sm:col-span-2"><Fact label="Detalle">{complaint.detail}</Fact></div>
        <div className="sm:col-span-2"><Fact label="Pedido concreto del consumidor">{complaint.consumerRequest}</Fact></div>
      </dl>

      {pending ? (
        <div className="space-y-3">
          <Textarea
            label="Acciones adoptadas por el proveedor"
            hint="Esta respuesta queda guardada junto al folio."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            placeholder="Describe la respuesta dada al consumidor y las acciones tomadas."
          />
          <Button icon={Check} loading={saving} disabled={!response.trim()} onClick={submit}>Marcar como resuelto</Button>
        </div>
      ) : (
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-text">Respuesta del proveedor</h3>
          <p className="whitespace-pre-wrap rounded-card border border-border p-4 text-sm text-text">{complaint.providerResponse || '—'}</p>
        </div>
      )}
    </div>
  );
}
