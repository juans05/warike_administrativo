'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Gift } from 'lucide-react';
import { fetchWithAuth, type LoyaltyCard } from '../../lib/api-client';
import { maskPhone } from '../../lib/mask';
import { Badge, Button, DataList, EmptyState } from '../ui';
import { ClientRow, LEVEL_LABEL, LEVEL_TONE, Pager, displayName } from './parts';

interface LoyaltyClientsListProps {
  placeId: string;
  /** Etiqueta del rubro en plural y minúsculas ("clientes", "pacientes"). */
  customers: string;
  selectedId: string | null;
  onSelect: (card: LoyaltyCard) => void;
}

/** Quienes tienen tarjeta de fidelización. Se pide solo al abrir la pestaña. */
export function LoyaltyClientsList({ placeId, customers, selectedId, onSelect }: LoyaltyClientsListProps) {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetchWithAuth(`/business/places/${placeId}/loyalty/clients?page=${page}`)
      .then((res) => {
        if (cancelled) return;
        setCards(res.data || []);
        setMeta(res.meta || { total: 0, page: 1, totalPages: 1 });
      })
      .catch(() => { if (!cancelled) { setCards([]); setFailed(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [placeId, page, attempt]);

  return (
    <div className={loading ? 'px-4' : undefined}>
      {!loading && cards.length > 0 && (
        <p className="px-4 py-2 text-xs tabular-nums text-text-muted">{meta.total} en total</p>
      )}
      <DataList
        items={cards}
        loading={loading}
        empty={
          failed ? (
            <EmptyState
              icon={AlertCircle}
              title="No pudimos cargar la lista"
              description="Revisa tu conexión e inténtalo de nuevo."
              action={<Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>Reintentar</Button>}
            />
          ) : (
            <EmptyState
              icon={Gift}
              title={`Aún no hay ${customers} con tarjeta`}
              description="Cuando activen su tarjeta de fidelización aparecerán aquí."
            />
          )
        }
        renderItem={(card) => (
          <ClientRow
            title={displayName(card.customerName, card.customerPhone)}
            subtitle={`${maskPhone(card.customerPhone)} · ${card.totalVisits} visitas · ${card.stamps} sellos`}
            selected={card.id === selectedId}
            onSelect={() => onSelect(card)}
            aside={<Badge tone={LEVEL_TONE[card.level]}>{LEVEL_LABEL[card.level]}</Badge>}
          />
        )}
      />
      <Pager page={page} totalPages={meta.totalPages} onPage={setPage} />
    </div>
  );
}
