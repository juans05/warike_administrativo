'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { platformAccessApi, type PlatformProfile } from '../../../../lib/api-client';
import { Badge, Button, Card, Input, Modal, PageHeader, Skeleton } from '../../../../components/ui';

type Catalog = { key: string; group: string; label: string }[];

/** Perfiles de permisos del equipo de Wuarikes: plantillas de fábrica y personalizados. */
export default function PerfilesPage() {
  const [profiles, setProfiles] = useState<PlatformProfile[] | null>(null);
  const [catalog, setCatalog] = useState<Catalog>([]);
  const [editing, setEditing] = useState<PlatformProfile | 'new' | null>(null);

  const load = useCallback(() => {
    Promise.all([platformAccessApi.profiles(), platformAccessApi.catalog()])
      .then(([p, c]) => { setProfiles(p); setCatalog(c); })
      .catch((e: Error) => toast.error(e.message));
  }, []);
  useEffect(load, [load]);

  const remove = async (p: PlatformProfile) => {
    if (!confirm(`¿Borrar el perfil ${p.name}?`)) return;
    try { await platformAccessApi.deleteProfile(p.id); toast.success('Perfil borrado'); load(); } catch (e: any) { toast.error(e.message); }
  };
  const labelOf = (key: string) => catalog.find((c) => c.key === key)?.label ?? key;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfiles y permisos"
        subtitle="Define qué puede ver y hacer cada perfil. Luego asígnalo a las personas en Equipo Wuarikes."
        action={<Button icon={Plus} onClick={() => setEditing('new')}>Nuevo perfil</Button>}
      />
      {!profiles ? <Skeleton className="h-40" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((p) => {
            const locked = p.isSystem && p.permissions.includes('*');
            return (
              <Card key={p.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-text">
                      {p.name}{p.isSystem && <Badge>De fábrica</Badge>}
                    </h2>
                    {p.description && <p className="text-sm text-text-muted">{p.description}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-text-muted">{p.usersCount} usuario{p.usersCount === 1 ? '' : 's'}</span>
                </div>
                <ul className="flex-1 space-y-1 text-sm text-text">
                  {p.permissions.includes('*') ? <li>Acceso total a la plataforma</li> : p.permissions.map((k) => <li key={k}>· {labelOf(k)}</li>)}
                </ul>
                <div className="flex gap-2">
                  {locked ? (
                    <span className="inline-flex items-center gap-1 text-xs text-text-muted"><Lock size={14} aria-hidden /> No se puede editar</span>
                  ) : (
                    <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(p)}>Editar</Button>
                  )}
                  {!p.isSystem && <Button size="sm" variant="ghost" icon={Trash2} className="text-danger" onClick={() => remove(p)}>Borrar</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {editing && (
        <ProfileModal profile={editing === 'new' ? null : editing} catalog={catalog}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function ProfileModal({ profile, catalog, onClose, onSaved }: { profile: PlatformProfile | null; catalog: Catalog; onClose(): void; onSaved(): void }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [description, setDescription] = useState(profile?.description ?? '');
  const [selected, setSelected] = useState<string[]>(profile?.permissions ?? []);
  const [saving, setSaving] = useState(false);
  const groups = catalog.map((c) => c.group).filter((g, i, all) => all.indexOf(g) === i);
  const toggle = (key: string) => setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name, description: description || null, permissions: selected };
      await (profile ? platformAccessApi.updateProfile(profile.id, body) : platformAccessApi.createProfile(body));
      toast.success('Perfil guardado');
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={profile ? `Editar ${profile.name}` : 'Nuevo perfil'} footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" form="profile-form" icon={KeyRound} loading={saving} disabled={!selected.length}>Guardar perfil</Button>
      </>
    }>
      <form id="profile-form" onSubmit={submit} className="space-y-4">
        <Input label="Nombre" required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Descripción" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} />
        {groups.map((g) => (
          <fieldset key={g}>
            <legend className="mb-1 text-sm font-semibold text-text">{g}</legend>
            {catalog.filter((c) => c.group === g).map((c) => (
              <label key={c.key} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text">
                <input type="checkbox" className="h-4 w-4 accent-primary" checked={selected.includes(c.key)} onChange={() => toggle(c.key)} />
                {c.label}
              </label>
            ))}
          </fieldset>
        ))}
      </form>
    </Modal>
  );
}
