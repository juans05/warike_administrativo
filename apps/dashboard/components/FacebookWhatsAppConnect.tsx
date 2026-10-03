'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';

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
export default function FacebookWhatsAppConnect({ placeId, onConnected }: Props) {
  const [config, setConfig] = useState<ConnectConfig | null>(null);
  const [busy, setBusy] = useState(false);
  // FB.login y el mensaje de Embedded Signup llegan por canales distintos y en cualquier orden:
  // se guardan los dos y se completa cuando están ambos.
  const session = useRef<{ code?: string; wabaId?: string; phoneNumberId?: string }>({});

  useEffect(() => {
    businessApi.getWhatsappConnectConfig().then(setConfig).catch(() => setConfig({ configured: false, appId: '', configId: '', graphVersion: 'v20.0' }));
  }, []);

  const tryComplete = async () => {
    const { code, wabaId, phoneNumberId } = session.current;
    if (!code || !wabaId || !phoneNumberId) return;
    session.current = {};
    try {
      const res = await businessApi.completeWhatsappConnect({ placeId, code, wabaId, phoneNumberId });
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
        if (data.event === 'FINISH') {
          session.current.wabaId = data.data?.waba_id;
          session.current.phoneNumberId = data.data?.phone_number_id;
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

  const start = async () => {
    if (!config?.configured) return;
    setBusy(true);
    session.current = {};
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
          extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
        },
      );
    } catch {
      setBusy(false);
      toast.error('No se pudo abrir Facebook');
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white text-3xl font-black shrink-0">f</div>
        <div>
          <h2 className="font-black text-text text-lg">Conecta tu WhatsApp con Facebook</h2>
          <p className="text-sm text-text-muted mt-1">
            Inicia sesión con Facebook, elige o crea tu cuenta de WhatsApp Business y tu número. Los mensajes de tus clientes
            llegarán directo a Wuarikes, sin pasar por terceros.
          </p>
        </div>
      </div>

      {config && !config.configured ? (
        <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
          Esta conexión todavía no está habilitada. Avisa al equipo de Wuarikes para activarla.
        </p>
      ) : (
        <button
          onClick={start}
          disabled={busy || !config}
          className="bg-[#1877F2] text-white px-8 py-4 rounded-2xl font-black hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {busy ? 'Conectando…' : 'Conectar con Facebook'}
        </button>
      )}
    </div>
  );
}
