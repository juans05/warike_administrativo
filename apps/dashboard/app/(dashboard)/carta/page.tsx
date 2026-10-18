'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { Button, Card, PageHeader, Skeleton, Tabs } from '../../../components/ui';
import MenuBuilder from '../../../components/MenuBuilder';
import MenuDesign from '../../../components/MenuDesign';
import { CategoryModal } from '../../../components/carta/CategoryModal';
import { CategorySection } from '../../../components/carta/CategorySection';
import { ItemSheet } from '../../../components/carta/ItemSheet';
import { LogoCard } from '../../../components/carta/LogoCard';
import { PhotoMenuCard } from '../../../components/carta/PhotoMenuCard';
import { ShareCard } from '../../../components/carta/ShareCard';
import { itemNoun, type CatalogCtx, type MenuCategory, type MenuItem } from '../../../components/carta/types';

const FALLBACK_LABELS = { catalog: 'Carta', catalogItem: 'Plato', customer: 'Cliente' };

export default function CartaPage() {
  const { activePlaceId, activePlace, isLoading: placesLoading } = useRestaurant();
  const config = activePlace?.verticalConfig;
  const catalog: CatalogCtx = {
    labels: config?.labels ?? FALLBACK_LABELS,
    catalogKind: config?.catalogKind ?? 'producto',
    // Un local sin rubro conocido es gastronomía (como en el backend).
    isFood: !activePlace?.vertical || activePlace.vertical === 'gastronomia',
  };
  const noun = catalog.labels.catalogItem.toLowerCase();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheet, setSheet] = useState<{ open: boolean; item: MenuItem | null; categoryId: string }>({ open: false, item: null, categoryId: '' });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category: MenuCategory | null }>({ open: false, category: null });

  const [menuType, setMenuType] = useState<'digital' | 'photo'>('digital');
  const [menuPhoto, setMenuPhoto] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const [logoUrl, setLogoUrl] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [showLogoOnQr, setShowLogoOnQr] = useState(true);

  const totalItems = categories.reduce((acc, c) => acc + (c.dishes?.length || 0), 0);

  const publicMenuLink = typeof window !== 'undefined' && activePlaceId
    ? `${window.location.origin}/menu/${activePlaceId}`
    : '';

  // `silent`: recarga tras guardar o borrar, sin tapar la pantalla con el esqueleto ni cambiar de modo.
  const loadMenu = async ({ silent = false } = {}) => {
    if (!activePlaceId) { setIsLoading(false); return; }
    if (!silent) setIsLoading(true);
    try {
      const data = await businessApi.getMenu(activePlaceId);
      setCategories(Array.isArray(data) ? data : []);
      const profile = await businessApi.getProfile(activePlaceId);
      if (profile.menuImageUrl) {
        setMenuPhoto(profile.menuImageUrl);
        if (!silent) setMenuType('photo');
      }
      setLogoUrl(profile.logoUrl || '');
      setPlaceName(profile.name || '');
      setShowLogoOnQr(profile.showLogoOnQr ?? true);
    } catch (err) {
      console.error('Error loading menu:', err);
      toast.error('No se pudo cargar la información');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMenuPhoto = async () => {
    if (!activePlaceId) return;
    setIsSavingPhoto(true);
    try {
      await businessApi.updateProfile(activePlaceId, { menuImageUrl: menuPhoto });
      toast.success('Imagen guardada.');
    } catch {
      toast.error('Error al guardar la imagen');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  useEffect(() => { loadMenu(); }, [activePlaceId]);

  const openItem = (item: MenuItem | null = null, categoryId: string = '') =>
    setSheet({ open: true, item, categoryId: item?.categoryId ?? (categoryId || categories[0]?.id || '') });
  const closeItem = () => setSheet((s) => ({ ...s, open: false }));
  const openCategory = (category: MenuCategory | null = null) => setCategoryModal({ open: true, category });
  const closeCategory = () => setCategoryModal((m) => ({ ...m, open: false }));

  const handleDeleteCategory = async (categoryId: string) => {
    if (!activePlaceId || !confirm(`¿Eliminar esta categoría y todos sus ${itemNoun(catalog)}?`)) return;
    try {
      await businessApi.deleteCategory(activePlaceId, categoryId);
      toast.success('Categoría eliminada');
      loadMenu({ silent: true });
    } catch {
      toast.error('Error al eliminar la categoría');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activePlaceId || !confirm(`¿Eliminar este ${noun}?`)) return;
    try {
      await businessApi.deleteMenuItem(activePlaceId, itemId);
      toast.success(`${catalog.labels.catalogItem} eliminado`);
      loadMenu({ silent: true });
    } catch {
      toast.error('Error al eliminar');
    }
  };

  if (isLoading || placesLoading) {
    return (
      <div role="status" aria-label="Cargando" className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="w-56" />
        </div>
        {[0, 1].map((n) => (
          <Card key={n} padding="sm" className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Skeleton className="w-40" />
              <Skeleton className="h-9 w-32" />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-14 w-14 shrink-0" />
                <div className="flex-1 space-y-2"><Skeleton className="w-1/3" /><Skeleton className="h-3 w-2/3" /></div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    );
  }

  const isDigital = menuType === 'digital';

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={catalog.labels.catalog}
        subtitle={`${categories.length} ${categories.length === 1 ? 'categoría' : 'categorías'} · ${totalItems} ${itemNoun(catalog, totalItems)}`}
        action={isDigital && categories.length > 0 ? (
          <Button icon={Plus} onClick={() => openItem()}>Nuevo {noun}</Button>
        ) : undefined}
      />

      <ShareCard link={publicMenuLink} catalog={catalog} photoMode={!isDigital} />

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Tabs
            aria-label="Formato"
            value={menuType}
            onChange={(key) => setMenuType(key as 'digital' | 'photo')}
            tabs={[{ key: 'digital', label: 'Digital' }, { key: 'photo', label: 'Foto' }]}
          />
        </div>
        {isDigital && categories.length > 0 && (
          <Button variant="secondary" icon={Plus} className="mb-1 shrink-0" onClick={() => openCategory()}>Nueva categoría</Button>
        )}
      </div>

      {isDigital ? (
        categories.length === 0 ? (
          activePlaceId && (
            <MenuBuilder placeId={activePlaceId} catalog={catalog} onSaved={() => loadMenu({ silent: true })} onManual={() => openCategory()} />
          )
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                catalog={catalog}
                onAddItem={(categoryId) => openItem(null, categoryId)}
                onEditItem={(item) => openItem(item)}
                onDeleteItem={handleDeleteItem}
                onEditCategory={openCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            ))}
          </div>
        )
      ) : (
        <PhotoMenuCard photo={menuPhoto} onPhotoChange={setMenuPhoto} onSave={saveMenuPhoto} saving={isSavingPhoto} catalog={catalog} />
      )}

      {activePlaceId && (
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-text">Página pública</h2>
            <p className="text-sm text-text-muted">Logo, colores y textos que se ven al abrir tu enlace.</p>
          </div>
          <LogoCard
            placeId={activePlaceId}
            logoUrl={logoUrl}
            onLogoChange={setLogoUrl}
            showLogoOnQr={showLogoOnQr}
            onShowLogoOnQrChange={setShowLogoOnQr}
          />
          <MenuDesign placeId={activePlaceId} logoUrl={logoUrl} placeName={placeName} catalog={catalog} />
        </section>
      )}

      {activePlaceId && (
        <ItemSheet
          open={sheet.open}
          onClose={closeItem}
          placeId={activePlaceId}
          item={sheet.item}
          defaultCategoryId={sheet.categoryId}
          categories={categories}
          catalog={catalog}
          onSaved={() => { closeItem(); loadMenu({ silent: true }); }}
        />
      )}

      {activePlaceId && (
        <CategoryModal
          open={categoryModal.open}
          onClose={closeCategory}
          placeId={activePlaceId}
          category={categoryModal.category}
          categoryCount={categories.length}
          isFood={catalog.isFood}
          onSaved={() => { closeCategory(); loadMenu({ silent: true }); }}
        />
      )}
    </div>
  );
}
