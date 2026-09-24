'use client';

import React, { useEffect, useState } from 'react';
import { businessApi } from '../lib/api-client';
import { toast } from 'sonner';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Solo para el texto de ayuda; el backend decide el canal real. */
function contactHint(contact?: string | null) {
  if (!contact) return 'Este cliente no dejó contacto: la respuesta quedará guardada como nota.';
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
      if (res.channel === 'email') toast.success('Respuesta enviada por correo al cliente');
      else if (res.channel === 'whatsapp') {
        // El navegador bloquea abrir pestañas después de un await: se ofrece un botón.
        setWhatsappUrl(res.whatsappUrl);
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
        <div className="border-l-4 border-primary pl-4 space-y-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Tu respuesta</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{feedback.adminNotes}</p>
        </div>
      )}

      {whatsappUrl && !editing && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setWhatsappUrl(null)}
          className="inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-green-700"
        >
          💬 Enviar por WhatsApp
        </a>
      )}

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={4}
            disabled={busy === 'suggest'}
            placeholder={busy === 'suggest' ? 'La IA está escribiendo una sugerencia...' : 'Escribe tu respuesta al cliente...'}
            aria-label="Respuesta al cliente"
            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none disabled:bg-gray-50"
          />
          <p className="text-[11px] text-gray-500">{contactHint(feedback.customerContact)}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={send}
              disabled={busy !== null || !draft.trim()}
              className="bg-primary text-white px-4 py-2 rounded-lg font-semibold text-xs disabled:opacity-50"
            >
              {busy === 'send' ? 'Guardando...' : 'Enviar respuesta'}
            </button>
            <button
              onClick={() => open(true)}
              disabled={busy !== null}
              className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold text-xs disabled:opacity-50"
            >
              {busy === 'suggest' ? 'Pensando...' : '✨ Otra sugerencia'}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={busy !== null}
              className="text-gray-500 px-3 py-2 text-xs font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => open(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold text-xs hover:opacity-90"
          >
            ✨ {feedback.adminNotes ? 'Nueva respuesta con IA' : 'Responder con IA'}
          </button>
          <button
            onClick={() => open(false)}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-xs hover:border-primary"
          >
            ✍️ {feedback.adminNotes ? 'Editar respuesta' : 'Responder manual'}
          </button>
        </div>
      )}
    </div>
  );
}

/** Lista de opiniones de Wuarikes con respuesta; se usa cuando Google no está disponible. */
export default function WuarikesFeedbackList({ placeId, notice }: { placeId: string; notice?: React.ReactNode }) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    businessApi.getFeedback(placeId)
      .then((res: any) => { setItems(res?.data || []); setTotal(res?.meta?.total || 0); })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [placeId]);

  const onSaved = (updated: any) => setItems((prev) => prev.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-[var(--text)] font-warike italic">Opiniones en Wuarikes</h2>
        <p className="text-[var(--text-muted)] font-bold text-sm mt-1">
          Lo que tus clientes dejaron al escanear tu QR o NFC{total ? ` · ${total} en total` : ''}
        </p>
      </div>
      {notice}

      {loading ? (
        <div className="text-center py-10 font-bold text-gray-400">Cargando opiniones...</div>
      ) : failed ? (
        <p className="text-sm font-bold text-red-600">No se pudieron cargar las opiniones. Recarga la página.</p>
      ) : items.length === 0 ? (
        <div className="bg-gray-50 p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
          <p className="text-gray-400 font-bold italic">Aún no hay opiniones. Aparecerán cuando tus clientes escaneen tu QR o NFC.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((f) => (
            <div key={f.id} className={`bg-white p-6 rounded-[2rem] border shadow-sm space-y-4 ${f.rating <= 3 && f.status === 'pending' ? 'border-red-200' : 'border-[var(--border)]'}`}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-black text-[var(--text)]">{f.customerName || 'Cliente anónimo'}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    {new Date(f.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 text-sm" aria-label={`${f.rating} estrellas`}>
                    {'★'.repeat(f.rating)}<span className="text-gray-200">{'★'.repeat(5 - f.rating)}</span>
                  </div>
                  {f.rating <= 3 && (
                    <span className={`text-[9px] font-black uppercase tracking-widest ${f.status === 'pending' ? 'text-red-600' : 'text-green-600'}`}>
                      {f.status === 'pending' ? 'Queja pendiente' : f.status === 'contacted' ? 'Respondida' : 'Resuelta'}
                    </span>
                  )}
                </div>
              </div>
              {f.comment && <p className="text-sm text-gray-700 italic leading-relaxed">“{f.comment}”</p>}
              <FeedbackReply placeId={placeId} feedback={f} onSaved={onSaved} />
            </div>
          ))}
        </div>
      )}

      {total > items.length && (
        <a href="/feedback" className="block text-center text-[11px] font-black text-primary uppercase tracking-widest hover:underline">
          Ver todas las opiniones →
        </a>
      )}
    </div>
  );
}
