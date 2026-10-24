'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Download } from 'lucide-react';
import { Button, Modal } from '../ui';

/** Link público de reservas (para Instagram, Google o un QR en el local). */
export function BookingLinkModal({ placeId, onClose }: { placeId: string; onClose(): void }) {
  const url = `${window.location.origin}/reservar/${placeId}`;
  const qrRef = useRef<HTMLDivElement>(null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast.success('Link copiado'); } catch { toast.error('No se pudo copiar; selecciónalo y cópialo'); }
  };
  const download = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'qr-reservas.png';
    a.click();
  };
  return (
    <Modal open onClose={onClose} title="Tu link de reservas">
      <div className="space-y-4">
        <p className="text-sm text-text-muted">Compártelo en tu Instagram, Google o WhatsApp. Tus clientes eligen servicio, profesional y hora libre.</p>
        <code className="block break-all rounded-control bg-background p-3 text-sm text-text">{url}</code>
        <div className="flex flex-wrap gap-2">
          <Button icon={Copy} onClick={copy}>Copiar link</Button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-primary-hover underline">Ver cómo lo ve el cliente</a>
        </div>
        <div ref={qrRef} className="flex flex-col items-center gap-3 rounded-control border border-border p-4">
          <QRCodeCanvas value={url} size={180} marginSize={2} />
          <Button variant="secondary" size="sm" icon={Download} onClick={download}>Descargar QR</Button>
        </div>
      </div>
    </Modal>
  );
}
