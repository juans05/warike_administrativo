'use client';

import { ArrowLeftRight, Check, Clock, Trash2 } from 'lucide-react';
import { Badge, Button } from '../../ui';

export type WaNumber = {
  id: string;
  phoneNumber: string;
  phoneNumberId: string;
  provider?: 'meta' | 'plazbot';
  isActive: boolean;
  verificationStatus: string;
  createdAt: string;
};

export function NumbersList({ numbers, onSetProvider, onDelete }: {
  numbers: WaNumber[];
  onSetProvider(number: WaNumber, provider: 'meta' | 'plazbot'): void;
  onDelete(numberId: string): void;
}) {
  return (
    <ul className="space-y-2">
      {numbers.map((num) => {
        const viaMeta = num.provider === 'meta';
        return (
          <li key={num.id} className="flex flex-col gap-3 rounded-card border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">{num.phoneNumber}</p>
              <p className="break-all font-mono text-xs text-text-muted">Identificador: {num.phoneNumberId}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {num.isActive ? (
                  <Badge tone="success"><Check size={16} aria-hidden />Activo</Badge>
                ) : (
                  <Badge tone="warning"><Clock size={16} aria-hidden />Pendiente</Badge>
                )}
                <Badge tone={viaMeta ? 'primary' : 'neutral'}>{viaMeta ? 'API de Meta' : 'PlazBot'}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" icon={ArrowLeftRight} onClick={() => onSetProvider(num, viaMeta ? 'plazbot' : 'meta')}>
                {viaMeta ? 'Volver a PlazBot' : 'Pasar a API de Meta'}
              </Button>
              <Button size="sm" variant="ghost" icon={Trash2} className="text-danger hover:text-danger" aria-label={`Eliminar ${num.phoneNumber}`} onClick={() => onDelete(num.id)}>
                Eliminar
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
