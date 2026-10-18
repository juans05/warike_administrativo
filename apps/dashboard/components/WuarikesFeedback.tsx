'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Star } from 'lucide-react';
import { businessApi } from '../lib/api-client';
import { EmptyState } from './ui';
import { FeedbackInbox } from './feedback/FeedbackInbox';
import { useCustomerLabels } from '../hooks/useCustomerLabels';

/** Lista de opiniones de Wuarikes con respuesta; se usa cuando Google no está disponible. */
export default function WuarikesFeedbackList({ placeId }: { placeId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { customers } = useCustomerLabels();

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
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-text">Opiniones en Wuarikes</h2>
        <p className="mt-1 text-sm text-text-muted">
          Lo que tus {customers} dejaron al escanear tu QR o NFC{total ? ` · ${total} en total` : ''}.
        </p>
      </div>

      {failed ? (
        <div role="alert" className="flex items-center gap-2 rounded-card border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
          <AlertTriangle size={20} aria-hidden className="shrink-0" />
          No se pudieron cargar las opiniones. Recarga la página.
        </div>
      ) : (
        <FeedbackInbox
          items={items}
          loading={loading}
          placeId={placeId}
          onSaved={onSaved}
          emptyState={
            <EmptyState
              icon={Star}
              title="Aún no hay opiniones"
              description={`Aparecerán cuando tus ${customers} escaneen tu QR o NFC.`}
              headingLevel="h3"
            />
          }
        />
      )}

      {total > items.length && (
        <Link href="/feedback" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
          Ver todas las opiniones
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}
    </section>
  );
}
