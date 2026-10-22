'use client';

import { AlertCircle, Ban, Check, Mail, Search, Users } from 'lucide-react';
import { Badge, Button, EmptyState, Input, type BadgeProps } from '../../ui';
import { Pager } from '../../clientes/parts';
import { SectionCard } from '../SectionCard';
import { LoadingRows, Table, Td, Tr } from '../Table';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'business' | 'sales';
  isBanned: boolean;
  createdAt: string;
}

export interface UsersMeta { total: number; page: number; limit: number; totalPages: number }

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', business: 'Negocio', sales: 'Comercial', user: 'Usuario' };
const ROLE_TONE: Record<string, NonNullable<BadgeProps['tone']>> = { admin: 'primary', business: 'neutral', sales: 'success', user: 'neutral' };

export function UsersSection({ users, meta, loading, error, search, onSearch, onRetry, onPage, onSendAccess, onToggleBan }: {
  users: User[];
  meta: UsersMeta | null;
  loading: boolean;
  error: string | null;
  search: string;
  onSearch(value: string): void;
  onRetry(): void;
  onPage(page: number): void;
  onSendAccess(user: User): void;
  onToggleBan(user: User): void;
}) {
  return (
    <SectionCard
      title="Usuarios registrados"
      subtitle={meta ? `${meta.total} usuario${meta.total === 1 ? '' : 's'}` : undefined}
      action={
        <div className="w-full sm:w-80">
          <Input label="Buscar usuario" type="search" placeholder="Nombre o correo" value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
      }
    >
      {error && (
        <div role="alert" className="m-4 flex flex-wrap items-center gap-3 rounded-card border border-danger/30 bg-danger/10 p-4">
          <AlertCircle size={20} aria-hidden className="shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-danger">Error al cargar usuarios</p>
            <p className="text-sm text-text">{error}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onRetry}>Reintentar</Button>
        </div>
      )}

      {loading && users.length === 0 ? (
        <LoadingRows />
      ) : users.length === 0 ? (
        !error && (
          <EmptyState
            icon={search ? Search : Users}
            headingLevel="h3"
            title={search ? 'Sin resultados' : 'No hay usuarios registrados'}
            description={search ? 'Prueba con otro nombre o correo.' : 'Usa el botón de arriba para registrar el primer usuario.'}
          />
        )
      ) : (
        <div aria-busy={loading}>
          <Table columns={['Usuario', 'Rol', 'Estado', { label: 'Acciones', align: 'right' }]}>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>
                  <p className="font-semibold">{user.fullName}</p>
                  <p className="text-xs text-text-muted">{user.email}</p>
                </Td>
                <Td><Badge tone={ROLE_TONE[user.role] ?? 'neutral'}>{ROLE_LABEL[user.role] ?? user.role}</Badge></Td>
                <Td>
                  {user.isBanned ? (
                    <Badge tone="danger"><Ban size={16} aria-hidden />Baneado</Badge>
                  ) : (
                    <Badge tone="success"><Check size={16} aria-hidden />Activo</Badge>
                  )}
                </Td>
                <Td right className="whitespace-nowrap">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" icon={Mail} aria-label={`Reenviar acceso a ${user.fullName}`} onClick={() => onSendAccess(user)}>
                      Reenviar acceso
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={user.isBanned ? Check : Ban}
                      className={user.isBanned ? undefined : 'text-danger hover:text-danger'}
                      aria-label={`${user.isBanned ? 'Activar' : 'Banear'} a ${user.fullName}`}
                      onClick={() => onToggleBan(user)}
                    >
                      {user.isBanned ? 'Activar' : 'Banear'}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      )}

      {meta && meta.total > 0 && <Pager page={meta.page} totalPages={meta.totalPages} onPage={onPage} />}
    </SectionCard>
  );
}
