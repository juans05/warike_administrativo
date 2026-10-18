'use client';

import React, { useState } from 'react';
import { Film, ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../../lib/api-client';
import { Button, Input, Select, Sheet, Switch, Textarea } from '../ui';
import { uploadFile } from './upload';
import type { CatalogCtx, ItemKind, MenuCategory, MenuItem } from './types';

const NAME_EXAMPLE: Record<CatalogCtx['catalogKind'], string> = {
  producto: 'Ej: Lomo saltado',
  servicio: 'Ej: Corte clásico',
  mixto: 'Ej: Baño y corte',
};

const dropzone =
  'cursor-pointer items-center justify-center rounded-control border border-dashed border-border text-text-muted transition-colors duration-200 motion-reduce:transition-none hover:border-primary hover:text-primary focus-within:ring-2 focus-within:ring-primary/40';

interface Props {
  open: boolean;
  onClose(): void;
  placeId: string;
  /** null = ítem nuevo. */
  item: MenuItem | null;
  defaultCategoryId: string;
  categories: MenuCategory[];
  catalog: CatalogCtx;
  onSaved(): void;
}

// Edición de un ítem en un panel lateral. El formulario se monta al abrir, así cada apertura parte limpia.
export function ItemSheet({ open, onClose, item, ...rest }: Props) {
  const noun = rest.catalog.labels.catalogItem.toLowerCase();
  return (
    <Sheet open={open} onClose={onClose} title={item ? `Editar ${noun}` : `Nuevo ${noun}`}>
      {open && <ItemForm item={item} onClose={onClose} {...rest} />}
    </Sheet>
  );
}

function ItemForm({ placeId, item, defaultCategoryId, categories, catalog, onSaved, onClose }: Omit<Props, 'open'>) {
  const { labels, catalogKind, isFood } = catalog;
  const noun = labels.catalogItem.toLowerCase();

  const [form, setForm] = useState(() => ({
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item ? String(item.price) : '',
    images: item?.images?.length ? item.images : item?.imageUrl ? [item.imageUrl] : [],
    videoUrl: item?.videoUrl ?? '',
    isVegetarian: item?.isVegetarian ?? false,
    categoryId: item?.categoryId ?? defaultCategoryId,
    // Solo el catálogo mixto deja elegir; en los demás el tipo lo fija el rubro.
    kind: (catalogKind === 'mixto' ? (item?.kind ?? 'producto') : catalogKind) as ItemKind,
    durationMin: item?.durationMin != null ? String(item.durationMin) : '',
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const patch = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const isService = form.kind === 'servicio';
  const minutes = form.durationMin.trim() === '' ? null : Number(form.durationMin);
  const durationError =
    isService && minutes !== null && (!Number.isInteger(minutes) || minutes < 0)
      ? 'Escribe los minutos como un número entero, 0 o más'
      : undefined;

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const urls = await Promise.all(files.map((file) => uploadFile('image', file)));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch {
      toast.error('No se pudieron subir las fotos');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingVideo(true);
    try {
      patch({ videoUrl: await uploadFile('video', file) });
      toast.success('Video subido');
    } catch {
      toast.error('No se pudo subir el video (máx. 16MB, formato MP4)');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || durationError) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        images: form.images,
        videoUrl: form.videoUrl,
        isVegetarian: form.isVegetarian,
        categoryId: form.categoryId,
        kind: form.kind,
        durationMin: isService ? minutes : null,
      };
      if (item) {
        await businessApi.updateMenuItem(placeId, item.id, payload);
      } else {
        await businessApi.createMenuItem(placeId, payload);
      }
      toast.success(`${labels.catalogItem} ${item ? 'actualizado' : 'creado'}`);
      onSaved();
    } catch {
      toast.error(`Error al guardar el ${noun}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      noValidate
      onSubmit={(e) => { e.preventDefault(); handleSave(); }}
      className="flex min-h-full flex-col"
    >
      <div className="flex-1 space-y-4 p-4">
        <Input
          label={`Nombre del ${noun}`}
          placeholder={NAME_EXAMPLE[catalogKind]}
          value={form.name}
          onChange={(e) => patch({ name: e.target.value })}
        />

        {catalogKind === 'mixto' && (
          <Select label="Tipo" value={form.kind} onChange={(e) => patch({ kind: e.target.value as ItemKind })}>
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
          </Select>
        )}

        <Textarea
          label="Descripción"
          rows={3}
          placeholder={isFood ? 'Ingredientes, presentación...' : 'Qué incluye, para quién es...'}
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Precio (S/)"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="0.00"
            value={form.price}
            onChange={(e) => patch({ price: e.target.value })}
          />
          <Select label="Categoría" value={form.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>

        {isService && (
          <Input
            label="Duración (min)"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="Ej: 30"
            hint="Sirve para agendar y para que tu bot le diga al cliente cuánto dura."
            error={durationError}
            value={form.durationMin}
            onChange={(e) => patch({ durationMin: e.target.value })}
          />
        )}

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-text">
            Fotos <span className="font-normal text-text-muted">(la primera es la portada)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {form.images.map((url, i) => (
              <div key={url + i} className="relative h-20 w-20">
                <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full rounded-control border border-border object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-primary px-1.5 text-xs font-medium text-white">Portada</span>
                )}
                <button
                  type="button"
                  aria-label={`Quitar foto ${i + 1}`}
                  onClick={() => patch({ images: form.images.filter((_, j) => j !== i) })}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white after:absolute after:-inset-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
            ))}
            <label className={`flex h-20 w-20 flex-col gap-1 text-center text-xs font-medium ${dropzone}`}>
              {uploadingImages ? <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <ImagePlus size={20} aria-hidden />}
              {uploadingImages ? 'Subiendo…' : 'Agregar'}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={handleImagesUpload} disabled={uploadingImages} />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-text">
            Video <span className="font-normal text-text-muted">(opcional)</span>
          </legend>
          {form.videoUrl ? (
            <div className="flex items-center gap-3">
              <video src={form.videoUrl} muted preload="metadata" aria-hidden className="h-14 w-20 rounded-control border border-border object-cover" />
              <Button variant="ghost" size="sm" icon={X} onClick={() => patch({ videoUrl: '' })}>Quitar video</Button>
            </div>
          ) : (
            <label className={`flex h-11 gap-2 text-sm font-medium ${dropzone}`}>
              {uploadingVideo ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Film size={16} aria-hidden />}
              {uploadingVideo ? 'Subiendo…' : 'Subir video (MP4, máx. 16 MB)'}
              <input type="file" accept="video/mp4,video/3gpp" className="sr-only" onChange={handleVideoUpload} disabled={uploadingVideo} />
            </label>
          )}
        </fieldset>

        {isFood && <Switch label="Es vegetariano" checked={form.isVegetarian} onChange={(v) => patch({ isVegetarian: v })} />}
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-border bg-surface p-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button type="submit" className="flex-[2]" loading={isSaving} disabled={!form.name.trim() || !!durationError}>
          {item ? 'Guardar cambios' : `Crear ${noun}`}
        </Button>
      </div>
    </form>
  );
}
