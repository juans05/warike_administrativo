'use client';

import React, { useState } from 'react';
import { ImageIcon, Sparkles } from 'lucide-react';
import { Button, Card, Input } from '../ui';
import type { CatalogCtx } from './types';

interface Props {
  photo: string;
  onPhotoChange(url: string): void;
  onSave(): void;
  saving: boolean;
  catalog: CatalogCtx;
  // Sube una foto o PDF a la base de conocimiento: la IA lo lee y el bot lo usa para responder.
  onTeachAI(file: File): Promise<void>;
}

// Modo "Foto": en vez del catálogo digital, la página pública muestra una imagen (p. ej. la carta impresa).
export function PhotoMenuCard({ photo, onPhotoChange, onSave, saving, catalog, onTeachAI }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [teaching, setTeaching] = useState(false);

  const teach = async () => {
    if (!file) return;
    setTeaching(true);
    try { await onTeachAI(file); setFile(null); } finally { setTeaching(false); }
  };

  return (
    <Card padding="lg" className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <ImageIcon size={24} aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-text">{catalog.labels.catalog} en imagen</h2>
        <p className="mt-1 text-sm text-text-muted">Pega el enlace de la imagen que quieres mostrar, por ejemplo la foto de tu lista impresa.</p>
      </div>

      {photo ? (
        <div className="space-y-3">
          <img src={photo} alt="Vista previa de la imagen" className="max-h-[500px] w-full rounded-control border border-border object-contain" />
          <Button variant="secondary" onClick={() => onPhotoChange('')}>Cambiar imagen</Button>
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-border p-6">
          <Input label="URL de la imagen" placeholder="https://..." onChange={(e) => onPhotoChange(e.target.value)} />
        </div>
      )}

      <Button className="w-full" loading={saving} disabled={!photo} onClick={onSave}>
        Guardar imagen
      </Button>

      <div className="space-y-3 border-t border-border pt-6">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary" aria-hidden />
          <h3 className="font-semibold text-text">Que la IA lea tu {catalog.labels.catalog.toLowerCase()}</h3>
        </div>
        <p className="text-sm text-text-muted">Sube una foto o un PDF. La IA lo lee y tu asistente de WhatsApp podrá responder precios y platos con esa información.</p>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          aria-label="Foto o PDF para la IA"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-text-muted file:mr-3 file:rounded-control file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:font-medium file:text-primary-hover"
        />
        <Button variant="secondary" icon={Sparkles} className="w-full" loading={teaching} disabled={!file} onClick={teach}>
          {teaching ? 'La IA está leyendo...' : 'Enviar a la IA'}
        </Button>
      </div>
    </Card>
  );
}
