'use client';

import React, { useState } from 'react';
import { ArrowLeft, FileCheck2, Upload } from 'lucide-react';
import { businessApi, type ClaimDocuments } from '../../lib/api-client';
import { Button } from '../ui';

const DOCS: { key: keyof ClaimDocuments; label: string; hint: string }[] = [
  { key: 'fichaRuc', label: 'Ficha RUC', hint: 'Descárgala de SUNAT (foto o PDF).' },
  { key: 'dni', label: 'DNI del representante legal', hint: 'Ambas caras en una foto o PDF.' },
  { key: 'manifiesto', label: 'Manifiesto', hint: 'Foto o PDF.' },
];

/**
 * Reclamar un local no lo asigna al instante: se suben la ficha RUC, el DNI del representante legal
 * y el manifiesto, y Wuarikes valida que el negocio exista y sea de quien lo pide.
 */
export default function ClaimDocumentsForm({ placeName, onSubmit, onBack }: {
  placeName: string;
  onSubmit: (documents: ClaimDocuments, phone: string) => Promise<void>;
  onBack: () => void;
}) {
  const [files, setFiles] = useState<Partial<Record<keyof ClaimDocuments, File>>>({});
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = DOCS.every((d) => files[d.key]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setSending(true);
    setError(null);
    try {
      const [fichaRuc, dni, manifiesto] = await Promise.all(DOCS.map((d) => businessApi.uploadDocument(files[d.key]!)));
      await onSubmit({ fichaRuc, dni, manifiesto }, phone.trim());
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar la solicitud');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack} disabled={sending}>Volver</Button>
        <h2 className="min-w-0 truncate text-base font-semibold text-text">Reclamar {placeName}</h2>
      </div>
      <p className="text-sm text-text-muted">
        Para proteger a los dueños, Wuarikes revisa cada solicitud. Te avisaremos cuando validemos tus documentos.
      </p>

      {DOCS.map((d) => (
        <label key={d.key} className="block rounded-card border border-border bg-surface p-4">
          <span className="block text-sm font-medium text-text">{d.label}</span>
          <span className="block text-xs text-text-muted">{d.hint}</span>
          <span className="mt-2 flex items-center gap-2 text-sm text-primary">
            {files[d.key] ? <FileCheck2 size={16} aria-hidden /> : <Upload size={16} aria-hidden />}
            <span className="truncate">{files[d.key]?.name ?? 'Elegir archivo'}</span>
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            required
            className="sr-only"
            onChange={(e) => setFiles((f) => ({ ...f, [d.key]: e.target.files?.[0] }))}
          />
        </label>
      ))}

      <label className="block">
        <span className="block text-sm font-medium text-text">Teléfono de contacto</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={30}
          placeholder="+51 9..."
          className="mt-1 h-11 w-full rounded-control border border-border bg-surface px-3 text-base text-text focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </label>

      {error && <p role="alert" className="rounded-control bg-danger/10 p-3 text-sm font-medium text-danger">{error}</p>}

      <Button type="submit" className="w-full" disabled={!ready || sending}>
        {sending ? 'Enviando…' : 'Enviar para validación'}
      </Button>
    </form>
  );
}
