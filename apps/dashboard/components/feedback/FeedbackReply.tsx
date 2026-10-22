'use client';

import { useState } from 'react';
import { MessageCircle, PenLine, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../../lib/api-client';
import { Button, Textarea, buttonStyles } from '../ui';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Solo para el texto de ayuda; el backend decide el canal real. */
function contactHint(contact: string | null | undefined, customer: string) {
  if (!contact) return `Este ${customer} no dejó contacto: la respuesta quedará guardada como nota.`;
  return EMAIL_RE.test(contact.trim())
    ? `Se enviará por correo a ${contact}.`
    : `Se guardará y podrás enviarla por WhatsApp a ${contact}.`;
}

/**
 * Responder una opinión dejada en Wuarikes (escaneo QR/NFC), con IA o a mano.
 * Nunca va a Google: es un mensaje privado al cliente.
 */
export function FeedbackReply({ placeId, feedback, onSaved }: {
  placeId: string;
  feedback: any;
  onSaved: (updated: any) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<'suggest' | 'send' | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const { customer } = useCustomerLabels();

  const open = async (withAi: boolean) => {
    setWhatsappUrl(null);
    setDraft(feedback.adminNotes || '');
    setEditing(true);
    if (!withAi) return;
    setBusy('suggest');
    try {
      const res = await businessApi.suggestFeedbackReply(placeId, feedback.id);
      setDraft(res.reply);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo generar la sugerencia. Escríbela a mano.');
    }
    setBusy(null);
  };

  const send = async () => {
    setBusy('send');
    try {
      const res = await businessApi.replyFeedback(placeId, feedback.id, draft.trim());
      onSaved(res.feedback);
      setEditing(false);
      if (res.channel === 'email') toast.success(`Respuesta enviada por correo al ${customer}`);
      else if (res.channel === 'whatsapp') {
        // El navegador bloquea abrir pestañas después de un await: se ofrece un botón.
        // Solo enlaces de WhatsApp: el href no puede apuntar a otro sitio ni a javascript:.
        setWhatsappUrl(isWhatsappLink(res.whatsappUrl) ? res.whatsappUrl : null);
        toast.success('Respuesta guardada. Pulsa "Enviar por WhatsApp" para mandarla.');
      } else toast.success('Respuesta guardada como nota');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo guardar la respuesta');
    }
    setBusy(null);
  };

  return (
    <div className="space-y-3">
      {feedback.adminNotes && !editing && (
        <div className="space-y-1 border-l-4 border-primary pl-4">
          <p className="text-xs font-medium text-primary-hover">Tu respuesta</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-text">{feedback.adminNotes}</p>
        </div>
      )}

      {whatsappUrl && !editing && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setWhatsappUrl(null)}
          className={buttonStyles('primary', 'md')}
        >
          <MessageCircle size={20} aria-hidden />
          Enviar por WhatsApp
        </a>
      )}

      {editing ? (
        <div className="space-y-3">
          <Textarea
            label={`Respuesta al ${customer}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={5}
            disabled={busy === 'suggest'}
            placeholder={busy === 'suggest' ? 'La IA está escribiendo una sugerencia...' : `Escribe tu respuesta al ${customer}...`}
            hint={contactHint(feedback.customerContact, customer)}
          />
          <div className="flex flex-wrap gap-2">
            <Button icon={Send} loading={busy === 'send'} disabled={busy !== null || !draft.trim()} onClick={send}>
              {busy === 'send' ? 'Guardando...' : 'Enviar respuesta'}
            </Button>
            <Button variant="secondary" icon={Sparkles} loading={busy === 'suggest'} disabled={busy !== null} onClick={() => open(true)}>
              {busy === 'suggest' ? 'Pensando...' : 'Otra sugerencia'}
            </Button>
            <Button variant="ghost" disabled={busy !== null} onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button icon={Sparkles} onClick={() => open(true)}>
            {feedback.adminNotes ? 'Nueva respuesta con IA' : 'Generar respuesta con IA'}
          </Button>
          <Button variant="secondary" icon={PenLine} onClick={() => open(false)}>
            {feedback.adminNotes ? 'Editar respuesta' : 'Escribir a mano'}
          </Button>
        </div>
      )}
    </div>
  );
}

function isWhatsappLink(url: unknown): url is string {
  try {
    const u = new URL(String(url));
    return u.protocol === 'https:' && (u.hostname === 'wa.me' || u.hostname === 'api.whatsapp.com') && !u.username;
  } catch { return false; }
}
