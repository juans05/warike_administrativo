'use client';

import React, { useEffect, useState } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { toast } from 'sonner';

type CategoryType = 'food' | 'drink' | 'dessert' | 'other';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  videoUrl?: string;
  isVegetarian?: boolean;
  categoryId: string;
}

interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  categoryType?: CategoryType;
  dishes: MenuItem[];
}

const DEFAULT_DISH_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

const CATEGORY_TYPE_META: Record<CategoryType, { label: string; icon: string }> = {
  food: { label: 'Platos', icon: '🍽️' },
  drink: { label: 'Bebidas', icon: '🥤' },
  dessert: { label: 'Postres', icon: '🍰' },
  other: { label: 'Otro', icon: '✦' },
};

export default function CartaPage() {
  const { activePlaceId } = useRestaurant();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<CategoryType>('food');
  const [isSaving, setIsSaving] = useState(false);
  const [modalData, setModalData] = useState({ name: '', description: '', price: '', imageUrl: '', videoUrl: '', isVegetarian: false, categoryId: '' });
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [menuType, setMenuType] = useState<'digital' | 'photo'>('digital');
  const [menuPhoto, setMenuPhoto] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLogoOnQr, setShowLogoOnQr] = useState(true);

  const totalDishes = categories.reduce((acc, c) => acc + (c.dishes?.length || 0), 0);

  const publicMenuLink = typeof window !== 'undefined' && activePlaceId
    ? `${window.location.origin}/menu/${activePlaceId}`
    : '';

  const loadMenu = async () => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const data = await businessApi.getMenu(activePlaceId);
      setCategories(Array.isArray(data) ? data : []);
      const profile = await businessApi.getProfile(activePlaceId);
      if (profile.menuImageUrl) {
        setMenuPhoto(profile.menuImageUrl);
        setMenuType('photo');
      }
      setLogoUrl(profile.logoUrl || '');
      setShowLogoOnQr(profile.showLogoOnQr ?? true);
    } catch (err) {
      console.error('Error loading menu:', err);
      toast.error('Error al cargar la carta');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMenuPhoto = async () => {
    if (!activePlaceId) return;
    setIsSavingPhoto(true);
    try {
      await businessApi.updateProfile(activePlaceId, { menuImageUrl: menuPhoto });
      toast.success('Imagen de la carta guardada.');
    } catch {
      toast.error('Error al guardar la imagen');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  useEffect(() => { loadMenu(); }, [activePlaceId]);

  const openModal = (item: MenuItem | null = null, catId: string = '') => {
    if (item) {
      setEditingItem(item);
      setModalData({ name: item.name, description: item.description || '', price: String(item.price), imageUrl: item.imageUrl || '', videoUrl: item.videoUrl || '', isVegetarian: item.isVegetarian || false, categoryId: item.categoryId });
    } else {
      setEditingItem(null);
      setModalData({ name: '', description: '', price: '', imageUrl: '', videoUrl: '', isVegetarian: false, categoryId: catId || (categories[0]?.id || '') });
    }
    setShowModal(true);
  };

  const openCategoryModal = (category: MenuCategory | null = null) => {
    setEditingCategory(category);
    setCategoryName(category?.name || '');
    setCategoryType(category?.categoryType || 'food');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!activePlaceId || !categoryName.trim()) return;
    setIsSaving(true);
    try {
      if (editingCategory) {
        await businessApi.updateCategory(activePlaceId, editingCategory.id, { name: categoryName, displayOrder: editingCategory.displayOrder, categoryType });
      } else {
        await businessApi.createCategory(activePlaceId, { name: categoryName, displayOrder: categories.length, categoryType });
      }
      setShowCategoryModal(false);
      toast.success(editingCategory ? 'Categoría actualizada' : 'Categoría creada');
      loadMenu();
    } catch {
      toast.error('Error al guardar la categoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingVideo(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload/video`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('Error al subir el video');
      const data = await res.json();
      setModalData(prev => ({ ...prev, videoUrl: data.url }));
      toast.success('Video subido');
    } catch {
      toast.error('No se pudo subir el video (máx. 16MB, formato MP4)');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activePlaceId) return;
    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('Error al subir el logo');
      const data = await res.json();
      setLogoUrl(data.url);
      await businessApi.updateProfile(activePlaceId, { logoUrl: data.url });
      toast.success('Logo actualizado');
    } catch {
      toast.error('No se pudo subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleToggleShowLogoOnQr = async () => {
    if (!activePlaceId) return;
    const next = !showLogoOnQr;
    setShowLogoOnQr(next);
    try {
      await businessApi.updateProfile(activePlaceId, { showLogoOnQr: next });
    } catch {
      setShowLogoOnQr(!next);
      toast.error('No se pudo guardar la preferencia');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!activePlaceId || !confirm('¿Eliminar esta categoría y todos sus platos?')) return;
    try {
      await businessApi.deleteCategory(activePlaceId, categoryId);
      toast.success('Categoría eliminada');
      loadMenu();
    } catch {
      toast.error('Error al eliminar la categoría');
    }
  };

  const handleSave = async () => {
    if (!activePlaceId || !modalData.name.trim()) return;
    setIsSaving(true);
    try {
      const payload = { name: modalData.name, description: modalData.description, price: parseFloat(modalData.price) || 0, imageUrl: modalData.imageUrl, videoUrl: modalData.videoUrl, isVegetarian: modalData.isVegetarian, categoryId: modalData.categoryId };
      if (editingItem) {
        await businessApi.updateMenuItem(activePlaceId, editingItem.id, payload);
      } else {
        await businessApi.createMenuItem(activePlaceId, payload);
      }
      setShowModal(false);
      toast.success(editingItem ? 'Plato actualizado' : 'Plato creado');
      loadMenu();
    } catch {
      toast.error('Error al guardar el plato');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!activePlaceId || !confirm('¿Eliminar este plato?')) return;
    try {
      await businessApi.deleteMenuItem(activePlaceId, itemId);
      toast.success('Plato eliminado');
      loadMenu();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl pb-24 space-y-8">
        <style>{`
          @keyframes shimmer {
            0% { background-position: -800px 0; }
            100% { background-position: 800px 0; }
          }
          .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 800px 100%;
            animation: shimmer 1.4s infinite linear;
            border-radius: 8px;
          }
        `}</style>

        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-8 w-40" />
            <div className="skeleton h-3 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-32 rounded-xl" />
            <div className="skeleton h-10 w-28 rounded-xl" />
            <div className="skeleton h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* Category card skeleton × 2 */}
        {[1, 2].map((n) => (
          <div key={n} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Category header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="skeleton w-2 h-2 rounded-full" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-5 w-14 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton h-7 w-24 rounded-lg" />
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="skeleton w-8 h-8 rounded-lg" />
              </div>
            </div>

            {/* Dish grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-gray-100">
              {[1, 2, 3, n === 1 ? 4 : null].filter(Boolean).map((i) => (
                <div key={i} className="bg-white">
                  <div className="skeleton aspect-[4/3] rounded-none" />
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between gap-2">
                      <div className="skeleton h-4 w-28" />
                      <div className="skeleton h-4 w-12" />
                    </div>
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-6xl pb-24 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-[#F26122] uppercase tracking-widest mb-1">Gestión de menú</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">La Carta</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'} · {totalDishes} {totalDishes === 1 ? 'plato' : 'platos'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMenuType('digital')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${menuType === 'digital' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Digital
            </button>
            <button
              onClick={() => setMenuType('photo')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${menuType === 'photo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Foto
            </button>
          </div>

          {menuType === 'digital' && (
            <>
              <button
                onClick={() => openCategoryModal()}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-bold hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Categoría
              </button>
              <button
                onClick={() => openModal()}
                className="px-5 py-2.5 rounded-xl bg-[#F26122] text-white text-sm font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Nuevo Plato
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Compartir carta ── */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-orange-900 uppercase tracking-widest mb-1">📱 Así ve tu carta el comensal</p>
          <p className="text-orange-700 text-xs font-bold break-all">{publicMenuLink}</p>
          {menuType === 'photo' && (
            <p className="text-amber-600 text-[11px] font-bold mt-1">⚠️ Estás en modo "Foto" — asegurate de guardar la imagen abajo para que este enlace muestre algo.</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { navigator.clipboard.writeText(publicMenuLink); toast.success('Enlace copiado'); }}
            className="px-4 py-2.5 bg-[#F26122] text-white rounded-xl text-xs font-black hover:bg-orange-600 transition-all"
          >
            Copiar enlace
          </button>
          <button
            onClick={() => {
              const text = `Mirá nuestra carta: ${publicMenuLink}`;
              if (navigator.share) {
                navigator.share({ title: 'Carta digital', url: publicMenuLink, text });
              } else {
                navigator.clipboard.writeText(text);
                toast.success('Mensaje copiado');
              }
            }}
            className="px-4 py-2.5 bg-white border border-orange-200 text-orange-600 rounded-xl text-xs font-black hover:bg-orange-100 transition-all"
          >
            Compartir
          </button>
        </div>
      </div>

      {/* ── Logo del negocio ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 bg-gray-50">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🏷️</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900">Logo del negocio</p>
          <p className="text-gray-400 text-xs mt-0.5">Aparece centrado arriba de tu carta digital para que la reconozcan de un vistazo.</p>
        </div>
        <label className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-gray-800 transition-all cursor-pointer shrink-0">
          {uploadingLogo ? 'Subiendo...' : logoUrl ? 'Cambiar' : 'Subir logo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
        </label>
      </div>

      {logoUrl && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900">Mostrar mi logo en el QR de reseñas</p>
            <p className="text-gray-400 text-xs mt-0.5">Cuando imprimas o descargues tu QR de Google, aparecerá con tu logo incluido.</p>
          </div>
          <button
            type="button"
            onClick={handleToggleShowLogoOnQr}
            aria-pressed={showLogoOnQr}
            className={`w-12 h-7 rounded-full transition-all shrink-0 relative ${showLogoOnQr ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${showLogoOnQr ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      )}

      {/* ── Digital Menu ── */}
      {menuType === 'digital' ? (
        categories.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-gray-200 py-24 px-8 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-[#F26122]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Empieza tu carta digital</h3>
            <p className="text-gray-400 text-sm mb-8 max-w-xs">Crea categorías como "Entradas", "Platos de fondo" y añade tus platos con fotos y precios.</p>
            <button
              onClick={() => openCategoryModal()}
              className="px-8 py-3 bg-[#F26122] text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all"
            >
              Crear primera categoría
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Category Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{CATEGORY_TYPE_META[category.categoryType || 'food'].icon}</span>
                    <h2 className="font-black text-gray-900 text-base uppercase tracking-wider">{category.name}</h2>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-full">
                      {CATEGORY_TYPE_META[category.categoryType || 'food'].label}
                    </span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                      {category.dishes?.length || 0} {(category.dishes?.length || 0) === 1 ? 'plato' : 'platos'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(null, category.id)}
                      className="text-xs font-bold text-[#F26122] bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      + Agregar plato
                    </button>
                    <button
                      onClick={() => openCategoryModal(category)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                      title="Editar categoría"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                      title="Eliminar categoría"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                {/* Dishes */}
                {!category.dishes || category.dishes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <p className="text-gray-400 text-sm font-medium mb-3">Esta categoría está vacía</p>
                    <button
                      onClick={() => openModal(null, category.id)}
                      className="text-sm font-bold text-[#F26122] hover:underline"
                    >
                      + Añadir el primer plato
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-gray-100">
                    {category.dishes.map((item) => (
                      <div key={item.id} className="group bg-white hover:bg-gray-50 transition-colors relative">
                        <div className="aspect-[4/3] overflow-hidden relative">
                          <img
                            src={item.imageUrl || DEFAULT_DISH_IMG}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {item.videoUrl && (
                            <span className="absolute bottom-2 right-2 w-7 h-7 bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-white" title="Tiene video">
                              <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">{item.name}</h4>
                                {item.isVegetarian && <span title="Vegetariano" className="text-xs shrink-0">🌱</span>}
                              </div>
                              {item.description && (
                                <p className="text-gray-400 text-xs mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                              )}
                            </div>
                            <span className="text-sm font-black text-[#F26122] whitespace-nowrap shrink-0">
                              S/ {Number(item.price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {/* Hover actions */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openModal(item)}
                            className="w-7 h-7 bg-white/95 backdrop-blur rounded-lg flex items-center justify-center shadow-md hover:bg-blue-50 hover:text-blue-600 transition-all text-gray-600"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="w-7 h-7 bg-white/95 backdrop-blur rounded-lg flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-600 transition-all text-gray-600"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Photo Menu ── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#F26122]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-xl font-black text-gray-900">Carta en Imagen</h2>
            <p className="text-gray-400 text-sm mt-1">Sube una foto de tu carta física o usa una URL de imagen.</p>
          </div>

          <div className={`rounded-2xl border-2 border-dashed overflow-hidden relative ${menuPhoto ? 'border-gray-200' : 'border-gray-200'}`}>
            {menuPhoto ? (
              <div className="group relative">
                <img src={menuPhoto} className="w-full object-contain max-h-[500px]" alt="Carta" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => setMenuPhoto('')} className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-bold text-sm">
                    Cambiar imagen
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-gray-400 text-sm font-medium">Pega la URL de tu imagen</p>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full max-w-sm bg-gray-50 border border-gray-200 py-3 px-5 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 text-sm font-medium"
                  onChange={(e) => setMenuPhoto(e.target.value)}
                />
              </div>
            )}
          </div>

          <button
            onClick={saveMenuPhoto}
            disabled={isSavingPhoto || !menuPhoto}
            className="mt-6 w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSavingPhoto ? 'Guardando...' : 'Guardar carta'}
          </button>
        </div>
      )}

      {/* ── Modal: New/Edit Dish ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">{editingItem ? 'Editar plato' : 'Nuevo plato'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Nombre del plato *</label>
                <input
                  type="text" placeholder="Ej: Lomo Saltado" value={modalData.name}
                  onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Descripción</label>
                <textarea
                  placeholder="Ingredientes, presentación..." value={modalData.description}
                  onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Precio (S/.)</label>
                  <input
                    type="number" placeholder="0.00" value={modalData.price}
                    onChange={(e) => setModalData({ ...modalData, price: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Categoría</label>
                  <select
                    value={modalData.categoryId}
                    onChange={(e) => setModalData({ ...modalData, categoryId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">URL de imagen</label>
                <input
                  type="text" placeholder="https://..." value={modalData.imageUrl}
                  onChange={(e) => setModalData({ ...modalData, imageUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                />
                {modalData.imageUrl && (
                  <img src={modalData.imageUrl} alt="preview" className="mt-2 w-full h-28 object-cover rounded-xl border border-gray-100" onError={(e) => (e.currentTarget.style.display = 'none')} />
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Video del plato <span className="text-gray-300 normal-case font-normal">(opcional — preparación o resultado final)</span>
                </label>
                {modalData.videoUrl ? (
                  <div className="flex items-center gap-2">
                    <video src={modalData.videoUrl} className="w-20 h-14 object-cover rounded-lg border border-gray-100" muted />
                    <button type="button" onClick={() => setModalData({ ...modalData, videoUrl: '' })} className="text-xs font-bold text-red-500 hover:underline">Quitar</button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 text-xs font-bold text-gray-400 hover:border-orange-300 hover:text-[#F26122] cursor-pointer transition-colors">
                    {uploadingVideo ? 'Subiendo...' : '🎬 Subir video (MP4, máx. 16MB)'}
                    <input type="file" accept="video/mp4,video/3gpp" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
                  </label>
                )}
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalData.isVegetarian}
                  onChange={(e) => setModalData({ ...modalData, isVegetarian: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#F26122]"
                />
                <span className="text-sm font-bold text-gray-700">🌱 Es un plato vegetariano</span>
              </label>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-gray-200 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving || !modalData.name.trim()} className="flex-[2] bg-[#F26122] text-white py-3 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50">
                {isSaving ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Crear plato')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Category ── */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)} />
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</h3>
              <button onClick={() => setShowCategoryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Nombre</label>
              <input
                type="text"
                placeholder="Ej: Entradas, Bebidas, Postres..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                autoFocus
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 mt-4 block">Tipo</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(CATEGORY_TYPE_META) as [CategoryType, typeof CATEGORY_TYPE_META[CategoryType]][]).map(([type, meta]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCategoryType(type)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${categoryType === type ? 'border-[#F26122] bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <span className="text-lg">{meta.icon}</span>
                    <span className="text-[10px] font-black text-gray-600">{meta.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Define el color y el ícono con el que se destaca esta categoría en la carta.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button onClick={() => setShowCategoryModal(false)} className="flex-1 bg-white border border-gray-200 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveCategory} disabled={isSaving || !categoryName.trim()} className="flex-[2] bg-[#F26122] text-white py-3 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50">
                {isSaving ? 'Guardando...' : (editingCategory ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
