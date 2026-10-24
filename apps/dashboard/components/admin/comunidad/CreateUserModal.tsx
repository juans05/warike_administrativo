'use client';

import React, { useState } from 'react';
import { Building2, User, UserPlus, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../../lib/api-client';
import { Button, Input, Modal, cn } from '../../ui';

type Role = 'business' | 'user';

const ROLES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'business', label: 'Negocio', icon: Building2 },
  { value: 'user', label: 'Usuario', icon: User },
];

const EMPTY = { fullName: '', email: '', password: '', role: 'business' as Role };

/** Alta de un usuario. Se monta solo mientras está abierto, así el formulario siempre empieza vacío. */
export function CreateUserModal({ onClose, onCreated }: { onClose(): void; onCreated(): void }) {
  const [newUser, setNewUser] = useState(EMPTY);
  const [creating, setCreating] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.createUser(newUser);
      toast.success(`Usuario creado. Enviamos el correo de activación a ${newUser.email}`);
      onCreated();
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo usuario"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="create-user-form" icon={UserPlus} loading={creating}>
            {creating ? 'Registrando...' : 'Confirmar registro'}
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={submit} className="space-y-4">
        <p className="text-text-muted">Registra un negocio o un usuario. El equipo de Wuarikes se crea en Equipo Wuarikes, con su perfil.</p>
        <Input label="Nombre completo" required type="text" placeholder="Ej. Juan Pérez" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} />
        <Input label="Correo" required type="email" placeholder="socio@wuarike.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
        <Input label="Contraseña temporal" required type="password" autoComplete="new-password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-text">Rol del usuario</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(({ value, label, icon: Icon }) => {
              const checked = newUser.role === value;
              return (
                <label
                  key={value}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3 text-sm transition-colors duration-200 motion-reduce:transition-none',
                    'focus-within:ring-2 focus-within:ring-primary',
                    checked ? 'border-primary bg-primary-soft font-medium text-text' : 'border-border text-text-muted hover:bg-background',
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={checked}
                    onChange={() => setNewUser({ ...newUser, role: value as Role })}
                    className="sr-only"
                  />
                  <Icon size={16} aria-hidden />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
