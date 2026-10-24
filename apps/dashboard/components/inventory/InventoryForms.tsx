'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { MERMA_REASONS, inventoryApi } from '../../lib/api-client';
import { Button, Input, Select, Sheet } from '../ui';

export const UNITS = ['unidad', 'kg', 'g', 'lt', 'ml', 'paquete', 'caja', 'saco', 'botella'];
const cents = (v: string) => Math.round((parseFloat(v.replace(',', '.')) || 0) * 100);
const soles = (c: number) => (c / 100).toFixed(2);
const num = (v: string) => parseFloat(v.replace(',', '.')) || 0;

/** Crear o editar un insumo o producto (el stock inicial solo al crear; después cambia por movimientos). */
export function ItemSheet({ placeId, item, suppliers, onClose, onDone }: { placeId: string; item: any | null; suppliers: any[]; onClose(): void; onDone(): void }) {
  const [f, setF] = useState({
    name: item?.name ?? '', code: item?.code ?? '', category: item?.category ?? '', unit: item?.unit ?? 'unidad',
    stock: '', minStock: String(item?.minStock ?? ''), unitCost: item ? soles(item.unitCost) : '', supplierId: item?.supplierId ?? '', active: item?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await inventoryApi.saveItem(placeId, item?.id ?? null, {
        name: f.name, code: f.code || undefined, category: f.category || null, unit: f.unit, minStock: num(f.minStock), unitCost: cents(f.unitCost),
        supplierId: f.supplierId || null, active: f.active, ...(item ? {} : { stock: num(f.stock) }),
      });
      toast.success('Guardado'); onDone();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <Sheet open onClose={onClose} title={item ? `Editar ${item.name}` : 'Nuevo insumo o producto'}>
      <div className="space-y-4 p-4">
        <Input label="Nombre" value={f.name} maxLength={150} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Código (opcional)" placeholder="INS-001" value={f.code} maxLength={20} onChange={(e) => setF({ ...f, code: e.target.value })} />
          <Input label="Categoría" placeholder="Carnes, Bebidas..." value={f.category} maxLength={80} onChange={(e) => setF({ ...f, category: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Unidad" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</Select>
          <Input label={`Costo por ${f.unit} (S/)`} type="number" min={0} step="0.01" inputMode="decimal" value={f.unitCost} onChange={(e) => setF({ ...f, unitCost: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {!item && <Input label="Stock inicial" type="number" min={0} step="0.001" inputMode="decimal" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />}
          <Input label="Stock mínimo (alerta)" type="number" min={0} step="0.001" inputMode="decimal" value={f.minStock} onChange={(e) => setF({ ...f, minStock: e.target.value })} />
        </div>
        <Select label="Proveedor" value={f.supplierId} onChange={(e) => setF({ ...f, supplierId: e.target.value })}>
          <option value="">Sin proveedor</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        {item && (
          <label className="flex min-h-11 items-center gap-3 text-sm text-text">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Activo
          </label>
        )}
        <Button className="w-full" loading={saving} disabled={!f.name.trim()} onClick={save}>Guardar</Button>
      </div>
    </Sheet>
  );
}

/** Ingreso (compra), ajuste por conteo o merma de un insumo. */
export function MovementSheet({ placeId, kind, item, items, dishes, onClose, onDone }: {
  placeId: string; kind: 'INGRESO' | 'AJUSTE' | 'MERMA'; item?: any; items: any[]; dishes: any[]; onClose(): void; onDone(): void;
}) {
  const [target, setTarget] = useState<'item' | 'dish'>('item');
  const [itemId, setItemId] = useState(item?.id ?? items[0]?.id ?? '');
  const [dishId, setDishId] = useState(dishes[0]?.dishId ?? '');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [mermaReason, setMermaReason] = useState('QUEMADO');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const sel = items.find((i) => i.id === itemId);
  const title = kind === 'INGRESO' ? 'Ingreso / compra' : kind === 'AJUSTE' ? 'Ajuste por conteo' : 'Registrar merma';

  const save = async () => {
    setSaving(true);
    try {
      if (kind === 'INGRESO') await inventoryApi.ingreso(placeId, { itemId, quantity: num(qty), unitCost: cost ? cents(cost) : undefined, reason: reason || undefined });
      else if (kind === 'AJUSTE') await inventoryApi.ajuste(placeId, { itemId, counted: num(qty), reason: reason || undefined });
      else await inventoryApi.merma(placeId, { ...(target === 'item' ? { itemId } : { dishId }), quantity: num(qty), mermaReason, reason: reason || undefined });
      toast.success('Registrado en el kardex'); onDone();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Sheet open onClose={onClose} title={title}>
      <div className="space-y-4 p-4">
        {kind === 'MERMA' && (
          <div className="grid grid-cols-2 gap-2">
            {(['item', 'dish'] as const).map((t) => (
              <button key={t} type="button" aria-pressed={target === t} onClick={() => setTarget(t)}
                className={`min-h-11 rounded-control border text-sm font-medium ${target === t ? 'border-primary bg-primary-soft text-primary-hover' : 'border-border'}`}>
                {t === 'item' ? 'Insumo crudo' : 'Plato terminado'}
              </button>
            ))}
          </div>
        )}
        {kind === 'MERMA' && target === 'dish' ? (
          <Select label="Plato (descuenta su receta)" value={dishId} onChange={(e) => setDishId(e.target.value)}>
            {dishes.map((d) => <option key={d.dishId} value={d.dishId}>{d.name}</option>)}
          </Select>
        ) : (
          <Select label="Insumo o producto" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name} · stock {i.stock} {i.unit}</option>)}
          </Select>
        )}
        <Input
          label={kind === 'AJUSTE' ? `Cantidad contada (${sel?.unit ?? ''})` : kind === 'MERMA' && target === 'dish' ? 'Cantidad de platos' : `Cantidad (${sel?.unit ?? ''})`}
          type="number" min={0} step="0.001" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)}
        />
        {kind === 'INGRESO' && <Input label={`Costo por ${sel?.unit ?? 'unidad'} (S/, opcional)`} type="number" min={0} step="0.01" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />}
        {kind === 'MERMA' && (
          <Select label="Motivo" value={mermaReason} onChange={(e) => setMermaReason(e.target.value)}>
            {Object.entries(MERMA_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        )}
        <Input label="Observación (opcional)" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
        <Button className="w-full" loading={saving} disabled={!qty || (kind !== 'AJUSTE' && num(qty) <= 0)} onClick={save}>Registrar</Button>
      </div>
    </Sheet>
  );
}

/** Ficha técnica: qué insumos y cuánto lleva cada plato (o 1 x el producto si se revende tal cual). */
export function RecipeSheet({ placeId, recipe, items, onClose, onDone }: { placeId: string; recipe: any; items: any[]; onClose(): void; onDone(): void }) {
  const [lines, setLines] = useState<{ itemId: string; quantity: string }[]>(recipe.lines.map((l: any) => ({ itemId: l.itemId, quantity: String(l.quantity) })));
  const [saving, setSaving] = useState(false);
  const cost = lines.reduce((s, l) => s + num(l.quantity) * (items.find((i) => i.id === l.itemId)?.unitCost ?? 0), 0);
  const save = async () => {
    setSaving(true);
    try { await inventoryApi.setRecipe(placeId, recipe.dishId, lines.filter((l) => l.itemId && num(l.quantity) > 0).map((l) => ({ itemId: l.itemId, quantity: num(l.quantity) }))); toast.success('Ficha técnica guardada'); onDone(); }
    catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <Sheet open onClose={onClose} title={`Ficha técnica · ${recipe.name}`}>
      <div className="space-y-4 p-4">
        <p className="text-sm text-text-muted">Insumos por 1 porción. Al preparar en cocina o vender en caja se descuentan solos.</p>
        {lines.map((l, i) => {
          const it = items.find((x) => x.id === l.itemId);
          return (
            <div key={i} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
              <Select label={i === 0 ? 'Insumo' : ''} aria-label="Insumo" value={l.itemId} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, itemId: e.target.value } : x)))}>
                <option value="">Elige...</option>
                {items.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.unit})</option>)}
              </Select>
              <Input label={i === 0 ? 'Cantidad' : ''} aria-label={`Cantidad en ${it?.unit ?? ''}`} type="number" min={0} step="0.001" inputMode="decimal" value={l.quantity} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} />
              <Button variant="secondary" aria-label="Quitar insumo" onClick={() => setLines(lines.filter((_, j) => j !== i))}><Trash2 size={16} aria-hidden /></Button>
            </div>
          );
        })}
        <Button variant="secondary" icon={Plus} onClick={() => setLines([...lines, { itemId: '', quantity: '' }])}>Agregar insumo</Button>
        <div className="grid grid-cols-3 gap-2 rounded-control bg-background p-3 text-center text-sm">
          <div><p className="text-text-muted">Costo</p><p className="font-semibold tabular-nums">S/ {soles(Math.round(cost))}</p></div>
          <div><p className="text-text-muted">Precio</p><p className="font-semibold tabular-nums">S/ {soles(recipe.price)}</p></div>
          <div><p className="text-text-muted">Food cost</p><p className="font-semibold tabular-nums">{recipe.price ? Math.round((cost / recipe.price) * 100) : 0}%</p></div>
        </div>
        <Button className="w-full" loading={saving} onClick={save}>Guardar ficha</Button>
      </div>
    </Sheet>
  );
}

