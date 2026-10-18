import React from 'react';
import { Clock, Film, Leaf, Package, Pencil, Plus, Sparkles, Trash2, UtensilsCrossed } from 'lucide-react';
import { Badge, Button, Card, DataList, EmptyState } from '../ui';
import { CATEGORY_TYPE_META, itemNoun, type CatalogCtx, type MenuCategory, type MenuItem } from './types';

interface Props {
  category: MenuCategory;
  catalog: CatalogCtx;
  onAddItem(categoryId: string): void;
  onEditItem(item: MenuItem): void;
  onDeleteItem(itemId: string): void;
  onEditCategory(category: MenuCategory): void;
  onDeleteCategory(categoryId: string): void;
}

const dangerGhost = 'text-danger hover:bg-danger/10 hover:text-danger';

function ItemThumb({ item, catalog }: { item: MenuItem; catalog: CatalogCtx }) {
  if (item.imageUrl) {
    return <img src={item.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-control border border-border object-cover" />;
  }
  const Icon = item.kind === 'servicio' ? Sparkles : catalog.isFood ? UtensilsCrossed : Package;
  return (
    <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
      <Icon size={24} />
    </span>
  );
}

export function CategorySection({ category, catalog, onAddItem, onEditItem, onDeleteItem, onEditCategory, onDeleteCategory }: Props) {
  const { labels, catalogKind, isFood } = catalog;
  const noun = labels.catalogItem.toLowerCase();
  const items = category.dishes ?? [];
  const meta = CATEGORY_TYPE_META[category.categoryType || 'food'];
  const TypeIcon = isFood ? meta.icon : CATEGORY_TYPE_META.other.icon;

  return (
    <Card padding="sm" className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <TypeIcon size={20} aria-hidden className="shrink-0 text-primary" />
          <h2 className="min-w-0 truncate text-base font-semibold text-text">{category.name}</h2>
          <Badge>{items.length} {itemNoun(catalog, items.length)}</Badge>
          {isFood && <Badge>{meta.label}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => onAddItem(category.id)}>
            Agregar {noun}
          </Button>
          <Button variant="ghost" size="sm" icon={Pencil} aria-label={`Editar categoría ${category.name}`} onClick={() => onEditCategory(category)} />
          <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Eliminar categoría ${category.name}`} className={dangerGhost} onClick={() => onDeleteCategory(category.id)} />
        </div>
      </div>

      <DataList
        items={items}
        empty={
          <EmptyState
            icon={Plus}
            headingLevel="h3"
            title="Esta categoría está vacía"
            action={<Button variant="secondary" icon={Plus} onClick={() => onAddItem(category.id)}>Añadir el primer {noun}</Button>}
          />
        }
        renderItem={(item) => (
          <div className="flex items-center gap-1 pr-2">
            <button
              type="button"
              onClick={() => onEditItem(item)}
              aria-label={`Editar ${item.name}`}
              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors duration-200 motion-reduce:transition-none hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
            >
              <ItemThumb item={item} catalog={catalog} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-text">{item.name}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold tabular-nums text-text sm:hidden">S/ {Number(item.price).toFixed(2)}</span>
                  {catalogKind === 'mixto' && (
                    <Badge tone={item.kind === 'servicio' ? 'primary' : 'neutral'}>{item.kind === 'servicio' ? 'Servicio' : 'Producto'}</Badge>
                  )}
                  {item.kind === 'servicio' && item.durationMin != null && (
                    <Badge><Clock size={12} aria-hidden />{item.durationMin} min</Badge>
                  )}
                  {isFood && item.isVegetarian && <Badge tone="success"><Leaf size={12} aria-hidden />Vegetariano</Badge>}
                  {item.videoUrl && <Badge><Film size={12} aria-hidden />Video</Badge>}
                </span>
                {item.description && <span className="mt-1 line-clamp-2 block text-sm text-text-muted">{item.description}</span>}
              </span>
              <span className="hidden shrink-0 text-sm font-semibold tabular-nums text-text sm:block">S/ {Number(item.price).toFixed(2)}</span>
            </button>
            <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Eliminar ${item.name}`} className={dangerGhost} onClick={() => onDeleteItem(item.id)} />
          </div>
        )}
      />
    </Card>
  );
}
