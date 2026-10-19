'use client';

import React, { useRef, useState } from 'react';
import { Camera, LayoutTemplate, Loader2, PencilLine, Plus, Trash2, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';
import { MENU_TEMPLATES, type DraftCategory, type ImportCategoryType } from '../lib/menuTemplates';
import { Badge, Button, Card, cn, controlStyles } from './ui';
import { itemNoun, type CatalogCtx } from './carta/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TYPE_LABELS: Record<ImportCategoryType, string> = { food: 'Platos', drink: 'Bebidas', dessert: 'Postres', other: 'Otro' };

interface Props {
  placeId: string;
  catalog: CatalogCtx;
  onSaved: () => void;
  onManual: () => void;
}

function Option({ icon: Icon, title, description, onClick, disabled, selected, highlight, tag, spinning }: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
  highlight?: boolean;
  tag?: string;
  spinning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-start rounded-card border p-5 text-left transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60',
        highlight ? 'border-primary bg-primary-soft' : selected ? 'border-text bg-background' : 'border-border bg-surface hover:bg-background',
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon size={20} aria-hidden className={spinning ? 'animate-spin motion-reduce:animate-none' : undefined} />
      </span>
      <span className="mt-3 text-base font-semibold text-text">{title}</span>
      <span className="mt-1 text-sm text-text-muted">{description}</span>
      {tag && <span className="mt-3"><Badge tone="primary">{tag}</Badge></span>}
    </button>
  );
}