/** Proveedor: razón social, RUC, contacto, teléfono/WhatsApp y correo. */
export function SupplierSheet({ placeId, supplier, onClose, onDone }: { placeId: string; supplier: any | null; onClose(): void; onDone(): void }) {
  const [f, setF] = useState({ name: supplier?.name ?? '', ruc: supplier?.ruc ?? '', category: supplier?.category ?? '', contactName: supplier?.contactName ?? '', phone: supplier?.phone ?? '', email: supplier?.email ?? '', notes: supplier?.notes ?? '' });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await inventoryApi.saveSupplier(placeId, supplier?.id ?? null, Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || (k === 'name' ? v : null)])));
      toast.success('Proveedor guardado'); onDone();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <Sheet open onClose={onClose} title={supplier ? `Editar ${supplier.name}` : 'Nuevo proveedor'}>
      <div className="space-y-4 p-4">
        <Input label="Razón social / nombre comercial" value={f.name} maxLength={150} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="RUC" inputMode="numeric" maxLength={11} value={f.ruc} onChange={(e) => setF({ ...f, ruc: e.target.value.replace(/\D/g, '') })} />
          <Input label="Categoría" value={f.category} maxLength={80} onChange={(e) => setF({ ...f, category: e.target.value })} />
        </div>
        <Input label="Contacto / vendedor" value={f.contactName} maxLength={120} onChange={(e) => setF({ ...f, contactName: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Teléfono / WhatsApp" type="tel" value={f.phone} maxLength={30} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input label="Correo para pedidos" type="email" value={f.email} maxLength={150} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </div>
        <Input label="Notas" value={f.notes} maxLength={300} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        <Button className="w-full" loading={saving} disabled={!f.name.trim()} onClick={save}>Guardar</Button>
      </div>
    </Sheet>
  );
}
