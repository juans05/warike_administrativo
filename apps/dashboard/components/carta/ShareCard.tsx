'use client';

import React from 'react';
import { AlertTriangle, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card } from '../ui';
import type { CatalogCtx } from './types';

interface Props {
  link: string;
  catalog: CatalogCtx;
  /** En modo "Foto" el enlace solo muestra algo si ya se guardó la imagen. */
  photoMode: boolean;
}

export function ShareCard({ link, catalog, photoMode }: Props) {
  const { labels, isFood } = catalog;

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado');
  };

  const share = () => {
    const text = `${isFood ? 'Mira nuestra carta' : 'Mira lo que ofrecemos'}: ${link}`;
    if (navigator.share) {
      navigator.share({ title: `${labels.catalog} digital`, url: link, text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Mensaje copiado');
    }
  };

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-text">Tu enlace público</h2>
        <p className="mt-1 break-all text-sm text-text-muted">{link}</p>
        {photoMode && (
          <p className="mt-2 flex items-start gap-2 rounded-control border border-secondary bg-secondary/20 px-3 py-2 text-sm text-text">
            <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" />
            Estás en modo "Foto": guarda la imagen más abajo para que este enlace muestre algo.
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" icon={Copy} onClick={copy}>Copiar enlace</Button>
        <Button variant="secondary" icon={Share2} onClick={share}>Compartir</Button>
      </div>
    </Card>
  );
}
