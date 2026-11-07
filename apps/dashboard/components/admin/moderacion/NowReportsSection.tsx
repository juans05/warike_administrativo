'use client';

import { useState } from 'react';
import { Flag, RotateCcw, Trash2, Type, Video } from 'lucide-react';
import { Badge, Button, DataList, EmptyState } from '../../ui';
import { SectionCard } from '../SectionCard';
import type { NowReportedPost } from '../../../lib/api-client';

const REASONS = { votes: 'Por votos', reports: 'Por reportes' } as const;

const formatDate = (iso: string) => new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

/** Foto, primer cuadro del video o icono si es solo texto; la miniatura abre el archivo si es https. */
function Thumb({ post }: { post: NowReportedPost }) {
  const box = 'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-control border border-border bg-primary-soft text-primary';
  const media = post.mediaUrl;
  if (!media || post.kind === 'text') {
    return <span aria-hidden className={box}><Type size={24} /></span>;
  }
  const preview = post.kind === 'photo' ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={media} alt="" className="h-full w-full object-cover" />
  ) : (
    // #t=0.1 hace que el navegador pinte un cuadro del video sin reproducirlo.
    <video src={`${media}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
  );
  if (!media.startsWith('https://')) return <span aria-hidden className={box}>{preview}</span>;
  return (
    <a
      href={media}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={post.kind === 'photo' ? 'Abrir la foto' : 'Abrir el video'}
      className={`${box} relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
    >
      {preview}
      {post.kind === 'video' && <Video size={16} aria-hidden className="absolute bottom-1 right-1 rounded-full bg-black/60 p-0.5 text-white" />}
    </a>
  );
}

export function NowReportsSection({ posts, onRestore, onDelete, readOnly }: {
  /** Sin locales.gestionar (ej. comercial): solo ver. */
  readOnly?: boolean;
  posts: NowReportedPost[];
  onRestore(id: string): Promise<void>;
  onDelete(id: string): Promise<void>;
}) {
  // Borrar pide un segundo toque ("¿Seguro?") y, mientras la acción corre, bloquea los botones de esa fila.
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (id: string, action: (id: string) => Promise<void>) => {
    setBusyId(id);
    try {
      await action(id);
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  return (
    <SectionCard title="Publicaciones Ahora reportadas" subtitle={`${posts.length} publicaciones ocultas esperan revisión`}>
      <div className="px-4">
        <DataList
          items={posts}
          empty={<EmptyState icon={Flag} headingLevel="h3" title="No hay publicaciones reportadas" description="Ninguna publicación de Ahora está oculta por votos o reportes." />}
          renderItem={(p) => {
            const busy = busyId === p.id;
            return (
              <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Thumb post={p} />
                  <div className="min-w-0">
                    {p.text && <p className="line-clamp-2 break-words text-sm font-semibold text-text">{p.text}</p>}
                    <p className="truncate text-xs text-text-muted">
                      {p.author.fullName} · {formatDate(p.createdAt)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {p.hiddenReason && <Badge tone={p.hiddenReason === 'reports' ? 'danger' : 'warning'}>{REASONS[p.hiddenReason]}</Badge>}
                      <span className="text-xs text-text-muted">
                        {p.reports} reporte{p.reports === 1 ? '' : 's'} · {p.likes + p.checks} a favor · {p.dislikes} en contra
                      </span>
                    </div>
                  </div>
                </div>
                {!readOnly && (confirmId === p.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text">¿Seguro?</span>
                    <Button size="sm" variant="danger" loading={busy} onClick={() => run(p.id, onDelete)}>Sí</Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => setConfirmId(null)}>No</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" icon={RotateCcw} loading={busy} onClick={() => run(p.id, onRestore)}>Restaurar</Button>
                    <Button size="sm" variant="secondary" icon={Trash2} className="text-danger" disabled={busy} onClick={() => setConfirmId(p.id)}>Borrar</Button>
                  </div>
                ))}
              </div>
            );
          }}
        />
      </div>
    </SectionCard>
  );
}
