'use client';

import { Button, Modal } from '../../ui';
import { DESTINATION_LABELS } from './constants';

export function HistoryModal({ target, onClose }: { target: { qrCode: any; history: any[] }; onClose(): void }) {
  return (
    <Modal open onClose={onClose} title={`Historial de ${target.qrCode.code}`} footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}>
      {target.history.length === 0 ? (
        <p className="text-text-muted">Este QR nunca fue asignado.</p>
      ) : (
        <ul className="divide-y divide-border">
          {target.history.map((a: any) => (
            <li key={a.id} className="space-y-0.5 py-3 first:pt-0 last:pb-0">
              <p className="font-semibold text-text">{a.place?.name || a.placeId}</p>
              <p className="text-xs text-text-muted">
                {new Date(a.assignedAt).toLocaleDateString()} → {a.unassignedAt ? new Date(a.unassignedAt).toLocaleDateString() : 'Actualidad'}
              </p>
              <p className="text-xs text-text-muted">Destino: {DESTINATION_LABELS[a.destinationType] || a.destinationType}</p>
              {a.assignedByUser?.email && <p className="text-xs text-text-muted">Por: {a.assignedByUser.email}</p>}
              {a.reason && <p className="text-xs text-text-muted">Motivo: {a.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
