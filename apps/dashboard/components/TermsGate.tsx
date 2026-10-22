'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { fetchWithAuth } from '../lib/api-client';
import { Button, Card } from './ui';

interface TermsStatus { currentVersion: string; acceptedVersion: string | null }

// Pide aceptar la versión vigente de los Términos antes de usar el panel y la registra (versión, fecha e IP)
// como prueba de la aceptación electrónica. Si el backend no responde, no bloquea el panel.
export default function TermsGate() {
  const [status, setStatus] = useState<TermsStatus | null>(null);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWithAuth('/users/me/terms-acceptance').then(setStatus).catch(() => setStatus(null));
  }, []);

  if (!status || status.acceptedVersion === status.currentVersion) return null;

  const accept = async () => {
    setSaving(true);
    try {
      setStatus(await fetchWithAuth('/users/me/terms-acceptance', { method: 'POST', body: JSON.stringify({ version: status.currentVersion }) }));
    } catch (err: any) {
      toast.error(err.message || 'No se pudo registrar tu aceptación');
    } finally {
      setSaving(false);
    }
  };

  const linkStyles = 'font-medium text-primary underline underline-offset-2 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm';

  return (
    <div className="fixed inset-0 z-[100] flex overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <Card padding="lg" className="m-auto w-full max-w-lg space-y-5 shadow-modal sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <ShieldCheck size={24} aria-hidden />
        </div>
        <h2 id="terms-title" className="text-xl font-semibold text-text">Actualizamos nuestros términos</h2>
        <p className="text-sm text-text-muted">
          Para seguir usando Wuarikes necesitamos que leas y aceptes la versión vigente ({status.currentVersion}) de nuestros documentos legales:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-text">
          <li><Link href="/terminos-y-condiciones" target="_blank" className={linkStyles}>Términos y Condiciones</Link></li>
          <li><Link href="/politica-de-privacidad" target="_blank" className={linkStyles}>Política de Privacidad</Link></li>
          <li><Link href="/contrato-de-encargo-de-datos" target="_blank" className={linkStyles}>Contrato de Encargo de Tratamiento de Datos</Link></li>
          <li><Link href="/politica-de-cambios-y-devoluciones" target="_blank" className={linkStyles}>Política de Cambios y Devoluciones</Link></li>
        </ul>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-text">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
          <span>Leí y acepto los Términos y Condiciones, la Política de Privacidad, el Contrato de Encargo de Tratamiento de Datos y la Política de Cambios y Devoluciones, en nombre propio y del negocio que represento.</span>
        </label>
        <Button onClick={accept} disabled={!checked} loading={saving} className="w-full">
          {saving ? 'Guardando...' : 'Aceptar y continuar'}
        </Button>
      </Card>
    </div>
  );
}
