'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Upload, Users } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import type { LoyaltyCard } from '../../../lib/api-client';
import { plural } from '../../../lib/modules';
import { useContacts } from '../../../hooks/useContacts';
import { Button, EmptyState, InboxLayout, Input, PageHeader, Tabs } from '../../../components/ui';
import { ContactsList } from '../../../components/clientes/ContactsList';
import { ContactsUploadModal } from '../../../components/clientes/ContactsUploadModal';
import { ContactDetail } from '../../../components/clientes/ContactDetail';
import { LoyaltyClientsList } from '../../../components/clientes/LoyaltyClientsList';
import { LoyaltyCardDetail } from '../../../components/clientes/LoyaltyCardSection';

type View = 'contactos' | 'tarjeta';

const VIEWS = [
  { key: 'contactos', label: 'Todos' },
  { key: 'tarjeta', label: 'Con tarjeta' },
];

export default function ClientesPage() {
  const { activePlaceId } = useRestaurant();
  // Al cambiar de local se vuelve a montar todo: página, búsqueda, selección y lista no arrastran nada del anterior.
  return <ClientesContent key={activePlaceId ?? 'none'} />;
}

function ClientesContent() {
  const { activePlaceId, activePlace } = useRestaurant();
  const customer = activePlace?.verticalConfig?.labels.customer ?? 'Cliente';
  const customers = plural(customer).toLowerCase();

  const [view, setView] = useState<View>('contactos');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [contactsPage, setContactsPage] = useState(1);

  const {
    contacts, meta, loadingContacts,
    showUploadModal, setShowUploadModal, uploading, lastImportResult, setLastImportResult, syncing,
    loadContacts, loadImports, handleUploadFile, handleSync,
  } = useContacts({ one: customer.toLowerCase(), many: customers });

  // La búsqueda espera a que se deje de escribir y vuelve a la primera página.
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setContactsPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!activePlaceId) return;
    loadContacts(activePlaceId, contactsPage, search);
  }, [activePlaceId, contactsPage, search]);

  useEffect(() => {
    if (activePlaceId) loadImports(activePlaceId);
  }, [activePlaceId]);

  const changeView = (key: string) => {
    setView(key as View);
    setSelectedContactId(null);
    setSelectedCard(null);
  };

  // Importar y sincronizar recargan la lista completa (sin búsqueda, página 1); la pantalla se alinea con eso.
  const showAll = () => { setView('contactos'); setSearchInput(''); setSearch(''); setContactsPage(1); };

  const list = (
    <>
      <div className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="px-2"><Tabs tabs={VIEWS} value={view} onChange={changeView} aria-label={`Lista de ${customers}`} /></div>
        {view === 'contactos' && (
          <div className="p-3">
            <Input
              label="Buscar"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Nombre del ${customer.toLowerCase()}`}
            />
          </div>
        )}
      </div>
      {view === 'contactos' ? (
        <ContactsList
          contacts={contacts}
          meta={meta}
          loading={loadingContacts && !!activePlaceId}
          search={search}
          customers={customers}
          selectedId={selectedContactId}
          onSelect={(contact) => setSelectedContactId(contact.id)}
          onPageChange={setContactsPage}
          onImport={() => setShowUploadModal(true)}
        />
      ) : (
        activePlaceId && (
          <LoyaltyClientsList
            placeId={activePlaceId}
            customers={customers}
            selectedId={selectedCard?.id ?? null}
            onSelect={setSelectedCard}
          />
        )
      )}
    </>
  );

  let detail: React.ReactNode = null;
  if (activePlaceId && view === 'contactos' && selectedContactId) {
    detail = <ContactDetail key={selectedContactId} placeId={activePlaceId} contactId={selectedContactId} />;
  } else if (activePlaceId && view === 'tarjeta' && selectedCard) {
    detail = <LoyaltyCardDetail key={selectedCard.id} placeId={activePlaceId} card={selectedCard} />;
  }

  return (
    <>
      <PageHeader
        title={plural(customer)}
        subtitle="Quiénes te compran, te escriben o se unieron a tu programa."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={RefreshCw}
              loading={syncing}
              onClick={() => { if (activePlaceId) { showAll(); handleSync(activePlaceId); } }}
              title="Trae contactos nuevos desde tus conversaciones de WhatsApp y las reseñas con email o teléfono"
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Button icon={Upload} onClick={() => setShowUploadModal(true)}>Importar {customers}</Button>
          </div>
        }
      />

      <InboxLayout
        list={list}
        detail={detail}
        emptyDetail={
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={Users}
              title={`Selecciona un ${customer.toLowerCase()}`}
              description="Verás sus datos, su tarjeta y su historial."
            />
          </div>
        }
        onCloseDetail={() => { setSelectedContactId(null); setSelectedCard(null); }}
      />

      <ContactsUploadModal
        open={showUploadModal}
        onClose={() => { setShowUploadModal(false); setLastImportResult(null); }}
        onUpload={(file) => {
          if (!activePlaceId) return;
          showAll();
          handleUploadFile(activePlaceId, file);
        }}
        uploading={uploading}
        lastResult={lastImportResult}
        customers={customers}
      />
    </>
  );
}