// Primera vez: foto/PDF con IA, plantilla por tipo de cocina (solo gastronomía) o a mano.
// Todo lo importado pasa por una vista previa editable antes de guardarse.
export default function MenuBuilder({ placeId, catalog, onSaved, onManual }: Props) {
  const [draft, setDraft] = useState<DraftCategory[] | null>(null);
  const [reading, setReading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { isFood, catalogKind } = catalog;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setReading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      const up = await fetch(`${API}/api/upload/document`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!up.ok) throw new Error('No se pudo subir el archivo (foto o PDF, máx. 10MB)');
      const { url } = await up.json();
      const res = await businessApi.parseMenuFile(placeId, url);
      setDraft(res.categories);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo leer el archivo');
    } finally {
      setReading(false);
    }
  };

  const pickTemplate = (id: string) => {
    const t = MENU_TEMPLATES.find((x) => x.id === id);
    if (t) setDraft(JSON.parse(JSON.stringify(t.categories)));
  };

  if (draft) {
    return <DraftReview placeId={placeId} catalog={catalog} draft={draft} setDraft={setDraft} onSaved={onSaved} onCancel={() => setDraft(null)} />;
  }

  return (
    <Card padding="lg" className="border-dashed">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-text">¿Cómo quieres empezar?</h2>
        <p className="mt-1 text-sm text-text-muted">
          Elige la forma más rápida de cargar tus {itemNoun(catalog)}. Siempre podrás editar todo después.
        </p>
      </div>

      <div className={cn('mx-auto grid max-w-4xl gap-4', isFood ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        <Option
          icon={reading ? Loader2 : Camera}
          spinning={reading}
          title={reading ? 'Leyendo tu archivo…' : 'Foto o PDF con IA'}
          description={`Sube la foto o el PDF de tu lista actual. La IA lee categorías, ${itemNoun(catalog)} y precios y tú los revisas antes de guardar.`}
          onClick={() => fileRef.current?.click()}
          disabled={reading}
          highlight
          tag="Recomendado"
        />
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={handleFile} />

        {isFood && (
          <Option
            icon={LayoutTemplate}
            title="Partir de una plantilla"
            description="Cartas base por tipo de cocina (cevichería, pollería, chifa…). Cambias nombres y precios a los tuyos."
            onClick={() => setShowTemplates((v) => !v)}
            selected={showTemplates}
          />
        )}

        <Option
          icon={PencilLine}
          title="Crear a mano"
          description={`Crea tus categorías y agrega cada ${catalog.labels.catalogItem.toLowerCase()} con ${catalogKind === 'producto' ? 'foto, video y precio' : 'foto, precio y duración'}.`}
          onClick={onManual}
        />
      </div>

      {isFood && showTemplates && (
        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
          {MENU_TEMPLATES.map((t) => (
            <Button key={t.id} variant="secondary" onClick={() => pickTemplate(t.id)}>{t.label}</Button>
          ))}
        </div>
      )}
    </Card>
  );
}

function DraftReview({
  placeId, catalog, draft, setDraft, onSaved, onCancel,
}: {
  placeId: string;
  catalog: CatalogCtx;
  draft: DraftCategory[];
  setDraft: (d: DraftCategory[]) => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const total = draft.reduce((n, c) => n + c.dishes.length, 0);
  const noun = catalog.labels.catalogItem.toLowerCase();

  const patchCat = (ci: number, patch: Partial<DraftCategory>) =>
    setDraft(draft.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
  const patchDish = (ci: number, di: number, patch: Record<string, unknown>) =>
    setDraft(draft.map((c, i) => (i === ci ? { ...c, dishes: c.dishes.map((d, j) => (j === di ? { ...d, ...patch } : d)) } : c)));

  const save = async () => {
    setSaving(true);
    try {
      const res = await businessApi.importMenu(placeId, draft);
      toast.success(`Guardado: ${res.dishes} ${itemNoun(catalog, res.dishes)}`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const field = controlStyles(undefined, 'h-11');

  return (
    <Card padding="sm" className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-text">Revisa antes de guardar</h2>
          <p className="mt-0.5 text-sm text-text-muted">
            {draft.length} categorías · {total} {itemNoun(catalog, total)}. Corrige lo que haga falta: los precios de plantilla son de ejemplo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button onClick={save} loading={saving} disabled={total === 0}>
            Guardar {total} {itemNoun(catalog, total)}
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {draft.map((cat, ci) => (
          <div key={ci} className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <input value={cat.name} onChange={(e) => patchCat(ci, { name: e.target.value })} className={`${field} min-w-[160px] flex-1 font-semibold`} aria-label="Nombre de la categoría" />
              {catalog.isFood && (
                <select value={cat.categoryType} onChange={(e) => patchCat(ci, { categoryType: e.target.value as ImportCategoryType })} className={controlStyles(undefined, 'h-11 w-auto')} aria-label="Tipo de categoría">
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
              <Button variant="ghost" size="sm" icon={Trash2} className="text-danger hover:bg-danger/10 hover:text-danger" onClick={() => setDraft(draft.filter((_, i) => i !== ci))}>
                Quitar categoría
              </Button>
            </div>

            {cat.dishes.map((dish, di) => (
              <div key={di} className="flex flex-wrap items-center gap-2 sm:pl-6">
                <input value={dish.name} onChange={(e) => patchDish(ci, di, { name: e.target.value })} placeholder={catalog.labels.catalogItem} aria-label={`Nombre del ${noun}`} className={`${field} min-w-[140px] flex-1`} />
                <input value={dish.description ?? ''} onChange={(e) => patchDish(ci, di, { description: e.target.value })} placeholder="Descripción (opcional)" aria-label="Descripción" className={`${field} min-w-[160px] flex-[2]`} />
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-text-muted">S/</span>
                  <input
                    type="number" min={0} step="0.5" value={dish.price ?? ''}
                    onChange={(e) => patchDish(ci, di, { price: e.target.value === '' ? null : Number(e.target.value) })}
                    className={`${field} w-24 tabular-nums`} aria-label="Precio"
                  />
                </div>
                <Button
                  variant="ghost" size="sm" icon={Trash2} aria-label={`Quitar ${noun}`}
                  className="text-danger hover:bg-danger/10 hover:text-danger"
                  onClick={() => patchCat(ci, { dishes: cat.dishes.filter((_, j) => j !== di) })}
                />
              </div>
            ))}

            <div className="sm:pl-6">
              <Button variant="ghost" size="sm" icon={Plus} onClick={() => patchCat(ci, { dishes: [...cat.dishes, { name: '', price: null }] })}>
                Agregar {noun}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
