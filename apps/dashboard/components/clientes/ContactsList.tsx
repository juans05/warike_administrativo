'use client';

import { Search, Upload, Users } from 'lucide-react';
import type { Contact } from '../../lib/api-client';
import { maskPhone } from '../../lib/mask';
import { Badge, Button, DataList, EmptyState } from '../ui';
import { ClientRow, Pager, SOURCE_LABEL, displayName } from './parts';

interface ContactsListProps {
  contacts: Contact[];
  meta: { total: number; page: number; totalPages: number };
  loading: boolean;
  /** Texto buscado: distingue "aún no hay contactos" de "la búsqueda no encontró nada". */
  search: string;
  /** Etiqueta del rubro en plural y minúsculas ("clientes", "pacientes"). */
  customers: string;
  selectedId: string | null;
  onSelect: (contact: Contact) => void;
  onPageChange: (page: number) => void;
  onImport: () => void;
}

export function ContactsList({ contacts, meta, loading, search, customers, selectedId, onSelect, onPageChange, onImport }: ContactsListProps) {
  const empty = search ? (
    <EmptyState icon={Search} title="Sin resultados" description="Prueba con otro nombre." />
  ) : (
    <EmptyState
      icon={Users}
      title={`Aún no tienes ${customers}`}
      description="Importa tu base desde un archivo o sincroniza los que ya te escribieron."
      action={<Button icon={Upload} onClick={onImport}>Importar {customers}</Button>}
    />
  );

  return (
    <div className={loading ? 'px-4' : undefined}>
      {!loading && contacts.length > 0 && (
        <p className="px-4 py-2 text-xs tabular-nums text-text-muted">{meta.total} en total</p>
      )}
      <DataList
        items={contacts}
        loading={loading}
        empty={empty}
        renderItem={(contact) => (
          <ClientRow
            title={displayName(contact.name, contact.phone)}
            subtitle={contact.phone ? maskPhone(contact.phone) : contact.email || 'Sin datos de contacto'}
            selected={contact.id === selectedId}
            onSelect={() => onSelect(contact)}
            aside={<Badge>{SOURCE_LABEL[contact.source] ?? contact.source}</Badge>}
          />
        )}
      />
      <Pager page={meta.page} totalPages={meta.totalPages} onPage={onPageChange} />
    </div>
  );
}
