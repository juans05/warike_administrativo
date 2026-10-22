'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Modal, Textarea } from '../../ui';

/** Pide el motivo (obligatorio) antes de rechazar una propuesta. Se monta solo mientras está abierto. */
export function RejectReasonModal({ title, onCancel, onConfirm }: { title: string; onCancel(): void; onConfirm(reason: string): void }) {
  const [reason, setReason] = useState('');
  return (
    <Modal
      open
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" icon={X} disabled={!reason.trim()} onClick={() => onConfirm(reason)}>Rechazar</Button>
        </>
      }
    >
      <Textarea
        label="Motivo del rechazo"
        hint="Este motivo queda guardado y es obligatorio."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Ej: Local duplicado, ya existe en la plataforma."
      />
    </Modal>
  );
}
