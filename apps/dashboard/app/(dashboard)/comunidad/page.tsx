'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus } from 'lucide-react';
import { adminApi } from '../../../lib/api-client';
import { toast } from 'sonner';
import { Button, PageHeader } from '../../../components/ui';
import { CreateUserModal } from '../../../components/admin/comunidad/CreateUserModal';
import { UsersSection, type User, type UsersMeta } from '../../../components/admin/comunidad/UsersSection';

export default function ComunidadPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<UsersMeta | null>(null);
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers(page, search);
      setUsers(Array.isArray(data?.data) ? data.data : []);
      setMeta(data?.meta ?? null);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar usuarios');
      setUsers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { setPage(1); }, [search]);

  const toggleBan = async (user: User) => {
    if (!confirm(`¿${user.isBanned ? 'Activar' : 'Banear'} a ${user.fullName}?`)) return;
    try {
      if (user.isBanned) await adminApi.activateUser(user.id);
      else await adminApi.banUser(user.id);
      loadUsers();
    } catch {
      toast.error('Error actualizando estado del usuario');
    }
  };

  const sendAccessEmail = async (user: User) => {
    if (!confirm(`¿Enviar a ${user.email} un correo para crear una contraseña nueva?`)) return;
    try {
      await adminApi.sendAccessEmail(user.id);
      toast.success(`Correo enviado a ${user.email}`);
    } catch (err: any) {
      toast.error(err?.message || 'Error al enviar el correo');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        subtitle="Administra los roles, permisos y estados de los usuarios del ecosistema."
        action={<Button icon={UserPlus} onClick={() => setCreating(true)}>Registrar usuario</Button>}
      />

      <UsersSection
        users={users}
        meta={meta}
        loading={loading}
        error={error}
        search={search}
        onSearch={setSearch}
        onRetry={loadUsers}
        onPage={setPage}
        onSendAccess={sendAccessEmail}
        onToggleBan={toggleBan}
      />

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); loadUsers(); }}
        />
      )}
    </div>
  );
}
