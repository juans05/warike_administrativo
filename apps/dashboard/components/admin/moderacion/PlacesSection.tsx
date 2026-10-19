'use client';

import { BadgeCheck, ExternalLink, Search, Store } from 'lucide-react';
import { Button, EmptyState, Input, buttonStyles, cn } from '../../ui';
import { InlineSelect } from '../InlineSelect';
import { SectionCard } from '../SectionCard';
import { LoadingRows, Table, Td, Tr } from '../Table';
import type { Place, Verticals } from './types';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending', label: 'Pendiente' },
];

/** Tipos de negocio agrupados por rubro; si el local trae uno que no está en la lista, se conserva como opción. */
function BusinessTypeSelect({ place, verticals, onChange }: { place: Place; verticals: Verticals; onChange(type: string): void }) {
  const known = verticals.some((v) => v.types.some((t) => t.key === place.businessType));
  return (
    <InlineSelect
      aria-label={`Tipo de negocio de ${place.name}`}
      value={place.businessType}
      onChange={(e) => onChange(e.target.value)}
    >
      {!known && <option value={place.businessType} disabled>{place.businessType || 'Sin tipo'}</option>}
      {verticals.map((vertical) => (
        <optgroup key={vertical.key} label={vertical.label}>
          {vertical.types.map((type) => (
            <option key={type.key} value={type.key}>{type.label}</option>
          ))}
        </optgroup>
      ))}
    </InlineSelect>
  );
}

export function PlacesSection({ places, total, loading, search, onSearch, verticals, onToggleVerified, onStatus, onBusinessType }: {
  places: Place[];
  total: number;
  loading: boolean;
  search: string;
  onSearch(value: string): void;
  verticals: Verticals;
  onToggleVerified(place: Place): void;
  onStatus(place: Place, status: string): void;
  onBusinessType(place: Place, businessType: string): void;
}) {
  return (
    <SectionCard
      title="Locales"
      subtitle={total > places.length ? `Se muestran ${places.length} de ${total}. Usa el buscador para encontrar otros.` : `${total} en total`}
      action={
        <div className="w-full sm:w-72">
          <Input label="Buscar local" type="search" placeholder="Nombre del local" value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
      }
    >
      {loading && places.length === 0 ? (
        <LoadingRows />
      ) : places.length === 0 ? (
        <EmptyState
          icon={search ? Search : Store}
          headingLevel="h3"
          title={search ? 'Sin resultados' : 'Todavía no hay locales'}
          description={search ? 'Prueba con otro nombre.' : 'Cuando se registren locales, los verás aquí.'}
        />
      ) : (
        <Table columns={['Local', 'Tipo de negocio', 'Categoría', 'Verificación', 'Estado', { label: 'Ver', align: 'right' }]}>
          {places.map((place) => (
            <Tr key={place.id}>
              <Td>
                <p className="font-semibold">{place.name}</p>
                <p className="text-xs text-text-muted">{place.district?.district || '—'}</p>
              </Td>
              <Td>
                {verticals.length > 0 ? (
                  <BusinessTypeSelect place={place} verticals={verticals} onChange={(type) => onBusinessType(place, type)} />
                ) : (
                  <span className="text-text-muted">{place.businessType}</span>
                )}
              </Td>
              <Td className="text-text-muted">{place.category?.name ?? 'Sin categoría'}</Td>
              <Td>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={BadgeCheck}
                  aria-pressed={place.isVerified}
                  className={cn(place.isVerified && 'text-success')}
                  onClick={() => onToggleVerified(place)}
                >
                  {place.isVerified ? 'Verificado' : 'No verificado'}
                </Button>
              </Td>
              <Td>
                <InlineSelect aria-label={`Estado de ${place.name}`} value={place.status} onChange={(e) => onStatus(place, e.target.value)}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </InlineSelect>
              </Td>
              <Td right>
                <a
                  href={`https://wuarike.com/place/${place.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ver en la app: ${place.name}`}
                  className={buttonStyles('ghost', 'sm', 'text-primary')}
                >
                  <ExternalLink size={16} aria-hidden />
                  Ver en la app
                </a>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </SectionCard>
  );
}
