'use client';

import { useState } from 'react';
import { Check, FileText, PartyPopper, Paperclip, X } from 'lucide-react';
import { Button, DataList, EmptyState } from '../../ui';
import { SectionCard } from '../SectionCard';
import type { PlaceClaim } from './types';

function documentName(url: string) {
  try {
    return decodeURIComponent(url.split('/').pop() || url);
  } catch {
    return url;
  }
}

/** Los documentos los sube quien reclama el local: solo se enlazan si son https (un `javascript:` correría en la sesión del admin). */
function isHttpsUrl(url: string) {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function ClaimsSection({ claims, onVerify, onReject, readOnly }: {
  readOnly?: boolean;
  claims: PlaceClaim[];
  onVerify(id: string): void;
  onReject(id: string): void;
}) {
  const [openDocsFor, setOpenDocsFor] = useState<string | null>(null);

  return (
    <SectionCard title="Reclamos de negocio pendientes" subtitle={`${claims.length} dueños piden verificar que un local es suyo`}>
      <div className="px-4">
        <DataList
          items={claims}
          empty={<EmptyState icon={PartyPopper} headingLevel="h3" title="No hay reclamos pendientes" description="No hay dueños esperando verificación." />}
          renderItem={(c) => {
            const docs = c.documentUrls ?? [];
            const docsOpen = openDocsFor === c.id;
            return (
              <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">{c.place?.name || '—'}</p>
                  <p className="truncate text-xs text-text-muted">
                    Reclama {c.businessName} · {c.businessEmail} · {c.businessPhone}
                  </p>
                  {docs.length > 0 && (
                    <div className="mt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Paperclip}
                        className="-ml-3 text-primary"
                        aria-expanded={docsOpen}
                        onClick={() => setOpenDocsFor(docsOpen ? null : c.id)}
                      >
                        {docs.length} documento{docs.length === 1 ? '' : 's'} adjunto{docs.length === 1 ? '' : 's'}
                      </Button>
                      {docsOpen && (
                        <ul className="mt-1 space-y-1">
                          {docs.map((url) => (
                            <li key={url}>
                              {isHttpsUrl(url) ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:min-h-8"
                                >
                                  <FileText size={16} aria-hidden className="shrink-0" />
                                  <span className="truncate">{documentName(url)}</span>
                                </a>
                              ) : (
                                <span className="inline-flex min-h-11 items-center gap-2 text-sm text-text-muted md:min-h-8" title="Enlace no seguro: no se abre desde aquí">
                                  <FileText size={16} aria-hidden className="shrink-0" />
                                  <span className="break-all">{url}</span>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                {!readOnly && <div className="flex gap-2">
                  <Button size="sm" icon={Check} onClick={() => onVerify(c.id)}>Verificar</Button>
                  <Button size="sm" variant="secondary" icon={X} className="text-danger" onClick={() => onReject(c.id)}>Rechazar</Button>
                </div>}
              </div>
            );
          }}
        />
      </div>
    </SectionCard>
  );
}
