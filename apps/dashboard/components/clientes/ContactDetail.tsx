'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, Gift, MessageCircle, ShoppingBag, type LucideIcon } from 'lucide-react';
import { businessApi, type ContactProfile, type ContactTimelineEntry } from '../../lib/api-client';
import { Button, EmptyState, Skeleton } from '../ui';
import { LoyaltyCardSection } from './LoyaltyCardSection';
import { ContactAssetsSection } from './ContactAssetsSection';
import { useRestaurant } from '../../context/RestaurantContext';
import { ClientHeader, ConsentRow, SOURCE_LABEL, SectionTitle, formatDate, formatSoles } from './parts';

const KIND_ICON: Record<ContactTimelineEntry['kind'], LucideIcon> = {
  order: ShoppingBag,
  conversation: MessageCircle,
  loyalty: Gift,
};

/** Ficha del cliente: datos, consentimientos, tarjeta y línea de tiempo (pedidos, conversaciones, fidelización). */
export function ContactDetail({ placeId, contactId }: { placeId: string; contactId: string }) {
  const [profile, setProfile] = useState<ContactProfile | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const assetKind = useRestaurant().activePlace?.verticalConfig?.assetKind ?? null;

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setFailed(false);
    businessApi.getContactProfile(placeId, contactId)
      .then((res) => { if (!cancelled) setProfile(res); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [placeId, contactId, attempt]);

  if (failed) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No pudimos cargar la ficha"
        description="Revisa tu conexión e inténtalo de nuevo."
        action={<Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>Reintentar</Button>}
      />
    );
  }

  if (!profile) {
    return (
      <div role="status" aria-label="Cargando" className="space-y-5 p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="w-1/3" />
          </div>
        </div>
        <Skeleton className="h-24" />
        <Skeleton className="h-16" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const { contact, loyaltyCard, timeline } = profile;
  const facts: [string, string][] = [
    ['Email', contact.email || '—'],
    ['DNI', contact.dni || '—'],
    ['Origen', SOURCE_LABEL[contact.source] ?? contact.source],
    ['Registrado', formatDate(contact.createdAt)],
  ];

  return (
    <div className="space-y-6 p-5">
      <ClientHeader name={contact.name} phone={contact.phone} />

      <section className="space-y-3">
        <SectionTitle>Datos</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {facts.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-text-muted">{label}</dt>
              <dd className="break-words text-sm text-text">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <SectionTitle>Consentimientos</SectionTitle>
        <div className="divide-y divide-border">
          <ConsentRow label="Promociones (contacto)" granted={contact.marketingConsent} />
          <ConsentRow label="Promociones (tarjeta)" granted={loyaltyCard ? loyaltyCard.marketingConsent : null} />
        </div>
      </section>

      {assetKind && contact.phone && <ContactAssetsSection placeId={placeId} kind={assetKind} phone={contact.phone} customerName={contact.name} />}

      {loyaltyCard && <LoyaltyCardSection placeId={placeId} card={loyaltyCard} />}

      <section>
        <SectionTitle>Historial</SectionTitle>
        {timeline.length === 0 ? (
          <EmptyState
            icon={Clock}
            headingLevel="h4"
            title="Sin movimientos todavía"
            description="Aquí verás sus pedidos, conversaciones y visitas."
          />
        ) : (
          // La API devuelve la línea de tiempo de la más reciente a la más antigua.
          <ol className="divide-y divide-border">
            {timeline.map((entry, i) => {
              const Icon = KIND_ICON[entry.kind];
              return (
                <li key={`${entry.at}-${i}`} className="flex items-start gap-3 py-3">
                  <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text">{entry.title}</p>
                    <p className="text-xs text-text-muted">{formatDate(entry.at, true)}</p>
                  </div>
                  {entry.amount != null && (
                    <span className="text-sm font-medium tabular-nums text-text">{formatSoles(entry.amount)}</span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
