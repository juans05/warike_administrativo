'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Ban, Check, Mail, UserCog, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, platformAccessApi, type PlatformProfile, type PlatformStaff } from '../../../../lib/api-client';
import { can, usePlatformPermissions } from '../../../../lib/platform';
import { Badge, Button, EmptyState, Input, Modal, PageHeader, Select } from '../../../../components/ui';
import { SectionCard } from '../../../../components/admin/SectionCard';
import { LoadingRows, Table, Td, Tr } from '../../../../components/admin/Table';

/** Usuarios del equipo de Wuarikes: cada uno con su perfil de permisos. */
export default function EquipoPlataformaPage() {
  const perms = usePlatformPermissions(true);
  const canManage = can(perms, 'usuarios.gestionar');
  const [staff, setStaff] = useState<PlatformStaff[]>([]);
  const [profiles, setProfiles] = useState<PlatformProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const me = typeof window !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').id as string; } catch { return ''; } })() : '';

  const load = useCallback(() => {
    Promise.all([platformAccessApi.staff(), platformAccessApi.profiles()])
      .then(([s, p]) => { setStaff(s); setProfiles(p); })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const run = async (action: () => Promise<unknown>, ok: string) => {
    try { await action(); toast.success(ok); load(); } catch (e: any) { toast.error(e.message); }
  };

  // Solo se ofrecen perfiles que el usuario podría dar (el backend lo vuelve a validar).
  const assignable = profiles.filter((p) => can(perms, '*') || p.permissions.every((k) => perms?.includes(k)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo Wuarikes"
        subtitle="Las personas que trabajan en la plataforma y qué puede ver cada una."
        action={canManage && <Button icon={UserPlus} onClick={() => setCreating(true)}>Nuevo usuario</Button>}
      />
      <SectionCard title="Usuarios del equipo" subtitle={loading ? undefined : `${staff.length} persona${staff.length === 1 ? '' : 's'}`}>
        {loading ? <LoadingRows /> : staff.length === 0 ? (
          <EmptyState icon={UserCog} headingLevel="h3" title="Aún no hay usuarios del equipo" description="Crea el primero con Nuevo usuario." />
        ) : (
          <Table columns={['Usuario', 'Perfil', 'Estado', ...(canManage ? [{ label: 'Acciones', align: 'right' as const }] : [])]}>
            {staff.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <p className="font-semibold">{u.fullName}</p>
                  <p className="text-xs text-text-muted">{u.email}</p>
                </Td>
                <Td>
                  {canManage && u.id !== me ? (
                    <select
                      aria-label={`Perfil de ${u.fullName}`}
                      className="min-h-9 rounded-control border border-border bg-surface px-2 text-sm"
                      value={u.profileId ?? ''}
                      onChange={(e) => run(() => platformAccessApi.assignProfile(u.id, e.target.value), 'Perfil actualizado')}
                    >
                      {!u.profileId && <option value="">{u.profileName}</option>}
                      {profiles.map((p) => <option key={p.id} value={p.id} disabled={!assignable.includes(p)}>{p.name}</option>)}
                    </select>
                  ) : <Badge tone="primary">{u.profileName}</Badge>}
                </Td>
                <Td>
                  {u.isBanned ? <Badge tone="danger"><Ban size={16} aria-hidden />Bloqueado</Badge>
                    : u.isVerified ? <Badge tone="success"><Check size={16} aria-hidden />Activo</Badge>
                    : <Badge tone="warning">Falta activar</Badge>}
                </Td>
                {canManage && (
                  <Td right className="whitespace-nowrap">
                    {u.id !== me && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" icon={Mail} aria-label={`Reenviar acceso a ${u.fullName}`}
                          onClick={() => run(() => adminApi.sendAccessEmail(u.id), `Enviamos el acceso a ${u.email}`)}>Reenviar acceso</Button>
                        <Button size="sm" variant="ghost" icon={u.isBanned ? Check : Ban} className={u.isBanned ? undefined : 'text-danger hover:text-danger'}
                          aria-label={`${u.isBanned ? 'Activar' : 'Bloquear'} a ${u.fullName}`}
                          onClick={() => (u.isBanned || confirm(`¿Bloquear a ${u.fullName}? Ya no podrá entrar al panel.`))
                            && run(() => (u.isBanned ? adminApi.activateUser(u.id) : adminApi.banUser(u.id)), u.isBanned ? 'Usuario activado' : 'Usuario bloqueado')}>
                          {u.isBanned ? 'Activar' : 'Bloquear'}
                        </Button>
                      </div>
                    )}
                  </Td>
                )}
              </Tr>
            ))}
          </Table>
        )}
      </SectionCard>
      {creating && <NewStaffModal profiles={assignable} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}
    </div>
  );
}

function NewStaffModal({ profiles, onClose, onCreated }: { profiles: PlatformProfile[]; onClose(): void; onCreated(): void }) {
  const [form, setForm] = useState({ fullName: '', email: '', profileId: profiles.find((p) => p.name === 'Comercial')?.id ?? profiles[0]?.id ?? '' });
  const [saving, setSaving] = useState(false);
  const profile = profiles.find((p) => p.id === form.profileId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await platformAccessApi.createStaff(form);
      toast.success(res.message ?? 'Usuario creado');
      onCreated();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nuevo usuario del equipo" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" form="new-staff-form" icon={UserPlus} loading={saving}>Crear y enviar acceso</Button>
      </>
    }>
      <form id="new-staff-form" onSubmit={submit} className="space-y-4">
        <Input label="Nombre completo" required minLength={2} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <Input label="Correo" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Select label="Perfil" required value={form.profileId} onChange={(e) => setForm({ ...form, profileId: e.target.value })}
          hint={profile?.description ?? undefined}>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <p className="text-sm text-text-muted">Le llegará un correo para activar su cuenta y crear su contraseña.</p>
      </form>
    </Modal>
  );
}
