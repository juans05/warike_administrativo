'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { businessApi } from '../../lib/api-client';
import { Button, Input, Modal, cn } from '../ui';
import { CATEGORY_TYPE_META, type CategoryType, type MenuCategory } from './types';

interface Props {
  open: boolean;
  onClose(): void;
  placeId: string;
  /** null = categoría nueva. */
  category: MenuCategory | null;
  /** Cantidad actual: la categoría nueva va al final. */
  categoryCount: number;
  /** El tipo (platos, bebidas, postres) solo tiene sentido en gastronomía. */
  isFood: boolean;
  onSaved(): void;
}

export function CategoryModal({ open, onClose, placeId, category, categoryCount, isFood, onSaved }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('food');
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? '');
    setType(category?.categoryType ?? 'food');
    nameRef.current?.focus();
  }, [open, category]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (category) {
        await businessApi.updateCategory(placeId, category.id, { name, displayOrder: category.displayOrder, categoryType: type });
      } else {
        await businessApi.createCategory(placeId, { name, displayOrder: categoryCount, categoryType: type });
      }
      toast.success(category ? 'Categoría actualizada' : 'Categoría creada');
      onSaved();
    } catch {
      toast.error('Error al guardar la categoría');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'Editar categoría' : 'Nueva categoría'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={isSaving} disabled={!name.trim()}>
            {category ? 'Actualizar' : 'Crear'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          ref={nameRef}
          label="Nombre"
          placeholder={isFood ? 'Ej: Entradas, Bebidas, Postres...' : 'Ej: Cortes, Tintes, Tratamientos...'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />

        {isFood && (
          <div role="radiogroup" aria-labelledby="category-type-label">
            <p id="category-type-label" className="mb-1.5 text-sm font-medium text-text">Tipo</p>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(CATEGORY_TYPE_META) as [CategoryType, (typeof CATEGORY_TYPE_META)[CategoryType]][]).map(([key, meta]) => {
                const Icon = meta.icon;
                const selected = type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setType(key)}
                    className={cn(
                      'flex min-h-11 flex-col items-center gap-1 rounded-control border py-2 text-xs font-medium transition-colors duration-200 motion-reduce:transition-none',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                      selected ? 'border-primary bg-primary-soft text-primary-hover' : 'border-border text-text hover:bg-background',
                    )}
                  >
                    <Icon size={20} aria-hidden />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-text-muted">Define el color y el ícono con el que se destaca esta categoría en la carta.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
