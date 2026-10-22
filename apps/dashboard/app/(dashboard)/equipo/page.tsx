'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { KeyRound, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { teamApi, businessApi } from '../../../lib/api-client';
import { toast } from 'sonner';
import { Badge, Button, Card, CloseButton, DataList, EmptyState, Input, PageHeader, Select, Sheet } from '../../../components/ui';

type Role = 'admin' | 'supervisor' | 'agente' | 'mozo' | 'cocina';

const ROLE_LABELS: Record<Role, string> = { admin: 'Admin', supervisor: 'Supervisor', agente: 'Agente', mozo: 'Mozo', cocina: 'Cocina' };

interface TeamMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  whatsappNumberIds: string[];
}

interface WaNumber {
  id: string;
  phoneNumber: string;
}

/** Rol y, para agentes, qué números de WhatsApp ve. Lo usan el alta y la edición. */
function RoleFields({ role, numberIds, waNumbers, onRole, onToggleNumber }: {
  role: Role;
  numberIds: string[];
  waNumbers: WaNumber[];
  onRole(role: Role): void;
  onToggleNumber(id: string): void;
}) {
  return (
    <>
      <Select label="Rol" value={role} onChange={e => onRole(e.target.value as Role)}>
        <option value="agente">Agente</option>
        <option value="mozo">Mozo (toma pedidos en mesas desde su celular)</option>
        <option value="cocina">Cocina (solo pantalla de cocina)</option>
        <option value="supervisor">Supervisor</option>
        <option value="admin">Admin</option>
      </Select>
      {role === 'agente' && (
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium text-text">Números de WhatsApp visibles</legend>
          {waNumbers.length === 0 && <p className="text-sm text-text-muted">Sin números registrados en esta sede.</p>}
          {waNumbers.map(n => (
            <label key={n.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={numberIds.includes(n.id)} onChange={() => onToggleNumber(n.id)} />
              {n.phoneNumber}
            </label>
          ))}
        </fieldset>
      )}
    </>
  );
}

const toggleId = (ids: string[], id: string) => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);

