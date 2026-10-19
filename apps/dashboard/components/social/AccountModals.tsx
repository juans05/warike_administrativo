'use client';

import { Check, Facebook, Instagram, type LucideIcon } from 'lucide-react';
import { Badge, Button, Modal } from '../ui';
import type { SocialAccountInfo } from './api';

const PLATFORMS: { key: 'instagram' | 'facebook'; label: string; icon: LucideIcon }[] = [
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
];

/** Elegir qué plataforma vincular; marca las que ya tienen cuentas conectadas. */
export function PlatformModal({ open, accounts, onClose, onPick }: {
  open: boolean;
  accounts: SocialAccountInfo[];
  onClose(): void;
  onPick(platform: 'instagram' | 'facebook'): void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="¿Qué plataforma quieres vincular?">
      <p className="mb-4 text-text-muted">Vas a autorizar a Wuarike desde tu cuenta de empresa.</p>
      <ul className="space-y-3">
        {PLATFORMS.map(({ key, label, icon: Icon }) => {
          const connectedCount = accounts.filter((a) => a.platform === key).length;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onPick(key)}
                className="flex min-h-14 w-full items-center gap-3 rounded-card border border-border px-4 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon size={20} />
                </span>
                <span className="flex-1 text-sm font-medium text-text">{label}</span>
                {connectedCount > 0 && (
                  <Badge tone="success"><Check size={16} aria-hidden />{connectedCount > 1 ? `${connectedCount} conectadas` : 'Conectada'}</Badge>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

/** Confirmación antes de desvincular una cuenta. */
export function DisconnectModal({ account, busy, onClose, onConfirm }: {
  account: SocialAccountInfo | null;
  busy: boolean;
  onClose(): void;
  onConfirm(): void;
}) {
  return (
    <Modal
      open={account !== null}
      onClose={onClose}
      title={account ? `¿Desvincular ${account.username}?` : 'Desvincular cuenta'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" loading={busy} onClick={onConfirm}>{busy ? 'Desvinculando...' : 'Desvincular'}</Button>
        </>
      }
    >
      <p className="text-text-muted">
        Dejará de leer y responder comentarios y mensajes de esta cuenta. Podrás volver a conectarla cuando quieras.
      </p>
    </Modal>
  );
}
