'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, UserRound, X } from 'lucide-react';
import { agendaApi, type DayHours, type Professional } from '../../lib/api-client';
import { WEEK, shortDate } from '../../lib/agenda';
import { Badge, Button, Input, Sheet, Switch } from '../ui';

type Form = { name: string; station: string; photoUrl: string; serviceIds: string[]; ownSchedule: boolean; schedule: DayHours[]; daysOff: string[]; active: boolean };
const DEFAULT_DAY = { open: '10:00', close: '19:00' };
const toForm = (p?: Professional): Form => ({
  name: p?.name ?? '', station: p?.station ?? '', photoUrl: p?.photoUrl ?? '', serviceIds: p?.serviceIds ?? [],
  ownSchedule: !!p?.schedule?.length, schedule: p?.schedule ?? [], daysOff: p?.daysOff ?? [], active: p?.active ?? true,
});

/** Equipo de atención: cada persona con su silla o puesto, los servicios que hace, su horario y días libres. */
export function ProfessionalsSheet({ placeId, professionals, services, onClose, onChanged }: { placeId: string; professionals: Professional[]; services: any[]; onClose(): void; onChanged(): void }) {
  const [editing, setEditing] = useState<Professional | 'new' | null>(professionals.length ? null : 'new');
  const [form, setForm] = useState<Form>(toForm());
  const [dayOff, setDayOff] = useState('');
  const [saving, setSaving] = useState(false);

  const open = (p: Professional | 'new') => { setEditing(p); setForm(toForm(p === 'new' ? undefined : p)); };
  const dayOf = (key: string) => form.schedule.find((d) => d.day === key);
  const setDay = (key: string, patch: Partial<DayHours> | null) => setForm((f) => ({
    ...f,
    schedule: patch === null ? f.schedule.filter((d) => d.day !== key)
      : f.schedule.some((d) => d.day === key) ? f.schedule.map((d) => (d.day === key ? { ...d, ...patch } : d))
      : [...f.schedule, { day: key, ...DEFAULT_DAY, ...patch }],
  }));
  const toggleService = (id: string) => setForm((f) => ({ ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((s) => s !== id) : [...f.serviceIds, id] }));

  const save = async () => {
    setSaving(true);
    try {
      await agendaApi.saveProfessional(placeId, editing === 'new' ? null : (editing as Professional).id, {
        name: form.name, station: form.station || null, photoUrl: form.photoUrl || null, serviceIds: form.serviceIds,
        schedule: form.ownSchedule ? form.schedule : null, daysOff: form.daysOff, active: form.active,
      });
      toast.success('Profesional guardado');
      setEditing(null); onChanged();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Sheet open onClose={onClose} title={editing ? (editing === 'new' ? 'Nuevo profesional' : `Editar ${form.name}`) : 'Profesionales'}>
      <div className="space-y-5 p-4">
        {!editing && (
          <>
            <p className="text-sm text-text-muted">Quienes atienden. Cada uno tiene su silla o puesto, sus servicios y su horario.</p>
            <ul className="space-y-2">
              {professionals.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-control border border-border p-3">
                  <Avatar name={p.name} photo={p.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text">{p.name} {!p.active && <Badge>Inactivo</Badge>}</p>
                    <p className="text-xs text-text-muted">{p.station || 'Sin silla'} · {p.serviceIds.length ? `${p.serviceIds.length} servicios` : 'Todos los servicios'} · {p.schedule?.length ? 'Horario propio' : 'Horario del local'}</p>
                  </div>
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={() => open(p)}>Editar</Button>
                </li>
              ))}
            </ul>
            <Button className="w-full" icon={Plus} onClick={() => open('new')}>Agregar profesional</Button>
          </>
        )}

        {editing && (
          <>
            <Input label="Nombre" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Silla o puesto (opcional)" placeholder="Ej. Silla 2, Cabina A" value={form.station} maxLength={40} onChange={(e) => setForm({ ...form, station: e.target.value })} />
            <Input label="Foto (enlace, opcional)" placeholder="https://..." value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-text">Servicios que hace</legend>
              <p className="text-xs text-text-muted">{form.serviceIds.length ? 'Solo los marcados.' : 'Sin marcar = hace todos los servicios.'}</p>
              {services.length === 0 && <p className="text-sm text-text-muted">Aún no tienes servicios. Agrégalos en Servicios con su duración.</p>}
              {services.map((s) => (
                <label key={s.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text">
                  <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                  {s.name} <span className="text-text-muted">· {s.durationMin} min</span>
                </label>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-text">Horario</legend>
              <Switch label="Tiene horario propio (si no, usa el horario del local)" checked={form.ownSchedule} onChange={(v) => setForm({ ...form, ownSchedule: v, schedule: v && !form.schedule.length ? WEEK.slice(0, 6).map((d) => ({ day: d.key, ...DEFAULT_DAY })) : form.schedule })} />
              {form.ownSchedule && (
                <ul className="space-y-2">
                  {WEEK.map((d) => {
                    const h = dayOf(d.key);
                    return (
                      <li key={d.key} className="flex flex-wrap items-center gap-2">
                        <label className="flex w-28 cursor-pointer items-center gap-2 text-sm text-text">
                          <input type="checkbox" className="h-4 w-4 accent-primary" checked={!!h} onChange={(e) => setDay(d.key, e.target.checked ? {} : null)} />
                          {d.label}
                        </label>
                        {h ? (
                          <>
                            <input type="time" aria-label={`${d.label} entrada`} value={h.open} onChange={(e) => setDay(d.key, { open: e.target.value })} className="min-h-11 rounded-control border border-border bg-surface px-2 text-sm" />
                            <span className="text-sm text-text-muted">a</span>
                            <input type="time" aria-label={`${d.label} salida`} value={h.close} onChange={(e) => setDay(d.key, { close: e.target.value })} className="min-h-11 rounded-control border border-border bg-surface px-2 text-sm" />
                          </>
                        ) : <span className="text-sm text-text-muted">No trabaja</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-text">Días libres o vacaciones</legend>
              <div className="flex gap-2">
                <input type="date" aria-label="Día libre" value={dayOff} onChange={(e) => setDayOff(e.target.value)} className="min-h-11 flex-1 rounded-control border border-border bg-surface px-2 text-sm" />
                <Button variant="secondary" disabled={!dayOff} onClick={() => { setForm((f) => ({ ...f, daysOff: Array.from(new Set([...f.daysOff, dayOff])).sort() })); setDayOff(''); }}>Agregar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.daysOff.map((d) => (
                  <button key={d} type="button" onClick={() => setForm((f) => ({ ...f, daysOff: f.daysOff.filter((x) => x !== d) }))} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-3 text-sm" aria-label={`Quitar ${d}`}>
                    {shortDate(d)} <X size={14} aria-hidden />
                  </button>
                ))}
              </div>
            </fieldset>

            <Switch label="Activo (recibe citas)" checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
            <div className="flex gap-2">
              {professionals.length > 0 && <Button variant="secondary" onClick={() => setEditing(null)}>Volver</Button>}
              <Button className="flex-1" loading={saving} disabled={!form.name.trim()} onClick={save}>Guardar</Button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

export function Avatar({ name, photo, size = 40 }: { name: string; photo?: string | null; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (photo) return <img src={photo} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-hover" style={{ width: size, height: size }} aria-hidden>
      {name ? name.trim()[0].toUpperCase() : <UserRound size={18} />}
    </span>
  );
}
