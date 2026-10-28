'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, LogIn, Smartphone } from 'lucide-react';
import { businessApi } from '../lib/api-client';
import { Button } from './ui';

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

interface ConnectConfig {
  configured: boolean;
  appId: string;
  configId: string;
  graphVersion: string;
}

function loadFacebookSdk(appId: string, version: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.FB) return resolve();
    window.fbAsyncInit = () => {
      window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version });
      resolve();
    };
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.body.appendChild(script);
    }
  });
}

interface Props {
  placeId: string;
  onConnected: () => void;
}

// Embedded Signup de Meta: el dueño inicia sesión con Facebook, elige o crea su cuenta de WhatsApp
// Business y su número, y Meta nos devuelve un código + los IDs. El servidor hace el resto.
// Coexistencia: si el número ya está en la app de WhatsApp Business del celular, sigue funcionando ahí
// y el bot responde por la API al mismo tiempo (featureType whatsapp_business_app_onboarding).
export default function FacebookWhatsAppConnect({ placeId, onConnected }: Props) {
  const [config, setConfig] = useState<ConnectConfig | null>(null);
  const [busy, setBusy] = useState(false);
  // FB.login y el mensaje de Embedded Signup llegan por canales distintos y en cualquier orden:
  // se guardan los dos y se completa cuando están ambos.
  const session = useRef<{ code?: string; wabaId?: string; phoneNumberId?: string; coexistence?: boolean }>({});

  useEffect(() => {
    businessApi.getWhatsappConnectConfig().then(setConfig).catch(() => setConfig({ configured: false, appId: '', configId: '', graphVersion: 'v20.0' }));
  }, []);

  const tryComplete = async () => {
    const { code, wabaId, phoneNumberId, coexistence } = session.current;
    // En coexistencia Meta puede no mandar el número: el servidor lo busca en la cuenta.
    if (!code || !wabaId || (!phoneNumberId && !coexistence)) return;
    session.current = {};
    try {
      const res = await businessApi.completeWhatsappConnect({ placeId, code, wabaId, phoneNumberId, coexistence });
      toast.success(`WhatsApp conectado: +${res.phoneNumber}`);
      onConnected();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo conectar el número');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type !== 'WA_EMBEDDED_SIGNUP') return;
        if (data.event === 'FINISH' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
          session.current.wabaId = data.data?.waba_id;
          session.current.phoneNumberId = data.data?.phone_number_id;
          if (data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') session.current.coexistence = true;
          tryComplete();
        } else if (data.event === 'CANCEL') {
          session.current = {};
          setBusy(false);
        }
      } catch {
        /* mensajes de Facebook que no son JSON */
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  const start = async (coexistence: boolean) => {
    if (!config?.configured) return;
    setBusy(true);
    session.current = { coexistence };
    try {
      await loadFacebookSdk(config.appId, config.graphVersion);
      window.FB.login(
        (response: any) => {
          const code = response?.authResponse?.code;
          if (!code) {
            setBusy(false); // el usuario cerró la ventana o no aceptó
            return;
          }
          session.current.code = code;
          tryComplete();
        },
        {
          config_id: config.configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: { setup: {}, featureType: coexistence ? 'whatsapp_business_app_onboarding' : '', sessionInfoVersion: '3' },
        },
      );
    } catch {
      setBusy(false);
      toast.error('No se pudo abrir Facebook');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Inicia sesión con Facebook y conecta tu número. Los mensajes de tus clientes llegarán directo a Wuarikes, sin pasar
        por terceros.
      </p>
      {config && !config.configured ? (
        <p className="flex items-start gap-2 rounded-control border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm text-text">
          <AlertTriangle size={20} className="shrink-0 text-text-muted" aria-hidden />
          Esta conexión todavía no está habilitada. Avisa al equipo de Wuarikes para activarla.
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button icon={Smartphone} onClick={() => start(true)} loading={busy} disabled={!config}>
            {busy ? 'Conectando…' : 'Ya uso WhatsApp Business en mi celular'}
          </Button>
          <Button variant="secondary" icon={LogIn} onClick={() => start(false)} disabled={!config || busy}>
            Conectar un número nuevo
          </Button>
        </div>
      )}
    </div>
  );
}
