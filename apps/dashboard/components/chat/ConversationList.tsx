'use client';

import { MessageSquare, RefreshCw, Search } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Skeleton, Tabs } from '../ui';
import { avatarInitial, conversationName, timeOf } from './format';

export type ConversationFilter = 'unassigned' | 'mine' | 'all';

const FILTERS = [
  { key: 'unassigned', label: 'Sin asignar' },
  { key: 'mine', label: 'Mías' },
  { key: 'all', label: 'Todas' },
];

const STATUS_TONE: Record<string, 'neutral' | 'warning' | 'primary'> = { cerrado: 'neutral', pendiente: 'warning' };

interface ConversationListProps {
  conversations: any[];
  loading: boolean;
  filter: ConversationFilter;
  onFilter(filter: ConversationFilter): void;
  search: string;
  onSearch(value: string): void;
  selectedId: string | null;
  unreadById: Record<string, number>;
  onSelect(conversation: any): void;
  syncing: boolean;
  onSync(): void;
}

export function ConversationList({
  conversations, loading, filter, onFilter, search, onSearch, selectedId, unreadById, onSelect, syncing, onSync,
}: ConversationListProps) {
  const query = search.trim().toLowerCase();
  const visible = query
    ? conversations.filter((c) =>
        [c.customerName, c.customerPhone, c.lastMessage].some((v) => typeof v === 'string' && v.toLowerCase().includes(query)))
    : conversations;

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="px-2">
          <Tabs tabs={FILTERS} value={filter} onChange={(key) => onFilter(key as ConversationFilter)} aria-label="Filtrar conversaciones" />
        </div>
        <div className="p-3">
          <Input label="Buscar" type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Nombre, teléfono o mensaje" />
        </div>
      </div>

      {loading ? (
        <div role="status" aria-label="Cargando conversaciones" className="divide-y divide-border px-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        query ? (
          <EmptyState icon={Search} title="Sin resultados" description="Prueba con otro nombre o teléfono." headingLevel="h3" />
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="Sin conversaciones"
            description="Cuando te escriban por WhatsApp, las verás aquí."
            headingLevel="h3"
            action={<Button variant="secondary" size="sm" icon={RefreshCw} loading={syncing} onClick={onSync}>Sincronizar con PlazBot</Button>}
          />
        )
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((conv) => {
            const selected = conv.id === selectedId;
            const unread = unreadById[conv.id] || 0;
            const name = conversationName(conv);
            return (
              <li key={conv.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conv)}
                  aria-current={selected || undefined}
                  className={`flex w-full gap-3 border-l-2 px-4 py-3 text-left transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                    selected ? 'border-l-primary bg-primary-soft' : conv.awaitingReply ? 'border-l-secondary hover:bg-background' : 'border-l-transparent hover:bg-background'
                  }`}
                >
                  <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-sm font-semibold text-text-muted">
                    {avatarInitial(name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm text-text ${unread > 0 || conv.awaitingReply ? 'font-semibold' : 'font-medium'}`}>{name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-text-muted">{timeOf(conv.lastMessageTime || conv.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-text-muted">{conv.lastMessage || 'Sin mensajes'}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1">
                      {unread > 0 && <Badge tone="primary">{unread} {unread === 1 ? 'nuevo' : 'nuevos'}</Badge>}
                      {conv.awaitingReply && <Badge tone="warning">Por responder</Badge>}
                      <Badge tone={conv.mode === 'human' ? 'success' : 'neutral'}>{conv.mode === 'human' ? 'Persona' : 'Bot'}</Badge>
                      <Badge tone={STATUS_TONE[conv.status] ?? 'primary'}>{conv.status || 'abierto'}</Badge>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
