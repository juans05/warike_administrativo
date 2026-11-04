'use client';

import { Check, Clock, Trash2 } from 'lucide-react';
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

export function NumbersList({ numbers, onDelete }: {
  numbers: WaNumber[];
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
                {viaMeta
                  ? <Badge tone="primary">Facebook</Badge>
                  : <Badge tone="warning">Antiguo, no envía: conéctalo con Facebook</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
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
