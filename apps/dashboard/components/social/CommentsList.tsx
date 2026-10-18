'use client';

import { useState } from 'react';
import { Frown, HelpCircle, Meh, MessageCircle, Send, Smile, type LucideIcon } from 'lucide-react';
import { Badge, Button, Card, EmptyState, controlStyles } from '../ui';
import type { SocialAccountInfo } from './api';

const SENTIMENT: Record<string, { icon: LucideIcon; label: string }> = {
  positive: { icon: Smile, label: 'Comentario positivo' },
  negative: { icon: Frown, label: 'Comentario negativo' },
  neutral: { icon: Meh, label: 'Comentario neutral' },
  question: { icon: HelpCircle, label: 'Pregunta' },
};

export const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
};

/** Comentarios de Instagram: lo que respondió la IA o, si falta, un campo para responder a mano. */
export function CommentsList({ comments, accounts, filterUsername, onReply }: {
  comments: any[];
  accounts: SocialAccountInfo[];
  filterUsername?: string;
  /** Devuelve true si se envió (solo entonces se limpia el campo). */
  onReply(commentId: string, text: string): Promise<boolean>;
}) {
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const send = async (commentId: string) => {
    const text = replyText[commentId];
    if (!text) return;
    if (await onReply(commentId, text)) setReplyText((prev) => ({ ...prev, [commentId]: '' }));
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-text">
          Comentarios {filterUsername ? `de ${filterUsername}` : 'de todas las cuentas'}
        </h2>
        <Badge>{comments.length} en total</Badge>
      </div>

      {comments.length === 0 ? (
        <Card>
          <EmptyState icon={MessageCircle} title="Sin comentarios aún" description="Los comentarios de Instagram aparecerán aquí en tiempo real." headingLevel="h3" />
        </Card>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const sentiment = SENTIMENT[comment.sentiment];
            const Icon = sentiment?.icon ?? MessageCircle;
            const answer = comment.isReplied ? (comment.manualReply || comment.aiReply) : null;
            return (
              <li key={comment.id}>
                <Card className="space-y-3">
                  <div className="flex gap-3">
                    <span role="img" aria-label={sentiment?.label ?? 'Comentario'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-text-muted">
                      <Icon size={20} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-text">{comment.authorUsername}</span>
                          {accounts.length > 1 && <Badge tone="primary">{comment.accountUsername}</Badge>}
                        </div>
                        <span className="text-xs text-text-muted">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-text">{comment.text}</p>
                    </div>
                  </div>

                  {answer ? (
                    <div className="space-y-1 border-l-4 border-primary pl-4 sm:ml-[52px]">
                      <Badge tone="primary">{comment.manualReply ? 'Respuesta manual' : 'Respuesta de la IA'}</Badge>
                      <p className="text-sm text-text">{answer}</p>
                    </div>
                  ) : (
                    <div className="flex gap-2 sm:ml-[52px]">
                      <input
                        type="text"
                        value={replyText[comment.id] || ''}
                        onChange={(e) => setReplyText((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                        placeholder="Responder manualmente..."
                        aria-label={`Responder a ${comment.authorUsername}`}
                        className={controlStyles(undefined, 'h-11 flex-1')}
                        onKeyDown={(e) => e.key === 'Enter' && send(comment.id)}
                      />
                      <Button icon={Send} disabled={!replyText[comment.id]} onClick={() => send(comment.id)}>Enviar</Button>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
