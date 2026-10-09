'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';
import FacebookWhatsAppConnect from './FacebookWhatsAppConnect';

interface Status {
  metaEnabled: boolean;
  serverConfigured: boolean;
  number: { id: string; phoneNumber: string; isActive: boolean } | null;
  testReceived: boolean;
  botReplied: boolean;
  botConfigured: boolean;
  hasMenuOrKnowledge: boolean;
}

const REQUIREMENTS = [
  'Un chip móvil (el prepago sirve) que NO tenga WhatsApp ni WhatsApp Business instalado. Si lo tuvo, elimina esa cuenta antes.',
  'Que pueda recibir un SMS o una llamada: Meta manda un código para verificarlo.',
  'Nada de números virtuales o de internet, ni el número que hoy atiende a tus clientes.',
  'Al conectarlo, ese número se atiende solo por la API: ya no podrás usarlo en la app de WhatsApp del celular.',
];

function StepShell({ n, title, done, active, children }: { n: number; title: string; done: boolean; active: boolean; children?: React.ReactNode }) {
  return (
    <div className={`rounded-[2rem] border p-6 transition-colors ${active ? 'bg-white border-[#1877F2]/40 shadow-sm' : done ? 'bg-green-50/60 border-green-100' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
      <div className="flex items-center gap-3">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${done ? 'bg-green-500 text-white' : active ? 'bg-[#1877F2] text-white' : 'bg-gray-200 text-gray-500'}`}>
          {done ? '✓' : n}
        </span>
        <h3 className="font-black text-text">{title}</h3>
        {done && <span className="text-xs font-bold text-green-700 ml-auto">Listo</span>}
      </div>
      {(active || (done && children)) && children && <div className="mt-4 pl-11 space-y-3 text-sm text-text-muted">{children}</div>}
    </div>
  );
}

// "Conecta tu WhatsApp en 4 pasos": cada paso se marca solo cuando el sistema detecta que de verdad se cumplió.
export default function WhatsAppSetupWizard({ placeId, onChanged }: { placeId: string; onChanged?: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [toggling, setToggling] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await businessApi.getWhatsappConnectStatus(placeId));
    } catch {
      /* se reintenta en el próximo ciclo */
    }
  }, [placeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const done1 = !!status?.metaEnabled;
  const done2 = !!status?.number;
  const done3 = !!(status?.testReceived && status?.botReplied);
  const done4 = !!(status?.botConfigured && status?.hasMenuOrKnowledge);
  const allDone = done1 && done2 && done3 && done4;

  // Mientras falte algo, se revisa cada 5 s: así el paso 3 se marca solo cuando llega el mensaje.
  useEffect(() => {
    if (!status || allDone) return;
    const t = setInterval(() => { if (!document.hidden) refresh(); }, 5000);
    return () => clearInterval(t);
  }, [status, allDone, refresh]);

  const toggleChannel = async (enabled: boolean) => {
    setToggling(true);
    try {
      await businessApi.setWhatsappChannel(placeId, enabled);
      await refresh();
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo cambiar el canal');
    } finally {
      setToggling(false);
    }
  };

  if (!status) return <div className="h-40 rounded-[2rem] bg-gray-100 animate-pulse" />;

  const current = !done1 ? 1 : !done2 ? 2 : !done3 ? 3 : !done4 ? 4 : 0;
  const doneCount = [done1, done2, done3, done4].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-black text-text text-lg">Conecta tu WhatsApp en 4 pasos</h2>
          <span className="text-xs font-bold text-text-muted">{doneCount} de 4</span>
        </div>
        <div className="flex gap-1.5">
          {[done1, done2, done3, done4].map((d, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full ${d ? 'bg-green-500' : i + 1 === current ? 'bg-[#1877F2]' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      {allDone && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-5 py-4 font-bold text-sm">
          🎉 ¡Tu WhatsApp está listo! Tus clientes ya pueden escribirte a +{status.number?.phoneNumber} y el bot les responde.
        </div>
      )}

      {/* 1 */}
      <StepShell n={1} title="Prepara tu número" done={done1} active={current === 1}>
        <ul className="space-y-1.5 list-disc pl-5">
          {REQUIREMENTS.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <p className="text-xs">Si Meta responde "este número no cumple los requisitos para registrarse o migrar", ese número ya está en WhatsApp: prueba con otro.</p>
        <label className="flex items-start gap-3 cursor-pointer pt-1">
          <input
            type="checkbox" checked={done1} disabled={toggling}
            onChange={(e) => toggleChannel(e.target.checked)}
            className="mt-0.5 h-5 w-5 accent-[#1877F2]"
          />
          <span className="font-bold text-text">Tengo un número libre y quiero conectarlo con Facebook</span>
        </label>
      </StepShell>

      {/* 2 */}
      <StepShell n={2} title="Conecta con Facebook" done={done2} active={current === 2}>
        {done2 ? (
          <p>Conectado: <b>+{status.number?.phoneNumber}</b></p>
        ) : status.serverConfigured ? (
          <FacebookWhatsAppConnect placeId={placeId} onConnected={() => { refresh(); onChanged?.(); }} />
        ) : (
          <p className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
            Esta conexión todavía no está habilitada. Avisa al equipo de Wuarikes para activarla.
          </p>
        )}
      </StepShell>

      {/* 3 */}
      <StepShell n={3} title="Pruébalo" done={done3} active={current === 3}>
        {done3 ? (
          <p>Recibimos tu mensaje y el bot respondió. ✓</p>
        ) : (
          <>
            <p>
              Desde tu WhatsApp personal, escríbele <b>"hola"</b> a <b>+{status.number?.phoneNumber}</b>. Este paso se marca solo cuando el mensaje llegue.
            </p>
            <ul className="space-y-1">
              <li>{status.testReceived ? '✅' : '⏳'} Recibimos tu mensaje</li>
              <li>{status.botReplied ? '✅' : '⏳'} El bot respondió</li>
            </ul>
            {status.testReceived && !status.botReplied && (
              <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2">
                Tu mensaje llegó pero el bot aún no responde. Revisa el paso 4: el bot necesita su nombre y tu carta o base de conocimiento.
              </p>
            )}
          </>
        )}
      </StepShell>

      {/* 4 */}
      <StepShell n={4} title="Configura tu bot" done={done4} active={current === 4}>
        <ul className="space-y-1">
          <li>{status.botConfigured ? '✅' : '⬜'} Bot configurado (nombre, tono y menú)</li>
          <li>{status.hasMenuOrKnowledge ? '✅' : '⬜'} Carta o base de conocimiento cargada</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/plazbot" className="px-4 py-2 rounded-xl bg-text text-white text-xs font-black hover:opacity-90">Configurar mi bot</Link>
          <Link href="/carta" className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-black text-text hover:bg-gray-50">Cargar mi carta</Link>
          <Link href="/ia" className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-black text-text hover:bg-gray-50">Base de conocimiento</Link>
        </div>
      </StepShell>

      {done1 && (
        <button
          onClick={() => confirm('¿Pausar la conexión con Facebook para este local?') && toggleChannel(false)}
          disabled={toggling}
          className="text-xs font-bold text-text-muted underline hover:text-text"
        >
          Pausar la conexión con Facebook
        </button>
      )}
    </div>
  );
}
