'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const DEFAULT_SCHEDULES: DaySchedule[] = [
  { day: 'Lunes', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Martes', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Miércoles', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Jueves', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Viernes', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Sábado', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Domingo', isOpen: false, openTime: '12:00', closeTime: '23:00' },
];

export default function RestaurantePage() {
  const { activePlaceId } = useRestaurant();
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
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<'PE' | 'ES'>('PE');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch Core Data
  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch(`${API_BASE}/api/ubigeo/departments`, { headers })
      .then(res => res.json())
      .then(data => setDbDepartments(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/places/categories`, { headers })
      .then(res => res.json())
      .then(data => {
        const cats = Array.isArray(data) ? data : [];
        setDbCategories(cats);
        if (cats.length > 0 && !formData.categoriaId) setFormData(prev => ({ ...prev, categoriaId: cats[0].id }));
      })
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/places/amenities`, { headers })
      .then(res => res.json())
      .then(data => {
        const amenities = Array.isArray(data) && data.length > 0 ? data : [
          { id: '1', name: 'Wifi Gratis', icon: '📶' },
          { id: '2', name: 'Cochera', icon: '🅿️' },
          { id: '3', name: 'Aire Acondicionado', icon: '❄️' },
          { id: '4', name: 'Mascotas', icon: '🐾' },
          { id: '5', name: 'Estacionamiento', icon: '🚗' },
          { id: '6', name: 'Terraza', icon: '☀️' },
          { id: '7', name: 'Música en Vivo', icon: '🎵' },
          { id: '8', name: 'Juegos de Mesa', icon: '🎲' }
        ];
        setDbAmenities(amenities);
      })
      .catch(err => {
        console.error(err);
        setDbAmenities([
          { id: '1', name: 'Wifi Gratis', icon: '📶' },
          { id: '2', name: 'Cochera', icon: '🅿️' },
          { id: '3', name: 'Aire Acondicionado', icon: '❄️' },
          { id: '4', name: 'Mascotas', icon: '🐾' },
          { id: '5', name: 'Estacionamiento', icon: '🚗' },
          { id: '6', name: 'Terraza', icon: '☀️' },
          { id: '7', name: 'Música en Vivo', icon: '🎵' },
          { id: '8', name: 'Juegos de Mesa', icon: '🎲' }
        ]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Location logic - Cascada de ubicación
  useEffect(() => {
    if (!formData.departamento || country !== 'PE') return;
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
              .catch(err => console.error(err));
          }
        } else {
          if (profile.district?.department) {
            setFormData(prev => ({ ...prev, departamento: profile.district.department }));
            fetch(`${API_BASE}/api/ubigeo/provinces?department=${encodeURIComponent(profile.district.department)}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } })
              .then(res => res.json())
              .then(data => setDbProvinces(Array.isArray(data) ? data : []))
              .catch(err => console.error(err));
          }

          if (profile.district?.department && profile.district?.province) {
            const dept = profile.district.department;
            const prov = profile.district.province;
            fetch(`${API_BASE}/api/ubigeo/districts?department=${encodeURIComponent(dept)}&province=${encodeURIComponent(prov)}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } })
              .then(res => res.json())
              .then(data => setDbDistricts(Array.isArray(data) ? data : []))
              .catch(err => console.error(err));
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
      setFormData(prev => ({ ...prev, foto: data.url }));
    } catch (err) {
      toast.error('No se pudo subir la imagen.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!activePlaceId) return;
    setIsLoading(true);
    try {
      await businessApi.updateProfile(activePlaceId, {
        name: formData.nombre,
        address: formData.direccion,
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
      toast.success('Configuración actualizada con éxito.');
    } catch (err) {
      toast.error('Error al guardar los cambios.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-6xl space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-text tracking-tight font-warike">Mi Establecimiento</h1>
          <p className="text-text-muted font-bold text-lg max-w-xl leading-snug">Gestiona la identidad de tu Huarique para tus clientes en Perú y España.</p>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary flex items-center gap-3 text-lg"
        >
          <span>✨</span> Actualizar Perfil
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] flex items-center gap-4 text-red-600 font-black text-sm animate-pulse">
          <span className="text-2xl">⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

        {/* Left Column: Media & Amenities */}
        <div className="lg:col-span-4 space-y-12">
          <div className="space-y-6">
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-2">Imagen de Portada</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
            <div
              onClick={() => !isUploadingImage && fileInputRef.current?.click()}
              className="aspect-[4/5] bg-white rounded-[3.5rem] overflow-hidden border-8 border-white shadow-2xl relative group cursor-pointer transition-all hover:scale-[1.02] duration-500 ring-1 ring-border"
            >
              <img
                src={formData.foto || '/images/interior.png'}
                alt="Preview"
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000"
              />
              <div className={`absolute inset-0 transition-opacity flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm ${
                isUploadingImage
                  ? 'bg-text/70 opacity-100'
                  : 'bg-text/60 opacity-0 group-hover:opacity-100'
              }`}>
                {isUploadingImage ? (
                  <>
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
                    <span className="text-white font-black text-sm uppercase tracking-widest">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl mb-4">📸</span>
                    <span className="text-white font-black text-sm uppercase tracking-widest">Cambiar Imagen</span>
                    <span className="text-white/70 text-xs mt-2 font-medium">PNG, JPG, WEBP · Máx 5MB</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-border space-y-5">
            <h3 className="font-black text-text text-base flex justify-between items-center font-warike">
              Servicios
              <span className={`text-[9px] px-2.5 py-1 rounded-full font-black tracking-wider transition-all duration-300 ${formData.amenityIds.length > 0
                ? 'bg-orange-50 text-primary'
                : 'bg-red-50 text-red-500'
                }`}>
                {formData.amenityIds.length} ACTIVOS
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {dbAmenities.map(amenity => (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    amenityIds: prev.amenityIds.includes(amenity.id)
                      ? prev.amenityIds.filter(s => s !== amenity.id)
                      : [...prev.amenityIds, amenity.id]
                  }))}
                  className={`group p-4 rounded-[1.5rem] transition-all duration-300 border-2 flex flex-col items-center justify-center text-center space-y-2 min-h-[110px] ${formData.amenityIds.includes(amenity.id)
                    ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10 -translate-y-0.5'
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5'
                    }`}
                >
                  <div className={`transition-all duration-300 ${formData.amenityIds.includes(amenity.id)
                    ? 'scale-105 drop-shadow-sm'
                    : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'
                    }`}>
                    <AmenityIcon name={amenity.name} className="w-11 h-11" />
                  </div>
                  <p className={`font-black text-[10px] uppercase tracking-wider transition-all duration-300 leading-tight ${formData.amenityIds.includes(amenity.id)
                    ? 'text-primary'
                    : 'text-text-muted group-hover:text-text'
                    }`}>
                    {amenity.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Main Data */}
        <div className="lg:col-span-8 space-y-12">

          {/* Información del Local Section */}
          <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-border space-y-8">
            <h3 className="text-lg font-black text-text flex items-center gap-3 font-warike">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              Información del Local
            </h3>

            <div className="space-y-6">
              <InputGroup
                label="Nombre del Huarique"
                value={formData.nombre}
                onChange={(v) => setFormData({ ...formData, nombre: v })}
                placeholder="Ej. La Picantería del Sur"
              />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Especialidades</label>
                  <div className="relative">
                    <select
                      value={formData.categoriaId}
                      onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                      className="input-premium appearance-none cursor-pointer text-sm"
                    >
                      {dbCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">▼</span>
                  </div>
                </div>

                <InputGroup
                  label="Precio Promedio Inmenso"
                  value={formData.precio}
                  onChange={(v) => setFormData({ ...formData, precio: v })}
                  placeholder="S/. 45 - 90"
                />
              </div>

              <div className="space-y-6">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Horarios de Atención</label>
                <ScheduleEditor
                  schedules={formData.horarios}
                  onChange={(schedules) => setFormData({ ...formData, horarios: schedules })}
                />
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-border space-y-6">
            <h3 className="text-lg font-black text-text flex items-center gap-3 font-warike">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              Ubicación Geográfica
            </h3>

            {/* Country Selector */}
            <div className="flex bg-background p-2 rounded-2xl border border-border gap-2">
              <button
                onClick={() => {
                  setCountry('PE');
                  setFormData({ ...formData, departamento: '', provincia: '', distrito: '', ubigeoCode: '', ubigeoId: '' });
                  setDbProvinces([]);
                  setDbDistricts([]);
                  setDbSpainProvinces([]);
                  setDbSpainMunicipalities([]);
                }}
                className={`flex-1 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${country === 'PE' ? 'bg-white text-primary shadow-md' : 'text-text-muted hover:text-text'}`}
              >
                🇵🇪 Perú
              </button>
              <button
                onClick={() => {
                  setCountry('ES');
                  setFormData({ ...formData, departamento: '', provincia: '', distrito: '', ubigeoCode: '', ubigeoId: '' });
                  setDbProvinces([]);
                  setDbDistricts([]);
                  setDbSpainProvinces([]);
                  setDbSpainMunicipalities([]);
                }}
                className={`flex-1 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${country === 'ES' ? 'bg-white text-primary shadow-md' : 'text-text-muted hover:text-text'}`}
              >
                🇪🇸 España
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <SelectGroup
                label={country === 'PE' ? "Departamento" : "C. Autónoma"}
                value={formData.departamento}
                onChange={(v) => {
                  setFormData({ ...formData, departamento: v, provincia: '', distrito: '', ubigeoCode: '', ubigeoId: '' });
                  setDbProvinces([]);
                  setDbDistricts([]);
                }}
                options={country === 'PE' ? dbDepartments : dbSpainCommunities}
                isLoading={isLoadingLocation}
              />
              <SelectGroup
                label="Provincia"
                value={formData.provincia}
                onChange={(v) => {
                  setFormData({ ...formData, provincia: v, distrito: '', ubigeoCode: '', ubigeoId: '' });
                  setDbDistricts([]);
                  setDbSpainMunicipalities([]);
                }}
                options={country === 'PE' ? dbProvinces : dbSpainProvinces}
                isLoading={isLoadingLocation}
              />
              <SelectGroup
                label={country === 'PE' ? "Distrito" : "Municipio"}
                value={formData.distrito}
                onChange={(v) => setFormData({ ...formData, distrito: v })}
                options={country === 'PE' ? (Array.isArray(dbDistricts) ? dbDistricts.map(d => d?.district).filter(Boolean) : []) : dbSpainMunicipalities}
                isLoading={isLoadingLocation}
              />
            </div>

            {/* Map Section */}
            <MapSelector
              locationName={formData.nombre || 'Tu ubicación'}
              direccion={formData.direccion}
              onLocationSelect={(lat, lng) => {
                console.log('Ubicación seleccionada:', lat, lng);
              }}
              onUbigeoFound={(dept, prov, dist, ubigeoCode, ubigeoId) => {
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

            <InputGroup
              label="Dirección Exacta"
              value={formData.direccion}
              onChange={(v) => setFormData({ ...formData, direccion: v })}
              placeholder="Av. Principal 123, Miraflores..."
              icon="📍"
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, icon, placeholder }: { label: string, value: string, onChange: (v: string) => void, icon?: string, placeholder?: string }) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">{label}</label>
      <div className={`relative transition-all duration-300 rounded-2xl border-2 ${isFocused || value
        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
        : 'border-border bg-white hover:border-primary/30'
        }`}>
        {icon && <span className={`absolute left-5 top-1/2 -translate-y-1/2 text-xl transition-all duration-300 ${isFocused ? 'scale-110' : ''}`}>{icon}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full bg-transparent outline-none text-text font-bold py-4 px-5 placeholder-text-muted/50 transition-all duration-300 ${icon ? 'pl-16' : ''} rounded-xl`}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors text-lg"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function SelectGroup({ label, value, onChange, options, isLoading }: { label: string, value: string, onChange: (v: string) => void, options: string[], isLoading?: boolean }) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">{label}</label>
      <div className={`relative transition-all duration-300 rounded-2xl border-2 ${isFocused || value
        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
        : 'border-border bg-white hover:border-primary/30'
        }`}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading}
          className="w-full bg-transparent appearance-none outline-none text-text font-bold py-4 px-5 cursor-pointer disabled:opacity-50 transition-all duration-300 rounded-xl"
        >
          <option value="">Seleccione...</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-sm transition-transform duration-300">
          {isLoading ? '⌛' : '▼'}
        </span>
      </div>
    </div>
  );
}

function AmenityIcon({ name, className = "w-11 h-11" }: { name: string; className?: string }) {
  const normName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (normName.includes('wifi')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="70" height="70" rx="16" fill="#2563EB" stroke="black" strokeWidth="4.5" />
        <path d="M50 32C59 32 67 35 73 41" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M50 46C55 46 60 48 64 51" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M50 60C52 60 54 61 56 62" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
        <circle cx="50" cy="72" r="5" fill="white" />
      </svg>
    );
  }

  if (normName.includes('cochera') || normName.includes('parking') || normName.includes('prive')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="70" height="70" rx="16" fill="#1D4ED8" stroke="black" strokeWidth="4.5" />
        <path d="M38 32H54C61 32 64 36 64 42C64 48 61 52 54 52H38V32Z" fill="white" stroke="black" strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M38 52V70" stroke="white" strokeWidth="7" strokeLinecap="round" />
        <path d="M44 40H52C53.5 40 55 41 55 42.5C55 44 53.5 45 52 45H44V40Z" fill="black" />
      </svg>
    );
  }

  if (normName.includes('aire') || normName.includes('acondicionado') || normName.includes('frio') || normName.includes('clima')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="30" fill="#E0F2FE" />
        <path d="M50 15V85M15 50H85" stroke="#06B6D4" strokeWidth="5" strokeLinecap="round" />
        <path d="M25 25L75 75M25 75L75 25" stroke="#06B6D4" strokeWidth="5" strokeLinecap="round" />
        <path d="M50 25L42 33M50 25L58 33M50 75L42 67M50 75L58 67" stroke="black" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M25 50L33 42M25 50L33 58M75 50L67 42M75 50L67 58" stroke="black" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="50" cy="50" r="10" fill="white" stroke="black" strokeWidth="4.5" />
      </svg>
    );
  }

  if (normName.includes('mascota') || normName.includes('pet') || normName.includes('perro') || normName.includes('animal')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="black" strokeWidth="4.5" strokeLinejoin="round">
          <path d="M35 55C35 48 42 45 47 48C52 45 59 48 59 55C59 65 35 65 35 55Z" fill="#EA580C" />
          <circle cx="33" cy="40" r="6" fill="#EA580C" />
          <circle cx="43" cy="34" r="6" fill="#EA580C" />
          <circle cx="54" cy="36" r="6" fill="#EA580C" />
          <circle cx="61" cy="44" r="6" fill="#EA580C" />

          <path d="M62 70C62 65 67 63 70 65C73 63 78 65 78 70C78 77 62 77 62 70Z" fill="#EA580C" />
          <circle cx="61" cy="60" r="4.5" fill="#EA580C" />
          <circle cx="68" cy="56" r="4.5" fill="#EA580C" />
          <circle cx="76" cy="57" r="4.5" fill="#EA580C" />
          <circle cx="81" cy="63" r="4.5" fill="#EA580C" />
        </g>
      </svg>
    );
  }

  if (normName.includes('estacionam') || normName.includes('auto') || normName.includes('carro')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="black" strokeWidth="4.5" strokeLinejoin="round">
          <circle cx="35" cy="68" r="8" fill="black" />
          <circle cx="35" cy="68" r="3" fill="white" />
          <circle cx="65" cy="68" r="8" fill="black" />
          <circle cx="65" cy="68" r="3" fill="white" />
          <path d="M20 52C20 48 24 46 28 46H72C76 46 80 48 80 52V62H20V52Z" fill="#DC2626" />
          <path d="M30 46L36 32H64L70 46H30Z" fill="#F8FAFC" />
          <line x1="50" y1="32" x2="50" y2="46" stroke="black" strokeWidth="4.5" />
          <rect x="16" y="58" width="8" height="4" rx="1" fill="#94A3B8" />
          <rect x="76" y="58" width="8" height="4" rx="1" fill="#94A3B8" />
        </g>
      </svg>
    );
  }

  if (normName.includes('terraza') || normName.includes('sol') || normName.includes('aire libre') || normName.includes('exterior')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="black" strokeWidth="4.5" strokeLinejoin="round">
          <circle cx="50" cy="50" r="18" fill="#FACC15" />
          <path d="M50 18L50 26M50 74L50 82M18 50L26 50M74 50L82 50M27 27L33 33M67 67L73 73M27 77L33 73M67 33L73 27" stroke="black" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M42 42C44 43 46 43 48 42" stroke="black" strokeWidth="3" strokeLinecap="round" />
          <path d="M52 42C54 43 56 43 58 42" stroke="black" strokeWidth="3" strokeLinecap="round" />
          <path d="M45 58C48 61 52 61 55 58" stroke="black" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  if (normName.includes('musica') || normName.includes('vivo') || normName.includes('show') || normName.includes('banda')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="black" strokeWidth="4.5" strokeLinejoin="round">
          <ellipse cx="32" cy="65" rx="10" ry="7" fill="#8B5CF6" />
          <ellipse cx="68" cy="57" rx="10" ry="7" fill="#8B5CF6" />
          <path d="M40 65V25M76 57V18" stroke="black" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M40 27L76 20" stroke="black" strokeWidth="8" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  if (normName.includes('juego') || normName.includes('mesa') || normName.includes('dado') || normName.includes('carta')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="black" strokeWidth="4.5" strokeLinejoin="round">
          <path d="M22 42L50 28L78 42V70L50 84L22 70V42Z" fill="white" />
          <path d="M50 28V84M50 56L22 42M50 56L78 42" stroke="black" strokeWidth="4.5" />
          <circle cx="50" cy="42" r="5" fill="#DC2626" />
          <circle cx="32" cy="52" r="3" fill="black" />
          <circle cx="38" cy="58" r="3" fill="black" />
          <circle cx="44" cy="64" r="3" fill="black" />
          <circle cx="56" cy="51" r="3" fill="black" />
          <circle cx="72" cy="51" r="3" fill="black" />
          <circle cx="64" cy="61" r="3" fill="black" />
          <circle cx="56" cy="71" r="3" fill="black" />
          <circle cx="72" cy="71" r="3" fill="black" />
        </g>
      </svg>
    );
  }

  if (normName.includes('bebida') || normName.includes('propia') || normName.includes('byob') || normName.includes('licor') || normName.includes('cerveza')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="70" height="70" rx="16" fill="#15803D" stroke="black" strokeWidth="4.5" />
        <path d="M44 26H56V36C56 36 63 41 63 54V70C63 72 61 74 59 74H41C39 74 37 72 37 70V54C37 41 44 36 44 36V26Z" fill="white" stroke="black" strokeWidth="4" strokeLinejoin="round" />
        <rect x="43" y="24" width="14" height="5" rx="2.5" fill="#78350F" stroke="black" strokeWidth="3" />
        <path d="M39 58C39 51 45 47 50 47C55 47 61 51 61 58V69C61 71 59 72 58 72H42C41 72 39 71 39 69V58Z" fill="#B91C1C" />
        <path d="M43 38C41 43 39 49 39 54" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (normName.includes('nino') || normName.includes('ninos') || normName.includes('infantil') || normName.includes('kids') || normName.includes('menor')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="70" height="70" rx="16" fill="#F59E0B" stroke="black" strokeWidth="4.5" />
        <circle cx="50" cy="40" r="16" fill="#FDE68A" stroke="black" strokeWidth="4" />
        <circle cx="44" cy="38" r="2.5" fill="black" />
        <circle cx="56" cy="38" r="2.5" fill="black" />
        <path d="M44 46C46.5 49.5 53.5 49.5 56 46" stroke="black" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M34 35C34 27 41 24 50 24C59 24 66 27 66 35" fill="#78350F" stroke="black" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M38 63V74M38 63C38 61 40 60 42 60H58C60 60 62 61 62 63V74" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 58V63" stroke="black" strokeWidth="4" strokeLinecap="round" />
        <path d="M56 58V63" stroke="black" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (normName.includes('tarjeta') || normName.includes('card') || normName.includes('visa') || normName.includes('credito') || normName.includes('debito')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="70" height="70" rx="16" fill="#1D4ED8" stroke="black" strokeWidth="4.5" />
        <rect x="20" y="34" width="60" height="38" rx="7" fill="white" stroke="black" strokeWidth="4" />
        <rect x="20" y="43" width="60" height="11" fill="#374151" />
        <rect x="28" y="58" width="14" height="10" rx="2" fill="#FBBF24" stroke="black" strokeWidth="2.5" />
        <line x1="33" y1="60" x2="33" y2="68" stroke="black" strokeWidth="1.5" />
        <line x1="37" y1="60" x2="37" y2="68" stroke="black" strokeWidth="1.5" />
        <rect x="48" y="60" width="24" height="3.5" rx="1.75" fill="#9CA3AF" />
        <rect x="48" y="65" width="16" height="3.5" rx="1.75" fill="#9CA3AF" />
      </svg>
    );
  }

  if (normName.includes('gluten') || normName.includes('celiaco') || normName.includes('sin trigo')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 82V22" stroke="#92400E" strokeWidth="5.5" strokeLinecap="round" />
        <ellipse cx="43" cy="36" rx="9" ry="5.5" fill="#D97706" stroke="black" strokeWidth="3" transform="rotate(-25 43 36)" />
        <ellipse cx="57" cy="36" rx="9" ry="5.5" fill="#D97706" stroke="black" strokeWidth="3" transform="rotate(25 57 36)" />
        <ellipse cx="41" cy="50" rx="9" ry="5.5" fill="#D97706" stroke="black" strokeWidth="3" transform="rotate(-25 41 50)" />
        <ellipse cx="59" cy="50" rx="9" ry="5.5" fill="#D97706" stroke="black" strokeWidth="3" transform="rotate(25 59 50)" />
        <ellipse cx="43" cy="63" rx="9" ry="5.5" fill="#D97706" stroke="black" strokeWidth="3" transform="rotate(-25 43 63)" />
        <ellipse cx="57" cy="63" rx="9" ry="5.5" fill="#D97706" stroke="black" strokeWidth="3" transform="rotate(25 57 63)" />
        <circle cx="50" cy="50" r="36" stroke="#DC2626" strokeWidth="7" />
        <path d="M24 24L76 76" stroke="#DC2626" strokeWidth="7" strokeLinecap="round" />
      </svg>
    );
  }

  if (normName === 'tv' || normName.includes('television') || normName.includes('pantalla') || normName.includes(' tv') || normName.startsWith('tv')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="70" height="70" rx="16" fill="#1F2937" stroke="black" strokeWidth="4.5" />
        <rect x="20" y="26" width="60" height="42" rx="6" fill="#0EA5E9" stroke="black" strokeWidth="4" />
        <rect x="26" y="32" width="48" height="30" rx="3" fill="#E0F2FE" />
        <path d="M43 38L43 56L62 47Z" fill="#0284C7" />
        <path d="M42 70L38 78H62L58 70" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="34" y="76" width="32" height="6" rx="3" fill="white" stroke="black" strokeWidth="3" />
      </svg>
    );
  }

  if (normName.includes('vegano') || normName.includes('vegetariano') || normName.includes('vegetal') || normName.includes('plant') || /\bveg\b/.test(normName)) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="70" height="70" rx="16" fill="#15803D" stroke="black" strokeWidth="4.5" />
        <path d="M50 78C50 78 22 65 22 38C22 38 38 26 62 36C78 43 76 65 50 78Z" fill="#4ADE80" stroke="black" strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M50 78C50 60 50 36 50 36" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M50 62C50 62 38 54 32 46" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 52C50 52 60 44 65 38" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (normName.includes('yape') || normName.includes('plin') || normName.includes('lukita') || normName.includes('pago movil') || normName.includes('pago digital')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="70" height="70" rx="16" fill="#7C3AED" stroke="black" strokeWidth="4.5" />
        <rect x="32" y="20" width="36" height="60" rx="7" fill="white" stroke="black" strokeWidth="4" />
        <rect x="37" y="29" width="26" height="34" rx="3" fill="#DDD6FE" />
        <rect x="40" y="32" width="8" height="8" rx="1.5" fill="#7C3AED" />
        <rect x="52" y="32" width="8" height="8" rx="1.5" fill="#7C3AED" />
        <rect x="40" y="44" width="8" height="8" rx="1.5" fill="#7C3AED" />
        <rect x="52" y="44" width="3.5" height="3.5" rx="0.5" fill="#7C3AED" />
        <rect x="56.5" y="44" width="3.5" height="3.5" rx="0.5" fill="#7C3AED" />
        <rect x="52" y="48.5" width="8" height="3.5" rx="0.5" fill="#7C3AED" />
        <circle cx="50" cy="72" r="3.5" stroke="black" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="60" height="60" rx="30" fill="#EE5924" stroke="black" strokeWidth="4.5" />
      <path d="M50 35V65M35 50H65" stroke="white" strokeWidth="6.5" strokeLinecap="round" />
    </svg>
  );
}

function MapSelector({
  locationName,
  direccion,
  onLocationSelect,
  onUbigeoFound
}: {
  locationName: string;
  direccion?: string;
  onLocationSelect: (lat: number, lng: number) => void;
  onUbigeoFound?: (dept: string, prov: string, dist: string, ubigeoCode: string, ubigeoId: string) => void;
}) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const markerRef = React.useRef<any>(null);
  const [map, setMap] = React.useState<any>(null);
  const [coords, setCoords] = React.useState({ lat: -12.0464, lng: -77.0428 });
  const [geocoder, setGeocoder] = React.useState<any>(null);

  React.useEffect(() => {
    if (!mapRef.current || map) return;

    const script = document.createElement('script');
    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!mapsKey) {
        console.error('NEXT_PUBLIC_GOOGLE_MAPS_KEY is not configured');
        return;
    }
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&v=3.51`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const googleMap = new (window as any).google.maps.Map(mapRef.current, {
        zoom: 15,
        center: { lat: coords.lat, lng: coords.lng },
        mapTypeId: 'roadmap',
      });

      const googleMarker = new (window as any).google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lng },
        map: googleMap,
        title: locationName,
        icon: '📍',
      });

      const newGeocoder = new (window as any).google.maps.Geocoder();
      setGeocoder(newGeocoder);

      googleMap.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        googleMarker.setPosition({ lat, lng });
        setCoords({ lat, lng });
        onLocationSelect(lat, lng);
        searchUbigeo(lat, lng);
      });

      markerRef.current = googleMarker;
      setMap(googleMap);
    };

    document.head.appendChild(script);
  }, [mapRef, coords, locationName, onLocationSelect]);

  const searchUbigeo = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/ubigeo/nearest?lat=${lat}&lng=${lng}`);
      const ubigeo = await res.json();
      if (ubigeo && onUbigeoFound) {
        onUbigeoFound(ubigeo.department, ubigeo.province, ubigeo.district, ubigeo.ubigeoCode, ubigeo.id);
      }
    } catch (error) {
      console.error('Error searching ubigeo:', error);
    }
  };

  React.useEffect(() => {
    if (!geocoder || !map) return;

    if (!direccion || !direccion.trim()) {
      const defaultLat = -12.0464;
      const defaultLng = -77.0428;
      setCoords({ lat: defaultLat, lng: defaultLng });
      map.setCenter({ lat: defaultLat, lng: defaultLng });
      if (markerRef.current) {
        markerRef.current.setPosition({ lat: defaultLat, lng: defaultLng });
      }
      return;
    }

    geocoder.geocode({ address: direccion }, async (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        setCoords({ lat, lng });
        onLocationSelect(lat, lng);
        map.setCenter({ lat, lng });
        map.setZoom(16);
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        }
        searchUbigeo(lat, lng);
      } else {
        console.error('Geocode error:', status);
      }
    });
  }, [direccion, geocoder, map, onLocationSelect]);

  return (
    <div className="space-y-4">
      <div
        ref={mapRef}
        className="relative w-full h-56 rounded-[2rem] border-2 border-border shadow-sm overflow-hidden"
        style={{ minHeight: '224px' }}
      />
      <div className="flex items-center justify-between bg-background p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div className="text-sm">
            <p className="font-black text-text-muted uppercase tracking-wider text-[10px]">Ubicación Seleccionada</p>
            <p className="font-bold text-text">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleEditor({ schedules, onChange }: { schedules: DaySchedule[], onChange: (schedules: DaySchedule[]) => void }) {
  const handleToggle = (index: number) => {
    const updated = [...schedules];
    updated[index].isOpen = !updated[index].isOpen;
    onChange(updated);
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    const updated = [...schedules];
    updated[index][field] = value;
    onChange(updated);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {schedules.map((schedule, idx) => (
        <div
          key={idx}
          className="bg-white p-5 rounded-2xl border-2 border-border hover:border-primary/30 transition-all shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-black text-text text-sm">{schedule.day}</h4>
            <button
              type="button"
              onClick={() => handleToggle(idx)}
              className={`w-10 h-6 rounded-full transition-all ${
                schedule.isOpen
                  ? 'bg-primary shadow-sm shadow-primary/30'
                  : 'bg-gray-300'
              } relative`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  schedule.isOpen ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {schedule.isOpen ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase">Apertura</label>
                <input
                  type="time"
                  value={schedule.openTime}
                  onChange={(e) => handleTimeChange(idx, 'openTime', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase">Cierre</label>
                <input
                  type="time"
                  value={schedule.closeTime}
                  onChange={(e) => handleTimeChange(idx, 'closeTime', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm font-black text-text-muted">Cerrado</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
