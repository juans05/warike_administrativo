'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowDownToLine, Boxes, ClipboardCheck, Pencil, Plus, Trash2, Truck } from 'lucide-react';
import { MERMA_REASONS, inventoryApi } from '../../../lib/api-client';
import { useRestaurant } from '../../../context/RestaurantContext';
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton, StatTile, Tabs } from '../../../components/ui';
import { ItemSheet, MovementSheet, RecipeSheet, SupplierSheet } from '../../../components/inventory/InventoryForms';

const soles = (c: number) => `S/ ${(c / 100).toFixed(2)}`;
const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  OPTIMO: { label: 'Óptimo', tone: 'success' }, ALERTA: { label: 'Bajo', tone: 'warning' }, AGOTADO: { label: 'Agotado', tone: 'danger' },
};
const MOVE_LABEL: Record<string, string> = { INGRESO: 'Ingreso / compra', VENTA: 'Venta en caja', COCINA: 'Descuento de cocina', MERMA: 'Merma', AJUSTE: 'Ajuste por conteo' };
const when = (iso: string) => new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function InventarioPage() {
  const { activePlaceId } = useRestaurant();
  const [tab, setTab] = useState('items');
  const [data, setData] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [kardex, setKardex] = useState<any[]>([]);
  const [kardexType, setKardexType] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState<any | 'new' | null>(null);
  const [moving, setMoving] = useState<{ kind: 'INGRESO' | 'AJUSTE' | 'MERMA'; item?: any } | null>(null);
  const [recipe, setRecipe] = useState<any>(null);
  const [supplier, setSupplier] = useState<any | 'new' | null>(null);

  const load = useCallback(() => {
    if (!activePlaceId) return;
    inventoryApi.overview(activePlaceId).then(setData).catch((err: Error) => { toast.error(err.message); setData((d: any) => d ?? { kpis: {}, items: [] }); });
    inventoryApi.recipes(activePlaceId).then(setRecipes).catch(() => setRecipes([]));
    inventoryApi.suppliers(activePlaceId).then(setSuppliers).catch(() => setSuppliers([]));
  }, [activePlaceId]);
  const loadKardex = useCallback(() => {
    if (activePlaceId) inventoryApi.kardex(activePlaceId, kardexType || undefined).then(setKardex).catch(() => setKardex([]));
  }, [activePlaceId, kardexType]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'kardex' || tab === 'mermas') loadKardex(); }, [tab, loadKardex]);
  const done = () => { setEditing(null); setMoving(null); setRecipe(null); setSupplier(null); load(); loadKardex(); };

  const items: any[] = data?.items ?? [];
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => (!statusFilter || i.status === statusFilter) && (!q || `${i.name} ${i.code} ${i.category ?? ''} ${i.supplierName ?? ''}`.toLowerCase().includes(q)));
  }, [items, query, statusFilter]);
  const mermas = kardex.filter((m) => m.type === 'MERMA');

  if (!data) return <div role="status" aria-label="Cargando" className="space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-64 rounded-card" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Inventario"
        subtitle="Insumos y productos, fichas técnicas de platos y descuento automático al cocinar o vender."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={ArrowDownToLine} disabled={!items.length} onClick={() => setMoving({ kind: 'INGRESO' })}>Ingreso</Button>
            <Button variant="secondary" icon={Trash2} disabled={!items.length} onClick={() => setMoving({ kind: 'MERMA' })}>Merma</Button>
            <Button icon={Plus} onClick={() => setEditing('new')}>Nuevo insumo</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total de insumos" value={data.kpis.total ?? 0} />
        <StatTile label="Valor del stock" value={soles(data.kpis.valuation ?? 0)} />
        <StatTile label="Stock bajo" value={data.kpis.alert ?? 0} />
        <StatTile label="Agotados" value={data.kpis.out ?? 0} />
      </div>

      <Tabs aria-label="Secciones de inventario" value={tab} onChange={setTab} tabs={[
        { key: 'items', label: `Inventario (${items.length})` },
        { key: 'recipes', label: 'Fichas técnicas' },
        { key: 'kardex', label: 'Kardex' },
        { key: 'mermas', label: 'Mermas' },
        { key: 'suppliers', label: `Proveedores (${suppliers.length})` },
      ]} />

      {tab === 'items' && (
        !items.length ? (
          <Card><EmptyState icon={Boxes} title="Registra tus insumos y productos" description="Con su unidad, costo y stock mínimo. Después arma las fichas técnicas para que el stock se descuente solo." action={<Button onClick={() => setEditing('new')}>Nuevo insumo</Button>} /></Card>
        ) : (
          <Card padding="sm" className="space-y-3">
            <div className="flex flex-wrap gap-2 p-2">
              <input type="search" aria-label="Buscar insumo" placeholder="Buscar por nombre, código o proveedor..." value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-11 flex-1 rounded-control border border-border bg-surface px-3 text-sm" />
              <select aria-label="Estado de stock" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-11 rounded-control border border-border bg-surface px-2 text-sm">
                <option value="">Todos los estados</option><option value="OPTIMO">Óptimo</option><option value="ALERTA">Bajo</option><option value="AGOTADO">Agotado</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-text-muted">
                  <tr>{['Código', 'Insumo / producto', 'Categoría', 'Stock', 'Mínimo', 'Costo unit.', 'Valor', 'Proveedor', 'Estado', ''].map((h) => <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shown.map((i) => (
                    <tr key={i.id} className={i.active ? '' : 'opacity-50'}>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{i.code}</td>
                      <td className="px-2 py-2 font-medium">{i.name}</td>
                      <td className="px-2 py-2 text-text-muted">{i.category ?? '—'}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-semibold tabular-nums">{i.stock} {i.unit}</td>
                      <td className="whitespace-nowrap px-2 py-2 tabular-nums text-text-muted">{i.minStock} {i.unit}</td>
                      <td className="whitespace-nowrap px-2 py-2 tabular-nums">{soles(i.unitCost)}</td>
                      <td className="whitespace-nowrap px-2 py-2 tabular-nums">{soles(Math.max(0, i.stock) * i.unitCost)}</td>
                      <td className="px-2 py-2 text-text-muted">{i.supplierName ?? '—'}</td>
                      <td className="px-2 py-2"><Badge tone={STATUS[i.status].tone}>{STATUS[i.status].label}</Badge></td>
                      <td className="whitespace-nowrap px-2 py-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" aria-label={`Ingreso de ${i.name}`} onClick={() => setMoving({ kind: 'INGRESO', item: i })}><ArrowDownToLine size={16} aria-hidden /></Button>
                          <Button variant="ghost" size="sm" aria-label={`Ajustar ${i.name}`} onClick={() => setMoving({ kind: 'AJUSTE', item: i })}><ClipboardCheck size={16} aria-hidden /></Button>
                          <Button variant="ghost" size="sm" aria-label={`Editar ${i.name}`} onClick={() => setEditing(i)}><Pencil size={16} aria-hidden /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {tab === 'recipes' && (
        <div className="space-y-3">
          <p className="text-sm text-text-muted">Define qué insumos lleva cada ítem de tu catálogo. Al empezar a prepararlo en cocina, o al venderlo en caja, se descuentan solos. Para un producto que se vende tal cual (una gaseosa), su ficha es 1 unidad de ese producto.</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recipes.map((r) => (
              <Card key={r.dishId} padding="md" className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-text">{r.name}</p>
                  {r.lines.length ? <Badge tone={r.foodCost > 35 ? 'warning' : 'success'}>Food cost {r.foodCost ?? 0}%</Badge> : <Badge>Sin ficha</Badge>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div><p className="text-text-muted">Costo</p><p className="font-semibold tabular-nums">{soles(r.cost)}</p></div>
                  <div><p className="text-text-muted">Precio</p><p className="font-semibold tabular-nums">{soles(r.price)}</p></div>
                  <div><p className="text-text-muted">Margen</p><p className="font-semibold tabular-nums">{soles(r.margin)}</p></div>
                </div>
                {r.lines.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {r.lines.map((l: any) => <li key={l.itemId} className="flex justify-between gap-2"><span>{l.name}</span><span className="tabular-nums text-text-muted">{l.quantity} {l.unit} · {soles(l.cost)}</span></li>)}
                  </ul>
                )}
                <Button variant="secondary" size="sm" icon={Pencil} disabled={!items.length} onClick={() => setRecipe(r)}>{r.lines.length ? 'Editar ficha' : 'Crear ficha técnica'}</Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'kardex' && (
        <Card padding="sm" className="space-y-3">
          <div className="p-2">
            <select aria-label="Tipo de movimiento" value={kardexType} onChange={(e) => setKardexType(e.target.value)} className="min-h-11 rounded-control border border-border bg-surface px-2 text-sm">
              <option value="">Todos los movimientos</option>
              {Object.entries(MOVE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <MovesTable moves={kardex} />
        </Card>
      )}

      {tab === 'mermas' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Pérdida valorizada" value={soles(mermas.reduce((s, m) => s + m.loss, 0))} />
            <StatTile label="Insumos dados de baja" value={mermas.filter((m) => !m.dishId).length} />
            <StatTile label="Platos de baja" value={new Set(mermas.filter((m) => m.dishId).map((m) => `${m.dishId}-${m.createdAt}`)).size} />
          </div>
          <Card padding="sm">
            {mermas.length === 0 ? <EmptyState icon={AlertTriangle} title="Sin mermas registradas" description="Registra lo que se quema, vence o se cae para saber cuánto pierdes." headingLevel="h3" /> : <MovesTable moves={mermas} merma />}
          </Card>
        </div>
      )}

      {tab === 'suppliers' && (
        <Card padding="sm" className="space-y-3">
          <div className="flex justify-end p-2"><Button icon={Truck} onClick={() => setSupplier('new')}>Nuevo proveedor</Button></div>
          {suppliers.length === 0 ? <EmptyState icon={Truck} title="Sin proveedores" description="Registra a quién le compras: razón social, RUC, contacto y WhatsApp." headingLevel="h3" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-text-muted"><tr>{['Razón social', 'RUC', 'Categoría', 'Contacto', 'Teléfono / WhatsApp', 'Correo', 'Insumos', ''].map((h) => <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td className="px-2 py-2 font-medium">{s.name}</td>
                      <td className="px-2 py-2 font-mono text-xs">{s.ruc ?? '—'}</td>
                      <td className="px-2 py-2">{s.category ?? '—'}</td>
                      <td className="px-2 py-2">{s.contactName ?? '—'}</td>
                      <td className="px-2 py-2">{s.phone ? <a className="text-primary-hover underline" href={`https://wa.me/${s.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{s.phone}</a> : '—'}</td>
                      <td className="px-2 py-2">{s.email ?? '—'}</td>
                      <td className="px-2 py-2 tabular-nums">{s.itemsCount}</td>
                      <td className="px-2 py-2"><Button variant="ghost" size="sm" aria-label={`Editar ${s.name}`} onClick={() => setSupplier(s)}><Pencil size={16} aria-hidden /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {editing && activePlaceId && <ItemSheet placeId={activePlaceId} item={editing === 'new' ? null : editing} suppliers={suppliers} onClose={() => setEditing(null)} onDone={done} />}
      {moving && activePlaceId && <MovementSheet placeId={activePlaceId} kind={moving.kind} item={moving.item} items={items.filter((i) => i.active)} dishes={recipes.filter((r) => r.lines.length)} onClose={() => setMoving(null)} onDone={done} />}
      {recipe && activePlaceId && <RecipeSheet placeId={activePlaceId} recipe={recipe} items={items.filter((i) => i.active)} onClose={() => setRecipe(null)} onDone={done} />}
      {supplier && activePlaceId && <SupplierSheet placeId={activePlaceId} supplier={supplier === 'new' ? null : supplier} onClose={() => setSupplier(null)} onDone={done} />}
    </div>
  );
}

function MovesTable({ moves, merma }: { moves: any[]; merma?: boolean }) {
  if (!moves.length) return <p className="p-3 text-sm text-text-muted">Todavía no hay movimientos.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-text-muted">
          <tr>{(merma ? ['Fecha', 'Tipo', 'Elemento', 'Cantidad', 'Motivo', 'Pérdida', 'Observación'] : ['Fecha', 'Movimiento', 'Insumo', 'Cantidad', 'Stock antes', 'Stock después', 'Motivo']).map((h) => <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {moves.map((m) => (
            <tr key={m.id}>
              <td className="whitespace-nowrap px-2 py-2 tabular-nums">{when(m.createdAt)}</td>
              <td className="whitespace-nowrap px-2 py-2">{merma ? (m.dishId ? 'Plato terminado' : 'Insumo crudo') : MOVE_LABEL[m.type]}</td>
              <td className="px-2 py-2">{merma && m.dishName ? `${m.dishName} → ${m.itemName}` : m.itemName}</td>
              <td className={`whitespace-nowrap px-2 py-2 font-semibold tabular-nums ${m.quantity < 0 ? 'text-danger' : 'text-success'}`}>{m.quantity > 0 ? '+' : ''}{m.quantity} {m.unit}</td>
              {merma ? (
                <>
                  <td className="px-2 py-2">{MERMA_REASONS[m.mermaReason] ?? '—'}</td>
                  <td className="whitespace-nowrap px-2 py-2 tabular-nums">{soles(m.loss)}</td>
                  <td className="px-2 py-2 text-text-muted">{m.reason ?? '—'}</td>
                </>
              ) : (
                <>
                  <td className="whitespace-nowrap px-2 py-2 tabular-nums">{m.stockBefore} {m.unit}</td>
                  <td className="whitespace-nowrap px-2 py-2 tabular-nums">{m.stockAfter} {m.unit}</td>
                  <td className="px-2 py-2 text-text-muted">{m.reason ?? '—'}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
