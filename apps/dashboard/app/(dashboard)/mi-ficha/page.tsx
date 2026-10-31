'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi, type BusinessTypesResponse } from '../../../lib/api-client';
import { Button, Card, Input, Modal, PageHeader, Select, Skeleton, cn } from '../../../components/ui';
import { DEFAULT_SCHEDULES, ScheduleEditor } from '../../../components/mi-ficha/ScheduleEditor';
import { MapSelector } from '../../../components/mi-ficha/MapSelector';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const FALLBACK_AMENITIES = [
  { id: '1', name: 'Wifi Gratis' },
  { id: '2', name: 'Cochera' },
  { id: '3', name: 'Aire Acondicionado' },
  { id: '4', name: 'Mascotas' },
  { id: '5', name: 'Estacionamiento' },
  { id: '6', name: 'Terraza' },
  { id: '7', name: 'Música en Vivo' },
  { id: '8', name: 'Juegos de Mesa' },
];

// Stable reference: MapSelector re-geocodes whenever this callback changes.
const ignoreLocation = () => {};

export default function MiFichaPage() {
  const { activePlaceId, activePlace, refreshPlaces } = useRestaurant();
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    categoriaId: '',
    departamento: '',
    provincia: '',
    distrito: '',
    ubigeoCode: '',
    ubigeoId: '',
    horarios: DEFAULT_SCHEDULES,
    precio: '',
    foto: '',
    amenityIds: [] as string[]
  });

  const [dbDepartments, setDbDepartments] = useState<string[]>([]);
  const [dbProvinces, setDbProvinces] = useState<string[]>([]);
  const [dbDistricts, setDbDistricts] = useState<any[]>([]);
  const [dbSpainCommunities, setDbSpainCommunities] = useState<string[]>([]);
  const [dbSpainProvinces, setDbSpainProvinces] = useState<string[]>([]);
  const [dbSpainMunicipalities, setDbSpainMunicipalities] = useState<string[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbAmenities, setDbAmenities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [country, setCountry] = useState<'PE' | 'ES'>('PE');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isLoadingProfile = useRef(false);

  // Tipo de negocio: el guardado (savedType) y el elegido en el formulario.
  const [verticals, setVerticals] = useState<BusinessTypesResponse['verticals']>([]);
  const [savedType, setSavedType] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /** User edits go through here so the sticky "Guardar" bar only shows real changes. */
  const update = (patch: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
    setIsDirty(true);
  };

  const verticalOf = (type: string) => verticals.find(v => v.types.some(t => t.key === type));
  const typeChanged = businessType !== savedType;
  const verticalChanged = typeChanged && verticalOf(businessType)?.key !== verticalOf(savedType)?.key;

  // Fetch Core Data
  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch(`${API_BASE}/api/ubigeo/departments`, { headers })
      .then(res => res.json())
      .then(data => setDbDepartments(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    businessApi.getBusinessTypes()
      .then(res => setVerticals(res.verticals ?? []))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/places/amenities`, { headers })
      .then(res => res.json())
      .then(data => setDbAmenities(Array.isArray(data) && data.length > 0 ? data : FALLBACK_AMENITIES))
      .catch(err => {
        console.error(err);
        setDbAmenities(FALLBACK_AMENITIES);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Especialidades del rubro elegido en el formulario (sin vertical conocido, el backend devuelve gastronomía).
  const rubroKey = verticalOf(businessType)?.key ?? activePlace?.vertical;
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
    const query = rubroKey ? `?vertical=${encodeURIComponent(rubroKey)}` : '';
    fetch(`${API_BASE}/api/places/categories${query}`, { headers })
      .then(res => res.json())
      .then(data => {
        const cats = Array.isArray(data) ? data : [];
        setDbCategories(cats);
        // A category from another vertical is dropped: the owner picks one from "Elige una especialidad".
        setFormData(prev => !prev.categoriaId || cats.some(c => c.id === prev.categoriaId) ? prev : { ...prev, categoriaId: '' });
      })
      .catch(err => console.error(err));
  }, [rubroKey]);

  // Location logic - Cascada de ubicación
  useEffect(() => {
    if (!formData.departamento || country !== 'PE') return;
    if (isLoadingProfile.current) return;
    setIsLoadingLocation(true);
    setFormData(prev => ({ ...prev, provincia: '', distrito: '', ubigeoCode: '', ubigeoId: '' }));
    fetch(`${API_BASE}/api/ubigeo/provinces?department=${encodeURIComponent(formData.departamento)}`)
      .then(res => res.json())
      .then(data => setDbProvinces(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setIsLoadingLocation(false));
  }, [formData.departamento, country]);

  useEffect(() => {
    if (!formData.departamento || !formData.provincia || country !== 'PE') return;
    if (isLoadingProfile.current) return;
    setIsLoadingLocation(true);
    fetch(`${API_BASE}/api/ubigeo/districts?department=${encodeURIComponent(formData.departamento)}&province=${encodeURIComponent(formData.provincia)}`)
      .then(res => res.json())
      .then(data => {
        const fullDistricts = Array.isArray(data) ? data : [];
        setDbDistricts(fullDistricts);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoadingLocation(false));
  }, [formData.provincia, formData.departamento, country]);

  useEffect(() => {
    if (!formData.distrito || dbDistricts.length === 0 || country !== 'PE') return;
    const district = dbDistricts.find(d => d.district === formData.distrito);
    if (district && district.ubigeoCode !== formData.ubigeoCode) {
      setFormData(prev => ({ ...prev, ubigeoCode: district.ubigeoCode, ubigeoId: district.id }));
    }
  }, [formData.distrito, dbDistricts, country]);

  // Spain cascade: fetch communities when Spain is selected
  useEffect(() => {
    if (country !== 'ES') return;
    if (dbSpainCommunities.length > 0) return;
    fetch(`${API_BASE}/api/ubigeo/spain/communities`)
      .then(res => res.json())
      .then(data => setDbSpainCommunities(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, [country]);

  // Spain cascade: fetch provinces when community changes
  useEffect(() => {
    if (!formData.departamento || country !== 'ES') return;
    setIsLoadingLocation(true);
    setDbSpainProvinces([]);
    setDbSpainMunicipalities([]);
    fetch(`${API_BASE}/api/ubigeo/spain/provinces?community=${encodeURIComponent(formData.departamento)}`)
      .then(res => res.json())
      .then(data => setDbSpainProvinces(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setIsLoadingLocation(false));
  }, [formData.departamento, country]);

  // Spain cascade: fetch municipalities when province changes
  useEffect(() => {
    if (!formData.departamento || !formData.provincia || country !== 'ES') return;
    setIsLoadingLocation(true);
    setDbSpainMunicipalities([]);
    fetch(`${API_BASE}/api/ubigeo/spain/municipalities?community=${encodeURIComponent(formData.departamento)}&province=${encodeURIComponent(formData.provincia)}`)
      .then(res => res.json())
      .then(data => setDbSpainMunicipalities(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setIsLoadingLocation(false));
  }, [formData.provincia, formData.departamento, country]);

  useEffect(() => {
    if (!activePlaceId) return;
    setIsLoading(true);
    setIsDirty(false);
    businessApi.getProfile(activePlaceId)
      .then((profile) => {
        let schedules = DEFAULT_SCHEDULES;
        if (profile.openHoursText && profile.openHoursText.startsWith('[')) {
          try {
            schedules = JSON.parse(profile.openHoursText);
          } catch (e) {
            schedules = DEFAULT_SCHEDULES;
          }
        }
        const isSpain = profile.countryCode === 'ES';
        if (isSpain) setCountry('ES');

        const type = profile.businessType || activePlace?.businessType || '';
        setSavedType(type);
        setBusinessType(type);

        isLoadingProfile.current = true;

        setFormData(prev => ({
          ...prev,
          nombre: profile.name || '',
          direccion: profile.address || '',
          categoriaId: profile.categoryId || '',
          departamento: isSpain ? (profile.spainCommunity || '') : (profile.district?.department || ''),
          provincia: isSpain ? (profile.spainProvince || '') : (profile.district?.province || ''),
          distrito: isSpain ? (profile.spainMunicipality || '') : (profile.district?.district || ''),
          ubigeoCode: profile.district?.ubigeoCode || '',
          ubigeoId: profile.district?.id || '',
          horarios: schedules,
          precio: profile.priceMin ? String(profile.priceMin) : '',
          foto: profile.coverImageUrl || '',
          amenityIds: profile.amenityIds || []
        }));

        const token = localStorage.getItem('token') || '';
        const headers = { 'Authorization': `Bearer ${token}` };

        if (isSpain) {
          fetch(`${API_BASE}/api/ubigeo/spain/communities`)
            .then(res => res.json())
            .then(data => setDbSpainCommunities(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));

          if (profile.spainCommunity) {
            fetch(`${API_BASE}/api/ubigeo/spain/provinces?community=${encodeURIComponent(profile.spainCommunity)}`)
              .then(res => res.json())
              .then(data => setDbSpainProvinces(Array.isArray(data) ? data : []))
              .catch(err => console.error(err));
          }

          if (profile.spainCommunity && profile.spainProvince) {
            fetch(`${API_BASE}/api/ubigeo/spain/municipalities?community=${encodeURIComponent(profile.spainCommunity)}&province=${encodeURIComponent(profile.spainProvince)}`)
              .then(res => res.json())
              .then(data => setDbSpainMunicipalities(Array.isArray(data) ? data : []))
              .catch(err => console.error(err))
              .finally(() => { isLoadingProfile.current = false; });
          } else {
            isLoadingProfile.current = false;
          }
        } else {
          const dept = profile.district?.department;
          const prov = profile.district?.province;

          if (dept && prov) {
            Promise.all([
              fetch(`${API_BASE}/api/ubigeo/provinces?department=${encodeURIComponent(dept)}`, { headers })
                .then(res => res.json()).then(data => setDbProvinces(Array.isArray(data) ? data : [])),
              fetch(`${API_BASE}/api/ubigeo/districts?department=${encodeURIComponent(dept)}&province=${encodeURIComponent(prov)}`, { headers })
                .then(res => res.json()).then(data => setDbDistricts(Array.isArray(data) ? data : [])),
            ])
              .catch(err => console.error(err))
              .finally(() => { isLoadingProfile.current = false; });
          } else if (dept) {
            fetch(`${API_BASE}/api/ubigeo/provinces?department=${encodeURIComponent(dept)}`, { headers })
              .then(res => res.json())
              .then(data => setDbProvinces(Array.isArray(data) ? data : []))
              .catch(err => console.error(err))
              .finally(() => { isLoadingProfile.current = false; });
          } else {
            isLoadingProfile.current = false;
          }
        }
      }).catch(err => {
        console.warn("Using mock data for profile demo");
        setFormData(prev => ({
          ...prev,
          nombre: "La Picantería del Sur",
          direccion: "Calle San Martín 456, Miraflores",
          horarios: DEFAULT_SCHEDULES,
          precio: "S/. 45 - 90",
          foto: "/images/interior.png"
        }));
      }).finally(() => setIsLoading(false));
  }, [activePlaceId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      update({ foto: data.url });
    } catch (err) {
      toast.error('No se pudo subir la imagen.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!activePlaceId) return;
    setIsSaving(true);
    try {
      await businessApi.updateProfile(activePlaceId, {
        name: formData.nombre,
        address: formData.direccion,
        ...(typeChanged && { businessType }),
        // La lista solo trae especialidades del rubro elegido (una de otro rubro se descarta al cambiarlo),
        // así que el backend la valida contra el nuevo tipo. Sin especialidad, limpia la del rubro anterior.
        categoryId: formData.categoriaId || undefined,
        districtId: country === 'PE' ? (formData.ubigeoId || undefined) : null,
        amenityIds: formData.amenityIds,
        openHoursText: JSON.stringify(formData.horarios),
        priceMin: formData.precio ? parseFloat(formData.precio.replace(/[^0-9.]/g, '')) : undefined,
        coverImageUrl: formData.foto,
        countryCode: country,
        spainCommunity: country === 'ES' ? (formData.departamento || null) : null,
        spainProvince: country === 'ES' ? (formData.provincia || null) : null,
        spainMunicipality: country === 'ES' ? (formData.distrito || null) : null,
      });
      if (typeChanged) {
        setSavedType(businessType);
        await refreshPlaces(); // menú y etiquetas del nuevo rubro
      }
      setIsDirty(false);
      toast.success('Configuración actualizada con éxito.');
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
      setConfirmOpen(false);
    }
  };

  const requestSave = () => (verticalChanged ? setConfirmOpen(true) : handleSave());

  const resetLocation = (nextCountry: 'PE' | 'ES') => {
    setCountry(nextCountry);
    update({ departamento: '', provincia: '', distrito: '', ubigeoCode: '', ubigeoId: '' });
    setDbProvinces([]);
    setDbDistricts([]);
    setDbSpainProvinces([]);
    setDbSpainMunicipalities([]);
  };

  if (isLoading) return <MiFichaSkeleton />;

  const departamentoOptions = country === 'PE' ? dbDepartments : dbSpainCommunities;
  const provinciaOptions = country === 'PE' ? dbProvinces : dbSpainProvinces;
  const distritoOptions = country === 'PE'
    ? (Array.isArray(dbDistricts) ? dbDistricts.map(d => d?.district).filter(Boolean) : [])
    : dbSpainMunicipalities;
  const selectedVertical = verticalOf(businessType);

  return (
    <div className={cn('space-y-6', isDirty && 'pb-24')}>
      <PageHeader title="Mi ficha" subtitle="Lo que tus clientes ven de tu negocio en Wuarikes." />

      <Card padding="lg" className="space-y-4">
        <CardTitle title="Tipo de negocio" subtitle="El rubro define qué secciones del panel ves y cómo se llaman." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Rubro"
            value={selectedVertical?.key ?? ''}
            onChange={(e) => {
              const next = verticals.find(v => v.key === e.target.value);
              if (!next) return;
              // El tipo interno se mantiene si ya es del rubro; si no, se toma el primero del rubro.
              if (!next.types.some(t => t.key === businessType)) setBusinessType(next.types[0]?.key ?? '');
              setIsDirty(true);
            }}
          >
            {!selectedVertical && <option value="">Elige el rubro</option>}
            {verticals.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
          </Select>
          <Select
            label="Especialidad"
            value={formData.categoriaId}
            onChange={(e) => update({ categoriaId: e.target.value })}
            disabled={!selectedVertical}
          >
            {!formData.categoriaId && <option value="">Elige una especialidad</option>}
            {dbCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        <CardTitle title="Datos" />
        <Input
          label="Nombre del negocio"
          value={formData.nombre}
          onChange={(e) => update({ nombre: e.target.value })}
          placeholder="Ej. La Picantería del Sur"
        />
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-text">Comodidades</legend>
          <div className="flex flex-wrap gap-2">
            {dbAmenities.map(amenity => {
              const selected = formData.amenityIds.includes(amenity.id);
              return (
                <button
                  key={amenity.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => update({
                    amenityIds: selected
                      ? formData.amenityIds.filter(s => s !== amenity.id)
                      : [...formData.amenityIds, amenity.id]
                  })}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 rounded-control border px-3 text-sm transition-colors duration-200 motion-reduce:transition-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    selected ? 'border-primary bg-primary-soft text-primary-hover' : 'border-border bg-surface text-text hover:border-primary',
                  )}
                >
                  {selected && <Check size={16} aria-hidden />}
                  {amenity.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <Card padding="lg" className="space-y-4">
        <CardTitle title="Ubicación" />
        <Select label="País" value={country} onChange={(e) => resetLocation(e.target.value as 'PE' | 'ES')}>
          <option value="PE">Perú</option>
          <option value="ES">España</option>
        </Select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label={country === 'PE' ? 'Departamento' : 'Comunidad autónoma'}
            value={formData.departamento}
            disabled={isLoadingLocation}
            onChange={(e) => {
              update({ departamento: e.target.value, provincia: '', distrito: '', ubigeoCode: '', ubigeoId: '' });
              setDbProvinces([]);
              setDbDistricts([]);
            }}
          >
            <option value="">Seleccione...</option>
            {departamentoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Select>
          <Select
            label="Provincia"
            value={formData.provincia}
            disabled={isLoadingLocation}
            onChange={(e) => {
              update({ provincia: e.target.value, distrito: '', ubigeoCode: '', ubigeoId: '' });
              setDbDistricts([]);
              setDbSpainMunicipalities([]);
            }}
          >
            <option value="">Seleccione...</option>
            {provinciaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Select>
          <Select
            label={country === 'PE' ? 'Distrito' : 'Municipio'}
            value={formData.distrito}
            disabled={isLoadingLocation}
            onChange={(e) => update({ distrito: e.target.value })}
          >
            <option value="">Seleccione...</option>
            {distritoOptions.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </Select>
        </div>
        <Input
          label="Dirección exacta"
          value={formData.direccion}
          onChange={(e) => update({ direccion: e.target.value })}
          placeholder="Av. Principal 123, Miraflores..."
        />
        <MapSelector
          locationName={formData.nombre || 'Tu ubicación'}
          direccion={formData.direccion}
          onLocationSelect={ignoreLocation}
          onUbigeoFound={(dept, prov, dist, ubigeoCode, ubigeoId, source) => {
            if (source === 'user') setIsDirty(true); // geocoding the saved address is not an edit
            setFormData(prev => ({
              ...prev,
              departamento: dept,
              provincia: prov,
              distrito: dist,
              ubigeoCode: ubigeoCode,
              ubigeoId: ubigeoId
            }));
          }}
        />
      </Card>

      <Card padding="lg" className="space-y-4">
        <CardTitle title="Precios y horario" />
        <Input
          label="Precio promedio"
          value={formData.precio}
          onChange={(e) => update({ precio: e.target.value })}
          placeholder="S/. 45 - 90"
          className="sm:max-w-xs"
        />
        <div>
          <p className="text-sm font-medium text-text">Horario de atención</p>
          <ScheduleEditor schedules={formData.horarios} onChange={(horarios) => update({ horarios })} />
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        <CardTitle title="Fotos" subtitle="Imagen de portada. PNG, JPG o WEBP, máximo 5 MB." />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-border bg-background sm:w-72">
            <img src={formData.foto || '/images/interior.png'} alt="Portada de tu negocio" className="h-full w-full object-cover" />
            {isUploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-text/60">
                <Loader2 size={24} aria-hidden className="animate-spin text-white motion-reduce:animate-none" />
              </div>
            )}
          </div>
          <Button variant="secondary" icon={ImagePlus} loading={isUploadingImage} onClick={() => fileInputRef.current?.click()}>
            {isUploadingImage ? 'Subiendo...' : 'Cambiar imagen'}
          </Button>
        </div>
      </Card>

      {isDirty && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-modal">
          <p className="text-sm text-text-muted">Tienes cambios sin guardar.</p>
          <Button onClick={requestSave} loading={isSaving} disabled={isUploadingImage || !businessType}>Guardar</Button>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Cambiar el rubro de tu negocio?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={isSaving}>Cambiar y guardar</Button>
          </>
        }
      >
        <p className="text-text">
          Pasarás de {verticalOf(savedType)?.label ?? 'tu rubro actual'} a {selectedVertical?.label ?? 'otro rubro'}.
          Algunas secciones dejarán de mostrarse. No se borra ningún dato.
        </p>
      </Modal>
    </div>
  );
}

function CardTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-text">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
    </div>
  );
}

function MiFichaSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-40" />
      {[0, 1, 2].map(i => (
        <Card key={i} padding="lg" className="space-y-3">
          <Skeleton className="w-32" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </Card>
      ))}
    </div>
  );
}
