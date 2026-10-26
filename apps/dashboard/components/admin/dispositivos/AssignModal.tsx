'use client';

import { useEffect, useId, useState } from 'react';
import { Info, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, businessApi, publicApi, qrApi, type AssignQrPayload, type BusinessTypesResponse } from '../../../lib/api-client';
import { Button, Input, Modal, Select, Tabs, controlStyles } from '../../ui';
import { DESTINATION_LABELS } from './constants';

type Destination = 'REPUTATION' | 'MENU' | 'CUSTOM_URL';

/** Asigna o reasigna un QR a un local existente o a uno que se crea en el momento. Se monta solo mientras está abierto. */
export function AssignModal({ qrCode, mode, places, onClose, onDone }: {
  qrCode: any;
  mode: 'assign' | 'reassign';
  places: any[];
  onClose(): void;
  onDone(): void;
}) {
  const listId = useId();
  const [creatingNew, setCreatingNew] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [newPlace, setNewPlace] = useState({ name: '', businessType: 'restaurante', categoryId: '', district: '', address: '', phone: '' });
  const [verticals, setVerticals] = useState<BusinessTypesResponse['verticals']>([]);
  // Las categorías dependen del rubro del tipo elegido.
  const vertical = verticals.find((v) => v.types.some((t) => t.key === newPlace.businessType))?.key ?? 'gastronomia';
  const [destinationType, setDestinationType] = useState<Destination>('REPUTATION');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    businessApi.getBusinessTypes().then((r) => setVerticals(r.verticals)).catch(() => setVerticals([]));
  }, []);
  useEffect(() => {
    publicApi.getCategories(vertical).then(setCategories).catch(() => setCategories([]));
  }, [vertical]);

  // `places` es solo la primera página (10 locales): la búsqueda va al servidor, que busca en todos.
  const [found, setFound] = useState<any[] | null>(null);
  useEffect(() => {
    const q = placeSearch.trim();
    if (!q) { setFound(null); return; }
    const t = setTimeout(() => {
      adminApi.getPlaces(1, q)
        .then((r) => {
          const list = r.data || [];
          setFound(list);
          if (list.length === 1) setPlaceId(list[0].id); // un solo resultado: queda elegido
        })
        .catch(() => setFound([]));
    }, 300);
    return () => clearTimeout(t);
  }, [placeSearch]);
  const filteredPlaces = found ?? places;

  const handleSubmit = async () => {
    if (!creatingNew && !placeId) {
      toast.error('Selecciona un local o crea uno nuevo');
      return;
    }
    if (creatingNew && (!newPlace.name || !newPlace.categoryId || !newPlace.district)) {
      toast.error('Completa nombre, categoría y distrito del local nuevo');
      return;
    }
    if (destinationType === 'CUSTOM_URL' && !destinationUrl) {
      toast.error('Ingresa la URL de destino');
      return;
    }

    const payload: AssignQrPayload = creatingNew
      ? { newPlace, destinationType, destinationUrl: destinationUrl || undefined, reason: reason || undefined }
      : { placeId, destinationType, destinationUrl: destinationUrl || undefined, reason: reason || undefined };

    setSaving(true);
    try {
      if (mode === 'assign') {
        await qrApi.assign(qrCode.id, payload);
      } else {
        await qrApi.reassign(qrCode.id, payload);
      }
      toast.success(mode === 'assign' ? 'QR asignado' : 'QR reasignado');
      onDone();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar la asignación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${mode === 'assign' ? 'Asignar' : 'Reasignar'} ${qrCode.code}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button icon={Link2} loading={saving} onClick={handleSubmit}>
            {saving ? 'Guardando...' : mode === 'assign' ? 'Asignar QR' : 'Confirmar reasignación'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {mode === 'reassign' && qrCode.currentPlaceName && (
          <p className="flex items-start gap-2 rounded-control border border-secondary/50 bg-secondary/10 px-3 py-2 text-sm text-text">
            <Info size={16} aria-hidden className="mt-0.5 shrink-0" />
            <span>
              Este QR está asignado a <strong>{qrCode.currentPlaceName}</strong>. Al reasignarlo, los siguientes escaneos irán al nuevo destino.
            </span>
          </p>
        )}

        <div className="space-y-3">
          <Tabs
            aria-label="Local de destino"
            tabs={[{ key: 'existing', label: 'Local existente' }, { key: 'new', label: 'Crear local nuevo' }]}
            value={creatingNew ? 'new' : 'existing'}
            onChange={(key) => setCreatingNew(key === 'new')}
          />

          {!creatingNew ? (
            <div className="space-y-3">
              <Input label="Buscar local" type="search" placeholder="Nombre del local" value={placeSearch} onChange={(e) => setPlaceSearch(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor={listId} className="text-sm font-medium text-text">Local</label>
                <select id={listId} value={placeId} onChange={(e) => setPlaceId(e.target.value)} size={5} className={controlStyles(undefined, 'py-2')}>
                  {filteredPlaces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {found?.length === 0 && <p className="text-xs text-text-muted">Ningún local se llama así. Revisa el nombre o créalo en &quot;Crear local nuevo&quot;.</p>}
                {!placeSearch.trim() && <p className="text-xs text-text-muted">Escribe el nombre para buscar entre todos los locales.</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Input label="Nombre del local" type="text" value={newPlace.name} onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })} />
              <Select
                label="Tipo de negocio"
                value={newPlace.businessType}
                onChange={(e) => setNewPlace({ ...newPlace, businessType: e.target.value, categoryId: '' })}
              >
                {verticals.length === 0 && <option value="restaurante">Restaurante</option>}
                {verticals.map((v) => (
                  <optgroup key={v.key} label={v.label}>
                    {v.types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </optgroup>
                ))}
              </Select>
              <Select
                label="Categoría"
                value={newPlace.categoryId}
                onChange={(e) => setNewPlace({ ...newPlace, categoryId: e.target.value })}
              >
                <option value="">Elige una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <Input label="Distrito" type="text" placeholder="Ej. Miraflores" value={newPlace.district} onChange={(e) => setNewPlace({ ...newPlace, district: e.target.value })} />
              <Input label="Dirección (opcional)" type="text" value={newPlace.address} onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })} />
              <Input label="Teléfono (opcional)" type="tel" value={newPlace.phone} onChange={(e) => setNewPlace({ ...newPlace, phone: e.target.value })} />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Select label="Tipo de destino" value={destinationType} onChange={(e) => setDestinationType(e.target.value as Destination)}>
            {Object.entries(DESTINATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          {destinationType === 'CUSTOM_URL' && (
            <Input label="URL de destino" type="text" placeholder="https://..." value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} />
          )}
        </div>

        {mode === 'reassign' && (
          <Input label="Motivo (opcional)" type="text" placeholder="Ej: el negocio anterior cerró" value={reason} onChange={(e) => setReason(e.target.value)} />
        )}
      </div>
    </Modal>
  );
}
