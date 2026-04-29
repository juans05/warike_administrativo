'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    horarios: '',
    precio: '',
    foto: '',
    amenityIds: [] as string[]
  });

  const [dbDepartments, setDbDepartments] = useState<string[]>([]);
  const [dbProvinces, setDbProvinces] = useState<string[]>([]);
  const [dbDistricts, setDbDistricts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbAmenities, setDbAmenities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<'PE' | 'ES'>('PE');

  // Fetch Core Data
  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/ubigeo/departments`).then(res => res.json()).then(data => setDbDepartments(Array.isArray(data) ? data : [])).catch(err => console.error(err));
    fetch(`${API_BASE}/places/categories`).then(res => res.json()).then(data => {
      setDbCategories(data);
      if (data.length > 0 && !formData.categoriaId) setFormData(prev => ({ ...prev, categoriaId: data[0].id }));
    }).catch(err => console.error(err));
    fetch(`${API_BASE}/places/amenities`).then(res => res.json()).then(data => setDbAmenities(data)).catch(err => console.error(err)).finally(() => setIsLoading(false));
  }, []);

  // Location logic (PE specific) - We'll add Spain logic later
  useEffect(() => {
    if (!formData.departamento) return;
    fetch(`${API_BASE}/ubigeo/provinces?department=${formData.departamento}`)
      .then(res => res.json())
      .then(data => setDbProvinces(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, [formData.departamento]);

  useEffect(() => {
    if (!formData.departamento || !formData.provincia) return;
    fetch(`${API_BASE}/ubigeo/districts?department=${formData.departamento}&province=${formData.provincia}`)
      .then(res => res.json())
      .then(data => {
        const fullDistricts = Array.isArray(data) ? data : [];
        setDbDistricts(fullDistricts);
        const currentBatch = fullDistricts.find(d => d.district === formData.distrito);
        if (currentBatch) setFormData(prev => ({ ...prev, ubigeoCode: currentBatch.ubigeoCode, ubigeoId: currentBatch.id }));
      })
      .catch(err => console.error(err));
  }, [formData.provincia, formData.departamento]);

  useEffect(() => {
    if (!activePlaceId) return;
    setIsLoading(true);
    Promise.all([
      businessApi.getProfile(activePlaceId),
      businessApi.getMenu(activePlaceId)
    ]).then(([profile, menu]) => {
      setFormData(prev => ({
        ...prev,
        nombre: profile.name || '',
        direccion: profile.address || '',
        categoriaId: profile.categoryId || '',
        ubigeoCode: profile.ubigeoCode || '',
        horarios: profile.openHoursText || '',
        precio: profile.priceMin ? String(profile.priceMin) : '',
        foto: profile.coverImageUrl || '',
        amenityIds: profile.amenityIds || []
      }));
      const allItems = menu.flatMap((cat: any) => cat.items.map((item: any) => ({
        id: item.id,
        nombre: item.name,
        descripcion: item.description,
        precio: String(item.price),
        foto: item.imageUrl,
        categoryId: cat.id
      })));
      setMenuItems(allItems);
    }).catch(err => {
      console.warn("Using mock data for profile demo");
      setFormData(prev => ({
        ...prev,
        nombre: "La Picantería del Sur",
        direccion: "Calle San Martín 456, Miraflores",
        horarios: "Lunes a Sábado: 12:00 PM - 11:00 PM",
        precio: "S/. 45 - 90",
        foto: "/images/interior.png"
      }));
      setMenuItems([
        { id: '1', nombre: 'Ceviche de la Casa', descripcion: 'Nuestro plato estrella con pesca del día y ají limo.', precio: '45', foto: '/images/hero.png' },
        { id: '2', nombre: 'Lomo Saltado Premium', descripcion: 'Finos cortes de lomo fino al wok con papas nativas.', precio: '55', foto: '/images/interior.png' }
      ]);
    }).finally(() => setIsLoading(false));
  }, [activePlaceId]);

  const handleSave = async () => {
    if (!activePlaceId) return;
    setIsLoading(true);
    try {
      await businessApi.updateProfile(activePlaceId, {
        name: formData.nombre,
        address: formData.direccion,
        categoryId: formData.categoriaId || undefined,
        ubigeoCode: formData.ubigeoCode || undefined,
        amenityIds: formData.amenityIds,
        openHoursText: formData.horarios,
        priceMin: formData.precio ? parseFloat(formData.precio.replace(/[^0-9.]/g, '')) : undefined,
        coverImageUrl: formData.foto
      });
      alert('Configuración actualizada con éxito.');
    } catch (err) {
      alert('Error al guardar los cambios.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Menu Management ---
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalData, setModalData] = useState({ nombre: '', descripcion: '', precio: '', foto: '' });

  const openModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setModalData({ ...item });
    } else {
      setEditingItem(null);
      setModalData({ nombre: '', descripcion: '', precio: '', foto: '' });
    }
    setShowModal(true);
  };

  const saveMenuItem = async () => {
    if (!activePlaceId) return;
    try {
      if (editingItem) {
        await businessApi.updateMenuItem(activePlaceId, editingItem.id, {
          name: modalData.nombre,
          description: modalData.descripcion,
          price: parseFloat(modalData.precio),
          imageUrl: modalData.foto
        });
      } else {
        const menu = await businessApi.getMenu(activePlaceId);
        const catId = menu[0]?.id;
        if (!catId) throw new Error('Crea una categoría primero.');
        await businessApi.createMenuItem(activePlaceId, {
          name: modalData.nombre,
          description: modalData.descripcion,
          price: parseFloat(modalData.precio),
          imageUrl: modalData.foto,
          categoryId: catId
        });
      }
      const menu = await businessApi.getMenu(activePlaceId);
      setMenuItems(menu.flatMap((cat: any) => cat.items.map((item: any) => ({
        id: item.id,
        nombre: item.name,
        descripcion: item.description,
        precio: String(item.price),
        foto: item.imageUrl,
        categoryId: cat.id
      }))));
      setShowModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl space-y-16 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-[var(--text)] tracking-tight font-warike">Mi Establecimiento</h1>
          <p className="text-[var(--text-muted)] font-bold text-lg max-w-xl leading-snug">Gestiona la identidad de tu Huarique para tus clientes en Perú y España.</p>
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
            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] ml-2">Imagen de Portada</label>
            <div className="aspect-[4/5] bg-white rounded-[3.5rem] overflow-hidden border-8 border-white shadow-2xl relative group cursor-pointer transition-all hover:scale-[1.02] duration-500 ring-1 ring-[var(--border)]">
              <img 
                src={formData.foto || '/images/interior.png'} 
                alt="Preview" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000"
              />
              <div className="absolute inset-0 bg-[var(--text)]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                <span className="text-5xl mb-4">📸</span>
                <span className="text-white font-black text-sm uppercase tracking-widest">Cambiar Imagen</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-[var(--border)] space-y-6">
             <h3 className="font-black text-[var(--text)] text-xl flex justify-between items-center font-warike">
                Servicios 
                <span className="text-[10px] bg-[var(--background)] px-3 py-1.5 rounded-full text-[var(--text-muted)] font-black">
                  {formData.amenityIds.length} ACTIVOS
                </span>
             </h3>
             <div className="flex flex-wrap gap-2.5">
                {dbAmenities.map(amenity => (
                  <button
                    key={amenity.id}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      amenityIds: prev.amenityIds.includes(amenity.id) 
                        ? prev.amenityIds.filter(s => s !== amenity.id) 
                        : [...prev.amenityIds, amenity.id]
                    }))}
                    className={`px-5 py-3 rounded-2xl text-[11px] font-black transition-all border-2 ${
                      formData.amenityIds.includes(amenity.id)
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                      : 'bg-white border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]'
                    }`}
                  >
                    {amenity.name.toUpperCase()}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Main Data */}
        <div className="lg:col-span-8 space-y-12">
          
          <section className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-[var(--border)] space-y-10">
            <h3 className="text-2xl font-black text-[var(--text)] flex items-center gap-4 font-warike">
              <div className="w-4 h-4 bg-[var(--secondary)] rounded-full"></div> 
              Información del Local
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <InputGroup 
                  label="Nombre del Huarique" 
                  value={formData.nombre} 
                  onChange={(v) => setFormData({...formData, nombre: v})} 
                  placeholder="Ej. El Secreto de Surquillo"
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Especialidad</label>
                <div className="relative">
                  <select 
                    value={formData.categoriaId}
                    onChange={(e) => setFormData({...formData, categoriaId: e.target.value})}
                    className="input-premium appearance-none cursor-pointer"
                  >
                    {dbCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">▼</span>
                </div>
              </div>

              <InputGroup 
                label="Precio Promedio (Rango)" 
                value={formData.precio} 
                onChange={(v) => setFormData({...formData, precio: v})} 
                placeholder="S/. 30 - 60"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Horarios de Atención</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl">🕒</span>
                <input 
                  type="text" 
                  value={formData.horarios}
                  onChange={(e) => setFormData({...formData, horarios: e.target.value})}
                  className="input-premium pl-16"
                  placeholder="Lun a Dom: 12:00 PM - 10:00 PM"
                />
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-[var(--border)] space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h3 className="text-2xl font-black text-[var(--text)] flex items-center gap-4 font-warike">
                <div className="w-4 h-4 bg-[var(--accent)] rounded-full"></div> 
                Ubicación Geográfica
              </h3>
              <div className="flex bg-[var(--background)] p-1.5 rounded-2xl border border-[var(--border)]">
                <button 
                  onClick={() => setCountry('PE')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${country === 'PE' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                >
                  🇵🇪 Perú
                </button>
                <button 
                  onClick={() => setCountry('ES')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${country === 'ES' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                >
                  🇪🇸 España
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SelectGroup 
                label={country === 'PE' ? "Departamento" : "C. Autónoma"} 
                value={formData.departamento} 
                onChange={(v) => setFormData({...formData, departamento: v})} 
                options={country === 'PE' ? dbDepartments : ['Madrid', 'Cataluña', 'Andalucía', 'Valencia']} 
                isLoading={isLoading} 
              />
              <SelectGroup 
                label="Provincia" 
                value={formData.provincia} 
                onChange={(v) => setFormData({...formData, provincia: v})} 
                options={country === 'PE' ? dbProvinces : ['Madrid', 'Barcelona', 'Sevilla', 'Valencia']} 
              />
              <SelectGroup 
                label={country === 'PE' ? "Distrito" : "Municipio"} 
                value={formData.distrito} 
                onChange={(v) => setFormData({...formData, distrito: v})} 
                options={country === 'PE' ? dbDistricts.map(d => d.district) : ['Centro', 'Salamanca', 'Chamberí', 'Retiro']} 
              />
            </div>

            {country === 'PE' && (
              <div className="bg-[var(--background)] p-6 rounded-3xl border border-[var(--border)] flex justify-between items-center px-8">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">CÓDIGO UBIGEO</span>
                <span className="text-lg font-black text-[var(--primary)]">{formData.ubigeoCode || '---'}</span>
              </div>
            )}

            <InputGroup 
              label="Dirección Exacta" 
              value={formData.direccion} 
              onChange={(v) => setFormData({...formData, direccion: v})} 
              placeholder="Av. Principal 123, Miraflores..."
              icon="📍"
            />
          </section>
        </div>
      </div>

      {/* Menu Management Section */}
      <section className="space-y-12 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-[var(--border)] pb-10">
          <div>
            <h2 className="text-5xl font-black text-[var(--text)] tracking-tighter font-warike italic">La Carta</h2>
            <p className="text-[var(--text-muted)] font-bold text-lg mt-2">Tus platos estrella, los que generan las mejores reseñas.</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-[var(--text)] text-white px-10 py-5 rounded-2xl font-black text-sm hover:scale-[1.05] transition-all flex items-center gap-3 shadow-2xl shadow-black/20 uppercase tracking-widest"
          >
            <span className="text-2xl">+</span> Agregar Plato
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {menuItems.map(item => (
            <div key={item.id} className="bg-white rounded-[3.5rem] overflow-hidden border border-[var(--border)] shadow-sm group hover:shadow-2xl transition-all duration-700 hover:-translate-y-2">
              <div className="aspect-[4/3] relative overflow-hidden">
                <img src={item.foto} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <button onClick={() => openModal(item)} className="bg-white/90 backdrop-blur-md w-12 h-12 rounded-2xl text-[var(--text)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white transition-all shadow-xl font-bold">✏️</button>
                  <button onClick={() => {}} className="bg-white/90 backdrop-blur-md w-12 h-12 rounded-2xl text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-xl font-bold">🗑️</button>
                </div>
                <div className="absolute bottom-6 left-6">
                  <span className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-2xl font-black text-[var(--primary)] text-lg shadow-xl border border-white">S/. {item.precio}</span>
                </div>
              </div>
              <div className="p-10 space-y-4">
                <h4 className="font-black text-[var(--text)] text-2xl leading-tight font-warike uppercase">{item.nombre}</h4>
                <p className="text-[var(--text-muted)] text-[15px] font-bold leading-relaxed line-clamp-2">{item.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dish Modal (Styled) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-[var(--text)]/40 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl relative overflow-hidden border-8 border-white">
            <div className="p-12 space-y-10">
              <div className="text-center">
                <h3 className="text-4xl font-black text-[var(--text)] tracking-tighter font-warike uppercase">{editingItem ? 'Editar Especialidad' : 'Nueva Especialidad'}</h3>
                <p className="text-[var(--text-muted)] text-sm font-bold mt-2 uppercase tracking-widest">Presume tu mejor sazón</p>
              </div>

              <div className="space-y-6">
                <InputGroup label="Nombre del Plato" value={modalData.nombre} onChange={(v) => setModalData({...modalData, nombre: v})} />
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Descripción del Sabor</label>
                  <textarea value={modalData.descripcion} onChange={(e) => setModalData({...modalData, descripcion: e.target.value})} className="input-premium min-h-[140px] resize-none py-5" placeholder="Cuéntanos el secreto de este plato..." />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <InputGroup label="Precio" value={modalData.precio} onChange={(v) => setModalData({...modalData, precio: v})} />
                  <InputGroup label="URL Imagen" value={modalData.foto} onChange={(v) => setModalData({...modalData, foto: v})} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 bg-[var(--background)] text-[var(--text-muted)] py-5 rounded-3xl font-black hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Cancelar</button>
                <button onClick={saveMenuItem} className="flex-[2] btn-primary uppercase tracking-[0.2em] text-xs">Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputGroup({ label, value, onChange, icon, placeholder }: { label: string, value: string, onChange: (v: string) => void, icon?: string, placeholder?: string }) {
  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl">{icon}</span>}
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`input-premium ${icon ? 'pl-16' : ''}`} />
      </div>
    </div>
  );
}

function SelectGroup({ label, value, onChange, options, isLoading }: { label: string, value: string, onChange: (v: string) => void, options: string[], isLoading?: boolean }) {
  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={isLoading} className="input-premium appearance-none cursor-pointer disabled:opacity-50">
          {!isLoading && options.length === 0 && <option value="">Seleccione...</option>}
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <span className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">{isLoading ? '⌛' : '▼'}</span>
      </div>
    </div>
  );
}
