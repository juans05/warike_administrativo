'use client';

import type { ChangeEvent, RefObject } from 'react';
import { Bot, Check, FileText, Hand, Paperclip, Send, UserRound } from 'lucide-react';
import { Badge, Button, Skeleton, Switch } from '../ui';
import { controlStyles } from '../ui/Field';
import { conversationName, dateTimeOf } from './format';

interface ChatThreadProps {
  conversation: any;
  messages: any[];
  loadingMessages: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore(): void;
  teamMembers: any[];
  onToggleMode(): void;
  onClaim(): void;
  onClose(): void;
  onReassign(userId: string): void;
  replyText: string;
  onReplyText(value: string): void;
  sending: boolean;
  sendingFile: boolean;
  onSend(): void;
  onFileSelected(e: ChangeEvent<HTMLInputElement>): void;
  messagesContainerRef: RefObject<HTMLDivElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
  inputRef: RefObject<HTMLInputElement>;
  fileInputRef: RefObject<HTMLInputElement>;
}

/** Hilo de una conversación: cabecera con modo y acciones, mensajes y el cuadro de respuesta fijo abajo. */
export function ChatThread({
  conversation: conv, messages, loadingMessages, hasMore, loadingMore, onLoadMore, teamMembers,
  onToggleMode, onClaim, onClose, onReassign, replyText, onReplyText, sending, sendingFile, onSend, onFileSelected,
  messagesContainerRef, messagesEndRef, inputRef, fileInputRef,
}: ChatThreadProps) {
  const name = conversationName(conv);
  const isHuman = conv.mode === 'human';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-text">{name}</h2>
          {conv.customerName && conv.customerPhone && <p className="truncate text-xs text-text-muted">{conv.customerPhone}</p>}
        </div>
        <div className="w-52">
          <Switch label={isHuman ? 'Atiende una persona' : 'Atiende el bot'} checked={isHuman} onChange={onToggleMode} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {conv.status === 'cerrado' ? (
            <Badge>Cerrada</Badge>
          ) : !conv.assignedToUserId ? (
            <Button size="sm" icon={Hand} onClick={onClaim}>Reclamar</Button>
          ) : (
            <>
              {teamMembers.length > 1 && (
                <select
                  aria-label="Reasignar conversación"
                  onChange={(e) => onReassign(e.target.value)}
                  value=""
                  className={controlStyles(undefined, 'h-9 w-auto')}
                >
                  <option value="" disabled>Reasignar a...</option>
                  {teamMembers.filter((m) => m.userId !== conv.assignedToUserId).map((m) => (
                    <option key={m.userId} value={m.userId}>{m.fullName}</option>
                  ))}
                </select>
              )}
              <Button size="sm" variant="secondary" icon={Check} onClick={onClose}>Cerrar</Button>
            </>
          )}
        </div>
      </header>

      <div ref={messagesContainerRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-background px-4 py-4">
        {loadingMessages ? (
          <div role="status" aria-label="Cargando mensajes" className="space-y-4">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-12 w-3/5" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Sin mensajes aún</p>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-2">
                <Button size="sm" variant="secondary" loading={loadingMore} onClick={onLoadMore}>
                  {loadingMore ? 'Cargando...' : 'Cargar más'}
                </Button>
              </div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                customerName={name}
                showLabel={
                  i === 0 ||
                  messages[i - 1].messageType !== msg.messageType ||
                  messages[i - 1].isFromAi !== msg.isFromAi ||
                  new Date(msg.createdAt).getTime() - new Date(messages[i - 1].createdAt).getTime() > 60000
                }
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-surface px-4 py-3">
        {isHuman ? (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf,.doc,.docx"
              className="hidden"
              onChange={onFileSelected}
            />
            <Button
              variant="secondary"
              icon={Paperclip}
              loading={sendingFile}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Adjuntar imagen o PDF"
              title="Adjuntar imagen o PDF"
              className="w-11 shrink-0 px-0"
            />
            <input
              ref={inputRef}
              type="text"
              value={replyText}
              onChange={(e) => onReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              placeholder="Escribe tu mensaje..."
              aria-label="Mensaje"
              className={controlStyles(undefined, 'h-11 min-w-0 flex-1')}
            />
            <Button icon={Send} loading={sending} disabled={!replyText.trim()} onClick={onSend} className="shrink-0">
              <span className="hidden sm:inline">Enviar</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-control border border-border bg-background px-3 py-2">
            <Bot size={20} className="shrink-0 text-text-muted" aria-hidden />
            <p className="flex-1 text-sm text-text-muted">El bot está respondiendo. Pasa a modo persona para responder tú.</p>
            <Button size="sm" variant="secondary" icon={UserRound} onClick={onToggleMode}>Responder yo</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ msg, customerName, showLabel }: { msg: any; customerName: string; showLabel: boolean }) {
  const isIncoming = msg.messageType === 'INCOMING';
  const isBot = !isIncoming && !!msg.isFromAi;
  const sender = isIncoming ? customerName : isBot ? 'Bot' : 'Equipo';
  const SenderIcon = isIncoming ? null : isBot ? Bot : UserRound;
  const bubble = isIncoming
    ? 'bg-surface text-text border border-border'
    : isBot
      ? 'bg-primary-soft text-text border border-primary/20'
      : 'bg-primary text-white';

  return (
    <div className={`flex flex-col ${isIncoming ? 'items-start' : 'items-end'}`}>
      {showLabel && (
        <p className="mb-1 flex items-center gap-1 px-1 text-xs text-text-muted">
          {SenderIcon && <SenderIcon size={16} aria-hidden />}
          <span className="font-medium">{sender}</span> · {dateTimeOf(msg.createdAt)}
        </p>
      )}
      <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-card px-4 py-2.5 text-sm leading-relaxed sm:max-w-sm ${bubble}`}>
        {msg.mediaUrl && (
          msg.mediaType?.startsWith('image/') ? (
            <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
              <img src={msg.mediaUrl} alt="Adjunto" className="mb-1.5 max-w-full rounded-control" />
            </a>
          ) : (
            <a
              href={msg.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mb-1.5 flex items-center gap-2 rounded-control px-3 py-2 text-xs font-medium underline ${isIncoming || isBot ? 'bg-background' : 'bg-white/10'}`}
            >
              <FileText size={16} aria-hidden /> Ver adjunto
            </a>
          )
        )}
        {msg.messageBody}
        {!showLabel && SenderIcon && <span className="sr-only"> ({sender})</span>}
      </div>
    </div>
  );
}