export default function EquipoPage() {
  const { activePlaceId } = useRestaurant();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [waNumbers, setWaNumbers] = useState<WaNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', role: 'agente' as Role, whatsappNumberIds: [] as string[] });
  const [isSaving, setIsSaving] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: 'agente' as Role, whatsappNumberIds: [] as string[] });
  const [isEditSaving, setIsEditSaving] = useState(false);

  const load = useCallback(async () => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [teamRes, numbersRes] = await Promise.all([
        teamApi.list(activePlaceId),
        businessApi.getWhatsappNumbers(activePlaceId),
      ]);
      setMembers(teamRes.data || []);
      setWaNumbers(numbersRes.data || []);
    } catch {
      toast.error('No se pudo cargar el equipo. Puede que no seas Admin de esta sede.');
    } finally {
      setIsLoading(false);
    }
  }, [activePlaceId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaceId || !form.email || !form.fullName) return;
    setIsSaving(true);
    try {
      const result = await teamApi.create(activePlaceId, form);
      if (result.emailSent) {
        toast.success(
          result.isExistingAccount
            ? 'Agente agregado. Ya tenía cuenta, le mandamos un correo con el link para cambiar su contraseña.'
            : 'Agente agregado. Le llegó un correo con sus credenciales.',
        );
      } else if (result.isExistingAccount) {
        toast.error('Agente agregado, pero no se pudo enviar el correo. Decile que entre con su cuenta existente o use "Olvidé mi contraseña".');
      } else {
        toast.error('Agente agregado, pero no se pudo enviar el correo. Pasale la contraseña manualmente.');
        setPendingCredentials({ email: form.email, password: result.temporaryPassword });
      }
      setForm({ email: '', fullName: '', role: 'agente', whatsappNumberIds: [] });
      setShowForm(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar el agente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!activePlaceId) return;
    if (!confirm('¿Quitar a esta persona del equipo?')) return;
    try {
      await teamApi.remove(activePlaceId, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch {
      toast.error('No se pudo quitar del equipo');
    }
  };

  const startEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setEditForm({ role: m.role, whatsappNumberIds: m.whatsappNumberIds });
  };

  const handleUpdate = async (memberId: string) => {
    if (!activePlaceId) return;
    setIsEditSaving(true);
    try {
      await teamApi.update(activePlaceId, memberId, editForm);
      toast.success('Cambios guardados');
      setEditingId(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'No se pudieron guardar los cambios');
    } finally {
      setIsEditSaving(false);
    }
  };

  const editing = members.find(m => m.id === editingId);

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <PageHeader
        title="Equipo"
        subtitle="Quién puede ver y trabajar el inbox de WhatsApp de esta sede."
        action={<Button icon={UserPlus} onClick={() => setShowForm(true)}>Agregar persona</Button>}
      />

      {pendingCredentials && (
        <div role="alert" className="flex items-start justify-between gap-4 rounded-card border border-secondary/60 bg-secondary/10 p-4">
          <div className="flex gap-3">
            <KeyRound size={20} aria-hidden className="mt-0.5 shrink-0 text-text" />
            <div>
              <p className="text-sm font-semibold text-text">No se pudo enviar el correo de credenciales</p>
              <p className="mt-1 text-sm text-text">
                Pasale esta contraseña temporal a <span className="font-semibold">{pendingCredentials.email}</span> por otro medio:
              </p>
              <p className="mt-2 inline-block rounded-control border border-border bg-surface px-3 py-2 font-mono text-sm text-text">
                {pendingCredentials.password}
              </p>
            </div>
          </div>
          <CloseButton onClose={() => setPendingCredentials(null)} />
        </div>
      )}

      <Card padding="sm">
        <DataList
          items={members}
          loading={isLoading}
          empty={
            <EmptyState
              icon={Users}
              title="Todavía no hay nadie más en el equipo"
              description="Agrega a quienes atienden el WhatsApp, las mesas o la cocina de esta sede."
              action={<Button variant="secondary" icon={UserPlus} onClick={() => setShowForm(true)}>Agregar persona</Button>}
            />
          }
          renderItem={m => (
            <div className="flex flex-wrap items-center gap-3 py-3">
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-hover">
                {m.fullName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{m.fullName}</p>
                <p className="truncate text-sm text-text-muted">{m.email}</p>
              </div>
              <Badge>{ROLE_LABELS[m.role]}</Badge>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => startEdit(m)} aria-label={`Editar a ${m.fullName}`}>Editar</Button>
                <Button size="sm" variant="ghost" icon={Trash2} className="text-danger hover:bg-danger/10 hover:text-danger" onClick={() => handleRemove(m.id)} aria-label={`Eliminar a ${m.fullName}`}>
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        />
      </Card>

      <Sheet open={showForm} onClose={() => setShowForm(false)} title="Agregar persona al equipo">
        <form onSubmit={handleCreate} className="space-y-4 p-4">
          <Input label="Nombre" type="text" value={form.fullName} required onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} required onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <RoleFields
            role={form.role}
            numberIds={form.whatsappNumberIds}
            waNumbers={waNumbers}
            onRole={role => setForm(p => ({ ...p, role }))}
            onToggleNumber={id => setForm(p => ({ ...p, whatsappNumberIds: toggleId(p.whatsappNumberIds, id) }))}
          />
          <Button type="submit" loading={isSaving} className="w-full">{isSaving ? 'Guardando...' : 'Agregar al equipo'}</Button>
        </form>
      </Sheet>

      <Sheet open={editing !== undefined} onClose={() => setEditingId(null)} title="Editar acceso">
        {editing && (
          <div className="space-y-4 p-4">
            <div>
              <p className="text-sm font-semibold text-text">{editing.fullName}</p>
              <p className="text-sm text-text-muted">{editing.email}</p>
            </div>
            <RoleFields
              role={editForm.role}
              numberIds={editForm.whatsappNumberIds}
              waNumbers={waNumbers}
              onRole={role => setEditForm(p => ({ ...p, role }))}
              onToggleNumber={id => setEditForm(p => ({ ...p, whatsappNumberIds: toggleId(p.whatsappNumberIds, id) }))}
            />
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setEditingId(null)}>Cancelar</Button>
              <Button className="flex-1" loading={isEditSaving} onClick={() => handleUpdate(editing.id)}>{isEditSaving ? 'Guardando...' : 'Guardar cambios'}</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
