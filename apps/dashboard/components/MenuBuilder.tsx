'use client';

import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';
import { MENU_TEMPLATES, type DraftCategory, type ImportCategoryType } from '../lib/menuTemplates';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TYPE_LABELS: Record<ImportCategoryType, string> = { food: 'Platos', drink: 'Bebidas', dessert: 'Postres', other: 'Otro' };

const INPUT = 'bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300';

interface Props {
  placeId: string;
  onSaved: () => void;
  onManual: () => void;
}

// "¿Cómo quieres armar tu carta?": foto/PDF con IA, plantilla por tipo de cocina o a mano.
// Todo lo importado pasa por una vista previa editable antes de guardarse.
export default function MenuBuilder({ placeId, onSaved, onManual }: Props) {
  const [draft, setDraft] = useState<DraftCategory[] | null>(null);
  const [reading, setReading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      toast.error(err?.message || 'No se pudo leer la carta');
    } finally {
      setReading(false);
    }
  };

  const pickTemplate = (id: string) => {
    const t = MENU_TEMPLATES.find((x) => x.id === id);
    if (t) setDraft(JSON.parse(JSON.stringify(t.categories)));
  };

  if (draft) {
    return <DraftReview placeId={placeId} draft={draft} setDraft={setDraft} onSaved={onSaved} onCancel={() => setDraft(null)} />;
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-12 px-6 sm:px-10">
      <div className="text-center mb-8">
        <h3 className="text-xl font-black text-gray-900">¿Cómo quieres armar tu carta?</h3>
        <p className="text-gray-400 text-sm mt-1">Elige la forma más rápida. Siempre podrás editar todo después.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={reading}
          className="text-left rounded-2xl border-2 border-[#F26122] bg-orange-50/50 p-6 hover:bg-orange-50 transition-colors disabled:opacity-60"
        >
          <span className="text-3xl">📷</span>
          <p className="mt-3 font-black text-gray-900">{reading ? 'Leyendo tu carta…' : 'Foto o PDF con IA'}</p>
          <p className="text-xs text-gray-500 mt-1">Sube la foto o el PDF de tu carta actual. La IA lee categorías, platos y precios y tú los revisas antes de guardar.</p>
          <span className="inline-block mt-3 text-[10px] font-black uppercase tracking-widest text-[#F26122]">Recomendado</span>
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={handleFile} />

        <button
          onClick={() => setShowTemplates((v) => !v)}
          className={`text-left rounded-2xl border-2 p-6 transition-colors ${showTemplates ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <span className="text-3xl">🍽️</span>
          <p className="mt-3 font-black text-gray-900">Partir de una plantilla</p>
          <p className="text-xs text-gray-500 mt-1">Cartas base por tipo de cocina (cevichería, pollería, chifa…). Cambias nombres y precios a los tuyos.</p>
        </button>

        <button onClick={onManual} className="text-left rounded-2xl border-2 border-gray-200 p-6 hover:border-gray-300 transition-colors">
          <span className="text-3xl">✍️</span>
          <p className="mt-3 font-black text-gray-900">Armarla a mano</p>
          <p className="text-xs text-gray-500 mt-1">Crea tus categorías y agrega cada plato con foto, video y precio.</p>
        </button>
      </div>

      {showTemplates && (
        <div className="max-w-4xl mx-auto mt-6 flex flex-wrap gap-2 justify-center">
          {MENU_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => pickTemplate(t.id)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-[#F26122] hover:text-[#F26122] transition-colors"
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DraftReview({
  placeId, draft, setDraft, onSaved, onCancel,
}: {
  placeId: string;
  draft: DraftCategory[];
  setDraft: (d: DraftCategory[]) => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const total = draft.reduce((n, c) => n + c.dishes.length, 0);

  const patchCat = (ci: number, patch: Partial<DraftCategory>) =>
    setDraft(draft.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
  const patchDish = (ci: number, di: number, patch: Record<string, unknown>) =>
    setDraft(draft.map((c, i) => (i === ci ? { ...c, dishes: c.dishes.map((d, j) => (j === di ? { ...d, ...patch } : d)) } : c)));

  const save = async () => {
    setSaving(true);
    try {
      const res = await businessApi.importMenu(placeId, draft);
      toast.success(`Carta guardada: ${res.dishes} platos`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar la carta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-black text-gray-900">Revisa tu carta antes de guardar</h3>
          <p className="text-xs text-gray-400 mt-0.5">{draft.length} categorías · {total} platos. Corrige lo que haga falta: los precios de plantilla son de ejemplo.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={save} disabled={saving || total === 0} className="px-5 py-2.5 rounded-xl bg-[#F26122] text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-50">
            {saving ? 'Guardando…' : `Guardar ${total} platos`}
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {draft.map((cat, ci) => (
          <div key={ci} className="p-4 sm:p-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input value={cat.name} onChange={(e) => patchCat(ci, { name: e.target.value })} className={`${INPUT} font-black flex-1 min-w-[160px]`} aria-label="Nombre de la categoría" />
              <select value={cat.categoryType} onChange={(e) => patchCat(ci, { categoryType: e.target.value as ImportCategoryType })} className={INPUT}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button onClick={() => setDraft(draft.filter((_, i) => i !== ci))} className="text-xs font-bold text-red-500 hover:underline">Quitar categoría</button>
            </div>

            {cat.dishes.map((dish, di) => (
              <div key={di} className="flex flex-wrap items-center gap-2 pl-2 sm:pl-6">
                <input value={dish.name} onChange={(e) => patchDish(ci, di, { name: e.target.value })} placeholder="Plato" className={`${INPUT} flex-1 min-w-[140px]`} />
                <input value={dish.description ?? ''} onChange={(e) => patchDish(ci, di, { description: e.target.value })} placeholder="Descripción (opcional)" className={`${INPUT} flex-[2] min-w-[160px]`} />
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-gray-400">S/</span>
                  <input
                    type="number" min={0} step="0.5" value={dish.price ?? ''}
                    onChange={(e) => patchDish(ci, di, { price: e.target.value === '' ? null : Number(e.target.value) })}
                    className={`${INPUT} w-20`} aria-label="Precio"
                  />
                </div>
                <button
                  onClick={() => patchCat(ci, { dishes: cat.dishes.filter((_, j) => j !== di) })}
                  aria-label="Quitar plato" className="w-7 h-7 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500"
                >×</button>
              </div>
            ))}

            <button
              onClick={() => patchCat(ci, { dishes: [...cat.dishes, { name: '', price: null }] })}
              className="ml-2 sm:ml-6 text-xs font-bold text-[#F26122] hover:underline"
            >+ Agregar plato</button>
          </div>
        ))}
      </div>
    </div>
  );
}
