'use client';

import { Instagram, Unlink, X } from 'lucide-react';
import { Card, cn } from '../ui';
import type { SocialAccountInfo } from './api';

/** Cuentas vinculadas: tocar una filtra los comentarios por esa cuenta; el botón de al lado la desvincula. */
export function AccountsCard({ accounts, activeAccountId, onToggleFilter, onDisconnect }: {
  accounts: SocialAccountInfo[];
  activeAccountId: string | null;
  onToggleFilter(accountId: string): void;
  onDisconnect(account: SocialAccountInfo): void;
}) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium text-text-muted">Cuentas vinculadas ({accounts.length})</h2>
      <ul className="flex flex-wrap gap-3">
        {accounts.map((account) => {
          const active = activeAccountId === account.id;
          return (
            <li key={account.id} className={cn('flex items-center rounded-card border bg-surface', active ? 'border-primary ring-2 ring-primary/20' : 'border-border')}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onToggleFilter(account.id)}
                className="flex min-h-12 items-center gap-3 rounded-card px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Instagram size={20} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-text">{account.username}</span>
                  <span className="block text-xs text-text-muted">{active ? 'Filtrando sus comentarios' : 'Instagram · activa'}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDisconnect(account)}
                aria-label={`Desvincular ${account.username}`}
                title="Desvincular"
                className="mr-1 flex h-11 w-11 items-center justify-center rounded-control text-text-muted hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Unlink size={16} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      {activeAccountId && (
        <button
          type="button"
          onClick={() => onToggleFilter(activeAccountId)}
          className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-control text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X size={16} aria-hidden />
          Quitar filtro y ver todas las cuentas
        </button>
      )}
    </Card>
  );
}
