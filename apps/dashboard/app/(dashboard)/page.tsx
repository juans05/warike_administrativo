'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { businessApi } from '../../lib/api-client';

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
  const [dbDistricts, setDbDistricts] = useState<any[]>([]); // Store full objects
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbAmenities, setDbAmenities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Core Data (Departments, Categories, Amenities)
  useEffect(() => {
    setIsLoading(true);
    
    // Departments
    fetch(`${API_BASE}/ubigeo/departments`)
      .then(res => res.json())
      .then(data => setDbDepartments(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching depts:', err));

    // Categories
    fetch(`${API_BASE}/places/categories`)
      .then(res => res.json())
      .then(data => {
        setDbCategories(data);
        if (data.length > 0 && !formData.categoriaId) {
          setFormData(prev => ({ ...prev, categoriaId: data[0].id }));
        }
      })
      .catch(err => console.error('Error fetching categories:', err));

    // Amenities
    fetch(`${API_BASE}/places/amenities`)
      .then(res => res.json())
      .then(data => setDbAmenities(data))
      .catch(err => console.error('Error fetching amenities:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Fetch Provinces when Department changes
  useEffect(() => {
    if (!formData.departamento) return;
    fetch(`${API_BASE}/ubigeo/provinces?department=${formData.departamento}`)
      .then(res => res.json())
      .then(data => {
        const provinceList = Array.isArray(data) ? data : [];
        setDbProvinces(provinceList);
        if (provinceList.length > 0 && !provinceList.includes(formData.provincia)) {
          setFormData(prev => ({ ...prev, provincia: provinceList[0], distrito: '' }));
        }
      })
      .catch(err => console.error('Error fetching provinces:', err));
  }, [formData.departamento]);

  // Fetch Districts when Province changes
  useEffect(() => {
    if (!formData.departamento || !formData.provincia) return;
    fetch(`${API_BASE}/ubigeo/districts?department=${formData.departamento}&province=${formData.provincia}`)
      .then(res => res.json())
      .then(data => {
        const fullDistricts = Array.isArray(data) ? data : [];
        setDbDistricts(fullDistricts);
        
        // Find existing district or select first
        const currentBatch = fullDistricts.find(d => d.district === formData.distrito);
        if (currentBatch) {
          setFormData(prev => ({ ...prev, ubigeoCode: currentBatch.ubigeoCode, ubigeoId: currentBatch.id }));
        } else if (fullDistricts.length > 0 && !formData.distrito) {
          setFormData(prev => ({ 
            ...prev, 
            distrito: fullDistricts[0].district,
            ubigeoCode: fullDistricts[0].ubigeoCode,
            ubigeoId: fullDistricts[0].id
          }));
        }
      })
      .catch(err => console.error('Error fetching districts:', err));
  }, [formData.provincia, formData.departamento]);

  // Fetch Profile and Menu when activePlaceId changes
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
      // Flatten menu items for the simplified view
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
      console.error('Error loading restaurant data:', err);
      setError('No se pudo cargar la información del restaurante.');
    }).finally(() => setIsLoading(false));
  }, [activePlaceId]);

  const handleDistrictChange = (districtName: string) => {
    const selected = dbDistricts.find(d => d.district === districtName);
    setFormData({
      ...formData,
      distrito: districtName,
      ubigeoCode: selected?.ubigeoCode || '',
      ubigeoId: selected?.id || ''
    });
  };

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
      alert('Cambios guardados con éxito');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error al guardar los cambios.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(id)
        ? prev.amenityIds.filter(s => s !== id)
        : [...prev.amenityIds, id]
    }));
  };

  // --- Menu Management (La Carta) ---
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
        // We need a categoryId to create an item. 
        // For this simple view, we'll use the first category if available or a default.
        const menu = await businessApi.getMenu(activePlaceId);
        const catId = menu[0]?.id;
        if (!catId) throw new Error('Crea una categoría en la sección La Carta primero.');

        await businessApi.createMenuItem(activePlaceId, {
          name: modalData.nombre,
          description: modalData.descripcion,
          price: parseFloat(modalData.precio),
          imageUrl: modalData.foto,
          categoryId: catId
        });
      }
      // Reload everything
      const menu = await businessApi.getMenu(activePlaceId);
      const allItems = menu.flatMap((cat: any) => cat.items.map((item: any) => ({
        id: item.id,
        nombre: item.name,
        descripcion: item.description,
        precio: String(item.price),
        foto: item.imageUrl,
        categoryId: cat.id
      })));
      setMenuItems(allItems);
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Error al guardar el plato');
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!activePlaceId) return;
    if (confirm('¿Estás seguro de eliminar este plato?')) {
      try {
        await businessApi.deleteMenuItem(activePlaceId, id);
        setMenuItems(menuItems.filter(m => m.id !== id));
      } catch (err) {
        alert('Error al eliminar el plato');
      }
    }
  };

  return (
    <div className="max-w-5xl space-y-10 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">Mi Establecimiento</h1>
          <p className="text-[#6B7280] font-medium text-sm text-balance">Configura la información que verán tus clientes en Wuarike.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-[#F26122] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-[#F26122]/20 hover:scale-[1.02] transition-transform active:scale-95 flex items-center gap-2"
        >
          <span>💾</span> Guardar Cambios
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Profile Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Imagen Principal</label>
            <div className="aspect-[4/5] bg-gray-100 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative group cursor-pointer transition-all hover:ring-8 hover:ring-[#F26122]/5">
              <img 
                src={formData.foto} 
                alt="Preview" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                <span className="text-3xl mb-2">📸</span>
                <span className="text-white font-bold text-sm">Actualizar Foto de Portada</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
             <h3 className="font-bold text-[#1A1A1A] flex justify-between items-center">
                Servicios 
                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-400">
                  {Array.isArray(dbAmenities) ? formData.amenityIds.length : 0} activos
                </span>
             </h3>
             <div className="flex flex-wrap gap-2">
                {Array.isArray(dbAmenities) ? (
                  dbAmenities.map(amenity => (
                    <button
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                        formData.amenityIds.includes(amenity.id)
                        ? 'bg-[#F26122] border-[#F26122] text-white shadow-md'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-[#F26122]'
                      }`}
                    >
                      {amenity.name}
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-400 italic">Cargando servicios...</p>
                )}
             </div>
          </div>
        </div>

        {/* Data Sections */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* General Info */}
          <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-lg font-black text-[#1A1A1A] px-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F26122] rounded-full"></span> Información General
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <InputGroup 
                  label="Nombre Comercial" 
                  value={formData.nombre} 
                  onChange={(v) => setFormData({...formData, nombre: v})} 
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Categoría</label>
                <div className="relative">
                  <select 
                    value={formData.categoriaId}
                    onChange={(e) => setFormData({...formData, categoriaId: e.target.value})}
                    className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 focus:ring-4 focus:ring-[#F26122]/10 outline-none transition-all font-semibold text-[#1A1A1A] text-sm appearance-none cursor-pointer"
                  >
                    {Array.isArray(dbCategories) && dbCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</span>
                </div>
              </div>

              <InputGroup 
                label="Rango de Precios" 
                value={formData.precio} 
                onChange={(v) => setFormData({...formData, precio: v})} 
              />
            </div>
          </section>

          {/* Location Info */}
          <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-lg font-black text-[#1A1A1A] px-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F26122] rounded-full"></span> Ubicación Detallada
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectGroup 
                label="Departamento" 
                value={formData.departamento} 
                onChange={(v) => setFormData({...formData, departamento: v})} 
                options={dbDepartments}
                isLoading={isLoading}
              />
              <SelectGroup 
                label="Provincia" 
                value={formData.provincia} 
                onChange={(v) => setFormData({...formData, provincia: v})} 
                options={dbProvinces}
              />
              <SelectGroup 
                label="Distrito" 
                value={formData.distrito} 
                onChange={handleDistrictChange} 
                options={dbDistricts.map(d => d.district)}
              />
            </div>

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex justify-between items-center">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ubigeo Code Interno</span>
              <span className="text-sm font-black text-blue-600">{formData.ubigeoCode || '---'}</span>
            </div>

            <InputGroup 
              label="Dirección Específica" 
              value={formData.direccion} 
              onChange={(v) => setFormData({...formData, direccion: v})} 
              icon="📍"
            />
          </section>

          {/* Menu Section */}
          <section className="space-y-8 pt-6">
            <div className="flex justify-between items-end px-2">
              <div>
                <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tight">La Carta</h2>
                <p className="text-[#6B7280] font-medium text-sm">Visualiza y edita los platos estrella de tu cocina.</p>
              </div>
              <button 
                onClick={() => openModal()}
                className="bg-[#1A1A1A] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:scale-[1.02] transition-transform flex items-center gap-2 shadow-lg"
              >
                <span className="text-lg">+</span> Agregar Plato
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm group hover:shadow-2xl transition-all duration-500">
                  <div className="aspect-square relative overflow-hidden">
                    <img src={item.foto} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(item)} className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-lg">✏️</button>
                      <button onClick={() => deleteMenuItem(item.id)} className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-lg">🗑️</button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl font-black text-[#F26122] text-sm shadow-sm border border-orange-50">S/. {item.precio}</span>
                    </div>
                  </div>
                  <div className="p-7 space-y-2">
                    <h4 className="font-black text-[#1A1A1A] text-lg leading-tight uppercase tracking-tight">{item.nombre}</h4>
                    <p className="text-gray-400 text-[13px] font-medium leading-relaxed line-clamp-3">{item.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>

          </section>


      {/* Dish Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 space-y-8">
              <div>
                <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter">{editingItem ? 'EDITAR PLATO' : 'NUEVO PLATO'}</h3>
                <p className="text-gray-400 text-sm font-medium">Completa los detalles de tu especialidad.</p>
              </div>

              <div className="space-y-5">
                <InputGroup 
                  label="Nombre del Plato" 
                  value={modalData.nombre} 
                  onChange={(v) => setModalData({...modalData, nombre: v})} 
                />
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Descripción Detallada</label>
                  <textarea 
                    value={modalData.descripcion}
                    onChange={(e) => setModalData({...modalData, descripcion: e.target.value})}
                    className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 focus:ring-4 focus:ring-[#F26122]/10 outline-none transition-all font-semibold text-[#1A1A1A] text-sm min-h-[120px] resize-none"
                    placeholder="Describe los ingredientes, origen o sabor..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup 
                    label="Monto (S/.)" 
                    value={modalData.precio} 
                    onChange={(v) => setModalData({...modalData, precio: v})} 
                  />
                  <InputGroup 
                    label="URL de la Foto" 
                    value={modalData.foto} 
                    onChange={(v) => setModalData({...modalData, foto: v})} 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black hover:bg-gray-200 transition-colors"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={saveMenuItem}
                  className="flex-[2] bg-[#F26122] text-white py-4 rounded-2xl font-black shadow-lg shadow-[#F26122]/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                  {editingItem ? 'ACTUALIZAR' : 'GUARDAR PLATO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Operational Info */}
          <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
            <InputGroup 
              label="Horarios de Atención Publicados" 
              value={formData.horarios} 
              onChange={(v) => setFormData({...formData, horarios: v})} 
              icon="🕒"
            />
          </section>

        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, icon }: { label: string, value: string, onChange: (v: string) => void, icon?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 ${icon ? 'pl-12' : ''} focus:ring-4 focus:ring-[#F26122]/10 outline-none transition-all font-semibold text-[#1A1A1A] text-sm`}
        />
      </div>
    </div>
  );
}

function SelectGroup({ label, value, onChange, options, isLoading }: { label: string, value: string, onChange: (v: string) => void, options: string[], isLoading?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
      <div className="relative">
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 focus:ring-4 focus:ring-[#F26122]/10 outline-none transition-all font-semibold text-[#1A1A1A] text-sm appearance-none cursor-pointer disabled:opacity-50"
        >
          {!isLoading && options.length === 0 && <option value="">Seleccione...</option>}
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <span className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          {isLoading ? '⌛' : '▼'}
        </span>
      </div>
    </div>
  );
}
