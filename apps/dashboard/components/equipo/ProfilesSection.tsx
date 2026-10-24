'use client';

import React, { useState } from 'react';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { teamApi, type TeamProfile } from '../../lib/api-client';
import { NAV, navLabel, type VerticalConfig } from '../../lib/modules';
import { Badge, Button, Card, DataList, Input, Select, Sheet } from '../ui';

// Mismas claves que TEAM_MODULES del backend (team-modules.ts).
const TEAM_MODULES = ['carta', 'agenda', 'pedidos', 'cocina', 'mesas', 'inventario', 'caja', 'social', 'whatsapp', 'chat', 'plazbot', 'ia', 'broadcasts', 'clientes', 'fidelizacion', 'email-marketing', 'reputacion', 'reportes'];
const WHATSAPP_CHILDREN = ['chat', 'plazbot', 'ia', 'broadcasts'];

export const BASE_ROLE_LABELS: Record<TeamProfile['baseRole'], string> = {
  cocina: 'Cocina (solo ve y actualiza pedidos)',
  mozo: 'Mozo (mesas y cobro en mesa)',
  agente: 'Agente (atiende, cobra en caja, agenda)',
  supervisor: 'Supervisor (además configura)',
};

// Plantillas para empezar rápido; solo se ofrecen las secciones que el rubro tiene.
const TEMPLATES: { name: string; baseRole: TeamProfile['baseRole']; modules: string[] }[] = [
  { name: 'Cajero', baseRole: 'agente', modules: ['caja', 'pedidos', 'mesas'] },
  { name: 'Mozo', baseRole: 'mozo', modules: ['mesas', 'pedidos'] },
  { name: 'Cocina', baseRole: 'cocina', modules: ['cocina'] },
  { name: 'Recepción', baseRole: 'agente', modules: ['agenda', 'clientes', 'caja', 'whatsapp', 'chat'] },
  { name: 'Profesional', baseRole: 'agente', modules: ['agenda'] },
  { name: 'Atención WhatsApp', baseRole: 'agente', modules: ['whatsapp', 'chat', 'clientes'] },
  { name: 'Marketing', baseRole: 'agente', modules: ['social', 'whatsapp', 'broadcasts', 'email-marketing', 'clientes', 'fidelizacion', 'reputacion'] },
  { name: 'Supervisor', baseRole: 'supervisor', modules: TEAM_MODULES },
];

/** Secciones que este rubro tiene, con el nombre que usa el menú. */
export function moduleOptions(config: VerticalConfig | undefined) {
  const leaves = NAV.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]));
  return TEAM_MODULES
    .filter((m) => !config || config.modules.includes(m as never))
    .map((m) => ({ key: m, label: navLabel(leaves.find((l) => l.module === m)?.label ?? m, config) }));
}

export function ProfilesSection({ placeId, config, profiles, onChanged }: {
  placeId: string;
  config: VerticalConfig | undefined;
  profiles: TeamProfile[];
  onChanged(): void;
}) {
  const [editing, setEditing] = useState<TeamProfile | 'new' | null>(null);
  const options = moduleOptions(config);
  const labelOf = (m: string) => options.find((o) => o.key === m)?.label ?? m;

  const remove = async (p: TeamProfile) => {
    if (!confirm(`¿Borrar el perfil ${p.name}?`)) return;
    try { await teamApi.deleteProfile(placeId, p.id); toast.success('Perfil borrado'); onChanged(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-3 px-2 py-2">
        <div>
          <h2 className="text-base font-semibold text-text">Perfiles</h2>
          <p className="text-sm text-text-muted">Qué secciones ve cada persona. El dueño y los Admin ven todo.</p>
        </div>
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => setEditing('new')}>Nuevo perfil</Button>
      </div>
      <DataList
        items={profiles}
        empty={<p className="px-2 py-4 text-sm text-text-muted">Aún no hay perfiles. Crea uno desde una plantilla (Cajero, Mozo, Recepción…).</p>}
        renderItem={(p) => (
          <div className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text">{p.name}</p>
              <p className="text-sm text-text-muted">{p.modules.filter((m) => options.some((o) => o.key === m)).map(labelOf).join(' · ')}</p>
            </div>
            <Badge>{p.baseRole}</Badge>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(p)} aria-label={`Editar perfil ${p.name}`}>Editar</Button>
              <Button size="sm" variant="ghost" icon={Trash2} className="text-danger hover:bg-danger/10 hover:text-danger" onClick={() => remove(p)} aria-label={`Borrar perfil ${p.name}`}>Borrar</Button>
            </div>
          </div>
        )}
      />
      {editing && (
        <ProfileSheet placeId={placeId} profile={editing === 'new' ? null : editing} options={options}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />
      )}
    </Card>
  );
}

function ProfileSheet({ placeId, profile, options, onClose, onSaved }: {
  placeId: string;
  profile: TeamProfile | null;
  options: { key: string; label: string }[];
  onClose(): void;
  onSaved(): void;
}) {
  const [name, setName] = useState(profile?.name ?? '');
  const [baseRole, setBaseRole] = useState<TeamProfile['baseRole']>(profile?.baseRole ?? 'agente');
  const [modules, setModules] = useState<string[]>(profile?.modules ?? []);
  const [saving, setSaving] = useState(false);
  const allowed = options.map((o) => o.key);
  const toggle = (m: string) => setModules((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));

  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    setName(t.name);
    setBaseRole(t.baseRole);
    setModules(t.modules.filter((m) => allowed.includes(m)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Chats, bot, base de IA y campañas cuelgan de WhatsApp en el menú: sin él no se verían.
    const final = modules.some((m) => WHATSAPP_CHILDREN.includes(m)) && !modules.includes('whatsapp') ? [...modules, 'whatsapp'] : modules;
    setSaving(true);
    try {
      const body = { name, baseRole, modules: final };
      await (profile ? teamApi.updateProfile(placeId, profile.id, body) : teamApi.createProfile(placeId, body));
      toast.success('Perfil guardado');
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={profile ? `Editar ${profile.name}` : 'Nuevo perfil'}>
      <form onSubmit={submit} className="space-y-4 p-4">
        {!profile && (
          <div>
            <p className="mb-2 text-sm font-medium text-text">Empezar desde una plantilla</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.filter((t) => t.modules.some((m) => allowed.includes(m))).map((t) => (
                <Button key={t.name} type="button" size="sm" variant="secondary" onClick={() => applyTemplate(t)}>{t.name}</Button>
              ))}
            </div>
          </div>
        )}
        <Input label="Nombre del perfil" required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        <Select label="Nivel" value={baseRole} onChange={(e) => setBaseRole(e.target.value as TeamProfile['baseRole'])}
          hint="Define qué acciones puede hacer dentro de sus secciones.">
          {(Object.keys(BASE_ROLE_LABELS) as TeamProfile['baseRole'][]).map((r) => <option key={r} value={r}>{BASE_ROLE_LABELS[r]}</option>)}
        </Select>
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-text">Secciones que ve</legend>
          {options.map((o) => (
            <label key={o.key} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={modules.includes(o.key)} onChange={() => toggle(o.key)} />
              {o.label}
            </label>
          ))}
        </fieldset>
        <Button type="submit" icon={KeyRound} loading={saving} disabled={!modules.length} className="w-full">Guardar perfil</Button>
      </form>
    </Sheet>
  );
}
