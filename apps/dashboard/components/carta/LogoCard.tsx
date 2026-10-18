'use client';

import React, { useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../../lib/api-client';
import { Card, Switch, buttonStyles } from '../ui';
import { uploadFile } from './upload';

interface Props {
  placeId: string;
  logoUrl: string;
  onLogoChange(url: string): void;
  showLogoOnQr: boolean;
  onShowLogoOnQrChange(value: boolean): void;
}

// Logo del negocio (sale arriba de la página pública) y si va en el QR de reseñas.
export function LogoCard({ placeId, logoUrl, onLogoChange, showLogoOnQr, onShowLogoOnQrChange }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile('image', file);
      onLogoChange(url);
      await businessApi.updateProfile(placeId, { logoUrl: url });
      toast.success('Logo actualizado');
    } catch {
      toast.error('No se pudo subir el logo');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleQr = async (next: boolean) => {
    onShowLogoOnQrChange(next);
    try {
      await businessApi.updateProfile(placeId, { showLogoOnQr: next });
    } catch {
      onShowLogoOnQrChange(!next);
      toast.error('No se pudo guardar la preferencia');
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-background text-text-muted">
          {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <ImagePlus size={24} aria-hidden />}
        </div>
        <div className="min-w-[12rem] flex-1">
          <h3 className="text-sm font-semibold text-text">Logo del negocio</h3>
          <p className="mt-0.5 text-sm text-text-muted">
            Aparece centrado arriba de tu página pública para que te reconozcan de un vistazo.
          </p>
        </div>
        <label className={buttonStyles('secondary', 'md', 'shrink-0 cursor-pointer focus-within:ring-2 focus-within:ring-primary/40')}>
          {uploading && <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden />}
          {uploading ? 'Subiendo...' : logoUrl ? 'Cambiar' : 'Subir logo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleLogoUpload} disabled={uploading} />
        </label>
      </div>

      {logoUrl && (
        <div className="border-t border-border pt-2">
          <Switch label="Mostrar mi logo en el QR de reseñas" checked={showLogoOnQr} onChange={handleToggleQr} />
          <p className="text-sm text-text-muted">Cuando imprimas o descargues tu QR de Google, aparecerá con tu logo incluido.</p>
        </div>
      )}
    </Card>
  );
}
