'use client';

import type { ReactNode } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button, cn } from '../../ui';

/** URL de webhook que alguien debe pegar a mano en otro sistema: se muestra con un botón para copiarla. */
export function WebhookNotice({ tone, title, url, children }: {
  /** `attention` pide un paso manual obligatorio; `info` es una guía. */
  tone: 'attention' | 'info';
  title: string;
  url: string;
  children: ReactNode;
}) {
  const copy = () => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada');
  };

  return (
    <div className={cn('space-y-2 rounded-card border p-4', tone === 'attention' ? 'border-secondary/50 bg-secondary/10' : 'border-border bg-background')}>
      <p className="text-sm font-semibold text-text">{title}</p>
      <p className="text-sm text-text-muted">{children}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-control border border-border bg-surface px-3 py-2 font-mono text-xs text-text">{url}</code>
        <Button size="sm" variant="secondary" icon={Copy} onClick={copy}>Copiar</Button>
      </div>
    </div>
  );
}
