'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Input, Modal, Select } from '../../ui';
import type { PhysicalType } from './constants';

/** Pide cuántos códigos generar y de qué tipo físico. Se monta solo mientras está abierto. */
export function GenerateModal({ onClose, onGenerate }: { onClose(): void; onGenerate(count: number, physicalType: PhysicalType): Promise<void> }) {
  const [count, setCount] = useState(100);
  const [physicalType, setPhysicalType] = useState<PhysicalType>('QR');
  const [generating, setGenerating] = useState(false);

  const submit = async () => {
    setGenerating(true);
    try {
      await onGenerate(count, physicalType);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Generar lote de QR"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button icon={Plus} loading={generating} onClick={submit}>Generar {count} códigos</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Cantidad" type="number" min={1} max={500} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        <Select label="Tipo físico" value={physicalType} onChange={(e) => setPhysicalType(e.target.value as PhysicalType)}>
          <option value="QR">QR (papel o sticker)</option>
          <option value="NFC">NFC</option>
          <option value="TABLET">Tablet</option>
        </Select>
      </div>
    </Modal>
  );
}
