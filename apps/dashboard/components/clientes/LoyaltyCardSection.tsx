'use client';

import { useEffect, useState } from 'react';
import { Badge, StatTile } from '../ui';
import { fetchWithAuth, type LoyaltyCard } from '../../lib/api-client';
import { ClientHeader, ConsentRow, LEVEL_LABEL, LEVEL_TONE, SectionTitle, formatDate } from './parts';

interface LoyaltyTransaction {
  id: string;
  type: 'earn' | 'redeem';
  description: string;
  stamps?: number;
  points?: number;
}

/** Nivel, sellos, puntos y últimos movimientos de una tarjeta de fidelización. */
export function LoyaltyCardSection({ placeId, card }: { placeId: string; card: LoyaltyCard }) {
  const [history, setHistory] = useState<LoyaltyTransaction[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth(`/business/places/${placeId}/loyalty/clients/${card.id}/transactions`)
      .then((txs) => { if (!cancelled) setHistory(Array.isArray(txs) ? txs : []); })
      .catch(() => { if (!cancelled) setHistory([]); });
    return () => { cancelled = true; };
  }, [placeId, card.id]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>Tarjeta de fidelización</SectionTitle>
        <Badge tone={LEVEL_TONE[card.level]}>{LEVEL_LABEL[card.level]}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Visitas" value={card.totalVisits} />
        <StatTile label="Sellos" value={card.stamps} />
        <StatTile label="Puntos" value={card.points} />
        <StatTile label="Canjeados" value={card.totalRedeemed} />
      </div>
      {card.lastVisitAt && (
        <p className="text-sm text-text-muted">Última visita: {formatDate(card.lastVisitAt)}</p>
      )}
      {history.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text">Movimientos recientes</h4>
          <ul className="divide-y divide-border">
            {history.slice(0, 5).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-text">{tx.description}</span>
                <span className={`text-sm font-medium tabular-nums ${tx.type === 'earn' ? 'text-success' : 'text-text'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.stamps || tx.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Detalle de un cliente de la pestaña "Con tarjeta": la tarjeta y su consentimiento, sin ficha de contacto. */
export function LoyaltyCardDetail({ placeId, card }: { placeId: string; card: LoyaltyCard }) {
  return (
    <div className="space-y-6 p-5">
      <ClientHeader name={card.customerName} phone={card.customerPhone} />
      <section>
        <SectionTitle>Consentimiento</SectionTitle>
        <ConsentRow label="Promociones (tarjeta)" granted={card.marketingConsent} />
      </section>
      <LoyaltyCardSection placeId={placeId} card={card} />
    </div>
  );
}
