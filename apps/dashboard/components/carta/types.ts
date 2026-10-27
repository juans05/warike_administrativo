import { CakeSlice, CupSoda, Tag, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { VerticalConfig } from '../../lib/modules';

export type CategoryType = 'food' | 'drink' | 'dessert' | 'other';
export type ItemKind = 'producto' | 'servicio';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
  isVegetarian?: boolean;
  kind?: ItemKind;
  durationMin?: number | null;
  /** Servicio de rutina: cada cuántos días vuelve el cliente y cuántos días antes se le avisa. */
  recallDays?: number | null;
  recallNoticeDays?: number | null;
  categoryId: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  categoryType?: CategoryType;
  dishes: MenuItem[];
}

/** Lo que cambia por rubro en toda la pantalla del catálogo. */
export interface CatalogCtx {
  labels: VerticalConfig['labels'];
  catalogKind: VerticalConfig['catalogKind'];
  /** Solo gastronomía: vegetariano, tipos de categoría (platos/bebidas/postres) y plantillas de carta. */
  isFood: boolean;
}

export const CATEGORY_TYPE_META: Record<CategoryType, { label: string; icon: LucideIcon }> = {
  food: { label: 'Platos', icon: UtensilsCrossed },
  drink: { label: 'Bebidas', icon: CupSoda },
  dessert: { label: 'Postres', icon: CakeSlice },
  other: { label: 'Otro', icon: Tag },
};

/** "plato" / "platos", "servicio" / "servicios". El catálogo mixto ("Producto o servicio") usa "ítem(s)". */
export function itemNoun(catalog: CatalogCtx, count = 2): string {
  if (catalog.catalogKind === 'mixto') return count === 1 ? 'ítem' : 'ítems';
  const word = catalog.labels.catalogItem.toLowerCase();
  return count === 1 ? word : `${word}s`;
}
