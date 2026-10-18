'use client';

import React from 'react';
import { ImageIcon } from 'lucide-react';
import { Button, Card, Input } from '../ui';
import type { CatalogCtx } from './types';

interface Props {
  photo: string;
  onPhotoChange(url: string): void;
  onSave(): void;
  saving: boolean;
  catalog: CatalogCtx;
}

// Modo "Foto": en vez del catálogo digital, la página pública muestra una imagen (p. ej. la carta impresa).
export function PhotoMenuCard({ photo, onPhotoChange, onSave, saving, catalog }: Props) {
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
    </Card>
  );
}
