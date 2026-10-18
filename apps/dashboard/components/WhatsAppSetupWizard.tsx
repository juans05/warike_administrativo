'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';
import { CheckCircle2, Clock, PartyPopper, PauseCircle } from 'lucide-react';
import FacebookWhatsAppConnect from './FacebookWhatsAppConnect';
import { useRestaurant } from '../context/RestaurantContext';
import { Button, Card, ChecklistCard, Skeleton, buttonStyles, type ChecklistStep } from './ui';

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

// "Conecta tu WhatsApp en 4 pasos": cada paso se marca solo cuando el sistema detecta que de verdad se cumplió.
export default function WhatsAppSetupWizard({ placeId, onChanged }: { placeId: string; onChanged?: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [toggling, setToggling] = useState(false);
  const { activePlace } = useRestaurant();
  const catalog = activePlace?.verticalConfig?.labels.catalog ?? 'Carta';

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

  if (!status) return <Skeleton className="h-72 rounded-card" />;

  const current = !done1 ? 1 : !done2 ? 2 : !done3 ? 3 : !done4 ? 4 : 0;
  const steps: ChecklistStep[] = [
    { key: 'numero', label: 'Prepara tu número', done: done1 },
    { key: 'facebook', label: 'Conecta con Facebook', done: done2 },
    { key: 'prueba', label: 'Pruébalo', done: done3 },
    { key: 'bot', label: 'Configura tu bot', done: done4, action: { label: 'Configurar mi bot', href: '/plazbot' } },
  ];

  return (
    <div className="space-y-4">
      <ChecklistCard title="Conecta tu WhatsApp en 4 pasos" steps={steps} />

      {allDone && (
        <Card className="flex items-start gap-3">
          <PartyPopper size={24} className="shrink-0 text-success" aria-hidden />
          <p className="text-sm font-medium text-text">
            ¡Tu WhatsApp está listo! Tus clientes ya pueden escribirte a +{status.number?.phoneNumber} y el bot les responde.
          </p>
        </Card>
      )}

      {current === 1 && (
        <StepCard n={1} title="Prepara tu número">
          <ul className="list-disc space-y-1.5 pl-5">
            {REQUIREMENTS.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <p className="text-xs">Si Meta responde &quot;este número no cumple los requisitos para registrarse o migrar&quot;, ese número ya está en WhatsApp: prueba con otro.</p>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 pt-1">
            <input
              type="checkbox" checked={done1} disabled={toggling}
              onChange={(e) => toggleChannel(e.target.checked)}
              className="mt-0.5 h-5 w-5 accent-primary"
            />
            <span className="font-medium text-text">Tengo un número libre y quiero conectarlo con Facebook</span>
          </label>
        </StepCard>
      )}

      {current === 2 && (
        <StepCard n={2} title="Conecta con Facebook">
          {status.serverConfigured ? (
            <FacebookWhatsAppConnect placeId={placeId} onConnected={() => { refresh(); onChanged?.(); }} />
          ) : (
            <p className="rounded-control border border-secondary/40 bg-secondary/10 px-4 py-3 text-text">
              Esta conexión todavía no está habilitada. Avisa al equipo de Wuarikes para activarla.
            </p>
          )}
        </StepCard>
      )}

      {current === 3 && (
        <StepCard n={3} title="Pruébalo">
          <p>
            Desde tu WhatsApp personal, escríbele <b className="text-text">&quot;hola&quot;</b> a <b className="text-text">+{status.number?.phoneNumber}</b>. Este paso se marca solo cuando el mensaje llegue.
          </p>
          <ul className="space-y-1">
            <CheckLine done={status.testReceived} label="Recibimos tu mensaje" />
            <CheckLine done={status.botReplied} label="El bot respondió" />
          </ul>
          {status.testReceived && !status.botReplied && (
            <p className="rounded-control border border-secondary/40 bg-secondary/10 px-3 py-2 text-xs text-text">
              Tu mensaje llegó pero el bot aún no responde. Revisa el paso 4: el bot necesita su nombre y tu {catalog.toLowerCase()} o base de conocimiento.
            </p>
          )}
        </StepCard>
      )}

      {current === 4 && (
        <StepCard n={4} title="Configura tu bot">
          <ul className="space-y-1">
            <CheckLine done={status.botConfigured} label="Bot configurado (nombre, tono y menú)" />
            <CheckLine done={status.hasMenuOrKnowledge} label={`${catalog} o base de conocimiento cargada`} />
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/plazbot" className={buttonStyles('primary', 'sm')}>Configurar mi bot</Link>
            <Link href="/carta" className={buttonStyles('secondary', 'sm')}>Cargar mi {catalog.toLowerCase()}</Link>
            <Link href="/ia" className={buttonStyles('secondary', 'sm')}>Base de conocimiento</Link>
          </div>
        </StepCard>
      )}

      {done1 && (
        <Button
          variant="ghost"
          size="sm"
          icon={PauseCircle}
          onClick={() => confirm('¿Pausar la conexión con Facebook para este local?') && toggleChannel(false)}
          disabled={toggling}
        >
          Pausar la conexión con Facebook
        </Button>
      )}
    </div>
  );
}

function StepCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card padding="lg">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{n}</span>
        <h3 className="text-base font-semibold text-text">Paso {n}: {title}</h3>
      </div>
      <div className="mt-4 space-y-3 text-sm text-text-muted sm:pl-11">{children}</div>
    </Card>
  );
}

function CheckLine({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {done ? <CheckCircle2 size={16} className="text-success" aria-hidden /> : <Clock size={16} className="text-text-muted" aria-hidden />}
      <span className={done ? 'text-text' : undefined}>{label}</span>
      <span className="sr-only">{done ? '(listo)' : '(pendiente)'}</span>
    </li>
  );
}
