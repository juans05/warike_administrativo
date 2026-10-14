'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { fetchWithAuth } from '../lib/api-client';

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <div className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-8 shadow-2xl">
        <h2 id="terms-title" className="text-2xl font-black text-[#1A1A1A]">Actualizamos nuestros términos</h2>
        <p className="text-sm text-gray-600">
          Para seguir usando Wuarike necesitamos que leas y aceptes la versión vigente ({status.currentVersion}) de nuestros documentos legales:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li><Link href="/terminos-y-condiciones" target="_blank" className="font-semibold text-[#F26122] underline">Términos y Condiciones</Link></li>
          <li><Link href="/politica-de-privacidad" target="_blank" className="font-semibold text-[#F26122] underline">Política de Privacidad</Link></li>
          <li><Link href="/contrato-de-encargo-de-datos" target="_blank" className="font-semibold text-[#F26122] underline">Contrato de Encargo de Tratamiento de Datos</Link></li>
          <li><Link href="/politica-de-cambios-y-devoluciones" target="_blank" className="font-semibold text-[#F26122] underline">Política de Cambios y Devoluciones</Link></li>
        </ul>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#F26122]" />
          <span>Leí y acepto los Términos y Condiciones, la Política de Privacidad, el Contrato de Encargo de Tratamiento de Datos y la Política de Cambios y Devoluciones, en nombre propio y del negocio que represento.</span>
        </label>
        <button onClick={accept} disabled={!checked || saving} className="w-full rounded-2xl bg-[#F26122] py-4 font-black text-white disabled:opacity-50">
          {saving ? 'Guardando...' : 'Aceptar y continuar'}
        </button>
      </div>
    </div>
  );
}
