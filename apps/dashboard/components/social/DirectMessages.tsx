'use client';

import { Mail, MessageSquare, Send, User } from 'lucide-react';
import { Button, DataList, EmptyState, InboxLayout, Skeleton, cn, controlStyles } from '../ui';

/** Mensajes directos de Instagram: conversaciones a la izquierda y el hilo con su campo de respuesta a la derecha. */
export function DirectMessages({
  conversations, loadingConversations, active, onOpen, onClose,
  messages, loadingMessages, text, onTextChange, sending, onSend,
}: {
  conversations: any[];
  loadingConversations: boolean;
  active: any | null;
  onOpen(conversation: any): void;
  onClose(): void;
  messages: any[];
  loadingMessages: boolean;
  text: string;
  onTextChange(value: string): void;
  sending: boolean;
  onSend(): void;
}) {
  const list = (
    <DataList
      items={conversations}
      loading={loadingConversations}
      empty={<EmptyState icon={Mail} title="Sin mensajes directos aún" description="Cuando alguien te escriba por Instagram, lo verás aquí." headingLevel="h3" />}
      renderItem={(conv) => (
        <button
          type="button"
          onClick={() => onOpen(conv)}
          aria-current={active?.id === conv.id || undefined}
          className={cn(
            'flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 motion-reduce:transition-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
            active?.id === conv.id ? 'bg-primary-soft' : 'hover:bg-background',
          )}
        >
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-hover">
            <User size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-text">{conv.participantName || conv.participantUsername}</span>
              {!!conv.unreadCount && <span className="shrink-0 rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-white" aria-label={`${conv.unreadCount} sin leer`}>{conv.unreadCount}</span>}
            </span>
            <span className="block truncate text-xs text-text-muted">{conv.lastMessage}</span>
          </span>
        </button>
      )}
    />
  );

  const detail = active && (
    <div className="flex h-full min-h-[60dvh] flex-col">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-text">{active.participantName || active.participantUsername}</h2>
        <p className="text-sm text-text-muted">@{active.participantUsername}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loadingMessages ? (
          <div role="status" aria-label="Cargando" className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-1/2" />
            <Skeleton className="h-10 w-3/5" />
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn('flex', m.direction === 'outgoing' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[80%] rounded-card px-4 py-2 text-sm', m.direction === 'outgoing' ? 'bg-primary text-white' : 'bg-background text-text')}>
                {m.message}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 border-t border-border p-4">
        <input
          type="text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Escribe un mensaje..."
          aria-label="Mensaje"
          className={controlStyles(undefined, 'h-11 flex-1')}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
        />
        <Button icon={Send} loading={sending} disabled={!text.trim()} onClick={onSend}>Enviar</Button>
      </div>
    </div>
  );

  return (
    <InboxLayout
      list={list}
      detail={detail || null}
      emptyDetail={
        <div className="flex h-full items-center justify-center">
          <EmptyState icon={MessageSquare} title="Selecciona una conversación" description="Verás los mensajes y podrás responder desde aquí." />
        </div>
      }
      onCloseDetail={onClose}
    />
  );
}
