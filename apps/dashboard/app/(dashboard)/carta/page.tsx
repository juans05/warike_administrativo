'use client';

import React, { useEffect, useState } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: string;
}

interface MenuCategory {
  id: string;
  name: string;
  order: number;
  items: MenuItem[];
}

export default function CartaPage() {
  const { activePlaceId } = useRestaurant();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [modalData, setModalData] = useState({ name: '', description: '', price: '', imageUrl: '', categoryId: '' });

  const [menuType, setMenuType] = useState<'digital' | 'photo'>('digital');
  const [menuPhoto, setMenuPhoto] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const loadMenu = async () => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      // Load digital menu
      const data = await businessApi.getMenu(activePlaceId);
      setCategories(data);

      // Load profile for menu photo
      const profile = await businessApi.getProfile(activePlaceId);
      if (profile.menuImageUrl) {
        setMenuPhoto(profile.menuImageUrl);
        setMenuType('photo');
      }
    } catch (err) {
      console.error('Error loading menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMenuPhoto = async () => {
    if (!activePlaceId) return;
    setIsSavingPhoto(true);
    try {
      await businessApi.updateProfile(activePlaceId, { menuImageUrl: menuPhoto });
      alert('Imagen de la carta guardada con éxito.');
    } catch (err) {
      alert('Error al guardar la imagen');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [activePlaceId]);

  const openModal = (item: MenuItem | null = null, catId: string = '') => {
    if (item) {
      setEditingItem(item);
      setModalData({
        name: item.name,
        description: item.description || '',
        price: String(item.price),
        imageUrl: item.imageUrl || '',
        categoryId: item.categoryId
      });
    } else {
      setEditingItem(null);
      setModalData({ name: '', description: '', price: '', imageUrl: '', categoryId: catId || (categories[0]?.id || '') });
    }
    setShowModal(true);
  };

  const openCategoryModal = (category: MenuCategory | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!activePlaceId || !categoryName.trim()) return;
    try {
      if (editingCategory) {
        // Editar categoría (si la API lo soporta)
        await businessApi.updateCategory(activePlaceId, editingCategory.id, { name: categoryName, order: editingCategory.order });
      } else {
        // Crear categoría
        await businessApi.createCategory(activePlaceId, { name: categoryName, order: categories.length });
      }
      setShowCategoryModal(false);
      loadMenu();
    } catch (err) {
      alert('Error al guardar la categoría');
    }
  };

  const handleSave = async () => {
    if (!activePlaceId) return;
    try {
      const payload = {
        name: modalData.name,
        description: modalData.description,
        price: parseFloat(modalData.price),
        imageUrl: modalData.imageUrl,
        categoryId: modalData.categoryId
      };

      if (editingItem) {
        await businessApi.updateMenuItem(activePlaceId, editingItem.id, payload);
      } else {
        await businessApi.createMenuItem(activePlaceId, payload);
      }
      setShowModal(false);
      loadMenu();
    } catch (err) {
      alert('Error al guardar el plato');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!activePlaceId || !confirm('¿Eliminar este plato?')) return;
    try {
      await businessApi.deleteMenuItem(activePlaceId, itemId);
      loadMenu();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  if (isLoading) return <div className="p-20 text-center font-bold text-gray-400">Cargando la carta...</div>;

  return (
    <div className="space-y-12 pb-20 max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">La Carta</h1>
          <p className="text-[#6B7280] font-medium max-w-md">Elige cómo quieres mostrar tus productos a los clientes.</p>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 self-stretch md:self-auto">
          <button 
            onClick={() => setMenuType('digital')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all ${menuType === 'digital' ? 'bg-[#F26122] text-white shadow-lg shadow-orange-200' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            Digital Pro
          </button>
          <button 
            onClick={() => setMenuType('photo')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all ${menuType === 'photo' ? 'bg-[#F26122] text-white shadow-lg shadow-orange-200' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            Solo Foto
          </button>
        </div>
      </header>

      {menuType === 'photo' ? (
        <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#1A1A1A]">Carta en Imagen</h2>
              <p className="text-gray-400 font-medium">Sube una foto clara de tu carta física. Es lo más rápido para empezar.</p>
            </div>

            <div className="aspect-[3/4] md:aspect-square bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 overflow-hidden relative group">
              {menuPhoto ? (
                <>
                  <img src={menuPhoto} className="w-full h-full object-contain" alt="Carta Física" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setMenuPhoto('')} className="bg-white text-red-600 px-6 py-3 rounded-2xl font-bold">Cambiar Imagen</button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center gap-4">
                  <span className="text-5xl">📷</span>
                  <div>
                    <p className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Pega la URL de la imagen aquí</p>
                    <input 
                      type="text" 
                      placeholder="https://instasize.com/..." 
                      className="mt-4 w-full bg-white border border-gray-100 py-4 px-6 rounded-2xl outline-none focus:ring-4 focus:ring-orange-50 font-bold"
                      onChange={(e) => setMenuPhoto(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={saveMenuPhoto}
              disabled={isSavingPhoto || !menuPhoto}
              className="w-full bg-[#1A1A1A] text-white py-5 rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
            >
              {isSavingPhoto ? 'GUARDANDO...' : 'GUARDAR CARTA'}
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="flex justify-end">
            <button 
              onClick={() => openModal()}
              className="bg-[#F26122] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-[#F26122]/20 hover:scale-[1.02] transition-transform active:scale-95 flex items-center gap-2"
            >
              <span>+</span> Nuevo Plato
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] p-20 text-center">
              <p className="text-gray-400 font-bold mb-4">No tienes categorías en tu menú digital</p>
              <button
                onClick={() => openCategoryModal()}
                className="text-[#F26122] font-black underline hover:text-orange-600 transition-colors"
              >
                Crear mi primera categoría
              </button>
            </div>
          ) : (
            <div className="space-y-16">
              {categories.map((category) => (
                <section key={category.id} className="space-y-8">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">{category.name}</h2>
                      <button
                        onClick={() => openCategoryModal(category)}
                        className="text-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                        title="Editar categoría"
                      >
                        ✏️
                      </button>
                    </div>
                    <button
                      onClick={() => openModal(null, category.id)}
                      className="text-xs font-bold text-[#F26122] bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors"
                    >
                      + Agregar a {category.name}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
                    {category.items.map((item) => (
                      <div key={item.id} className="group bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all">
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(item)} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-blue-600 shadow-lg hover:bg-blue-600 hover:text-white transition-all">✏️</button>
                            <button onClick={() => handleDelete(item.id)} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-600 shadow-lg hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl font-black text-[#F26122] text-sm shadow-sm border border-orange-50">S/. {item.price}</span>
                          </div>
                        </div>
                        <div className="p-7 space-y-2">
                          <h4 className="font-black text-[#1A1A1A] text-lg leading-tight uppercase tracking-tight">{item.name}</h4>
                          <p className="text-gray-400 text-[13px] font-medium leading-relaxed line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="p-10 space-y-8">
              <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter">{editingItem ? 'EDITAR PLATO' : 'NUEVO PLATO'}</h3>
              <div className="space-y-4">
                <input
                  type="text" placeholder="Nombre del plato" value={modalData.name}
                  onChange={(e) => setModalData({...modalData, name: e.target.value})}
                  className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 outline-none font-bold text-sm"
                />
                <textarea
                  placeholder="Descripción" value={modalData.description}
                  onChange={(e) => setModalData({...modalData, description: e.target.value})}
                  className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 outline-none font-bold text-sm min-h-[100px]"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number" placeholder="Precio (S/.)" value={modalData.price}
                    onChange={(e) => setModalData({...modalData, price: e.target.value})}
                    className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 outline-none font-bold text-sm"
                  />
                  <select
                    value={modalData.categoryId}
                    onChange={(e) => setModalData({...modalData, categoryId: e.target.value})}
                    className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 outline-none font-bold text-sm"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <input
                  type="text" placeholder="URL de la imagen" value={modalData.imageUrl}
                  onChange={(e) => setModalData({...modalData, imageUrl: e.target.value})}
                  className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 outline-none font-bold text-sm"
                />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-black">CANCELAR</button>
                <button onClick={handleSave} className="flex-[2] bg-[#F26122] text-white py-4 rounded-2xl font-black">GUARDAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-md" onClick={() => setShowCategoryModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="p-10 space-y-8">
              <div>
                <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter">
                  {editingCategory ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}
                </h3>
                <p className="text-gray-400 text-sm font-medium mt-2">
                  {editingCategory ? 'Modifica el nombre de tu categoría' : 'Crea una nueva sección para tu menú'}
                </p>
              </div>

              <input
                type="text"
                placeholder="Nombre de la categoría"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                autoFocus
                className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 outline-none font-bold text-sm focus:ring-4 focus:ring-orange-100"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 bg-gray-100 py-4 rounded-2xl font-black text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={!categoryName.trim()}
                  className="flex-1 bg-[#F26122] text-white py-4 rounded-2xl font-black hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCategory ? 'ACTUALIZAR' : 'CREAR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
