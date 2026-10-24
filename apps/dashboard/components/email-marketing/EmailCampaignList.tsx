'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Clock, FileText, Mail, Pencil, Plus, Send, Trash2, type LucideIcon } from 'lucide-react';
import { EmailCampaign, EmailCampaignStatus } from '../../hooks/useEmailCampaigns';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';
import { Badge, type BadgeProps, Button, Card, DataList, EmptyState } from '../ui';

const STATUS: Record<EmailCampaignStatus, { label: string; tone: BadgeProps['tone']; icon: LucideIcon }> = {
  DRAFT: { label: 'Borrador', tone: 'neutral', icon: FileText },
  SCHEDULED: { label: 'Programado', tone: 'primary', icon: Clock },
  SENDING: { label: 'Enviando', tone: 'warning', icon: Send },
  COMPLETED: { label: 'Completado', tone: 'success', icon: CheckCircle2 },
  FAILED: { label: 'Fallido', tone: 'danger', icon: AlertCircle },
};

interface EmailCampaignListProps {
  campaigns: EmailCampaign[];
  loading?: boolean;
  audienceCount: number;
  sendingId: string | null;
  completingId: string | null;
  unschedulingId: string | null;
  deletingId: string | null;
  onSend: (id: string) => void;
  onComplete: (id: string) => void;
  onUnschedule: (id: string) => void;
  onEdit: (campaign: EmailCampaign) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function EmailCampaignList({ campaigns, loading, audienceCount, sendingId, completingId, unschedulingId, deletingId, onSend, onComplete, onUnschedule, onEdit, onDelete, onNew }: EmailCampaignListProps) {
  const { customer, customers } = useCustomerLabels();

  const handleSendClick = (campaign: EmailCampaign) => {
    const confirmed = window.confirm(
      `¿Enviar "${campaign.campaignName}" a ${audienceCount} ${audienceCount === 1 ? customer : customers}? Esta acción no se puede deshacer.`
    );
    if (confirmed) onSend(campaign.id);
  };

  const handleDeleteClick = (campaign: EmailCampaign) => {
    const confirmed = window.confirm(`¿Eliminar la campaña "${campaign.campaignName}"? Esta acción no se puede deshacer.`);
    if (confirmed) onDelete(campaign.id);
  };

  return (
    <Card padding="sm">
      <DataList
        items={campaigns}
        loading={loading}
        empty={
          <EmptyState
            icon={Mail}
            title="No hay campañas de email aún"
            description={`Crea tu primera campaña para llegar a tus ${customers} por correo.`}
            action={<Button variant="secondary" icon={Plus} onClick={onNew}>Nueva campaña</Button>}
          />
        }
        renderItem={c => {
          const status = STATUS[c.status];
          return (
            <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-text">{c.campaignName}</h3>
                  <Badge tone={status.tone}><status.icon size={16} aria-hidden /> {status.label}</Badge>
                </div>
                <p className="truncate text-sm text-text-muted">{c.subject}</p>
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-text-muted tabular-nums">
                  <span>{c.emailsSent}{c.totalRecipients > 0 ? `/${c.totalRecipients}` : ''} enviados</span>
                  {c.status === 'SCHEDULED' && c.scheduledAt && (
                    <span className="inline-flex items-center gap-1">· <Clock size={16} aria-hidden /> Programado para {new Date(c.scheduledAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  )}
                  <span>· {new Date(c.createdAt).toLocaleDateString('es-PE')}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                {c.status === 'DRAFT' && (
                  <Button size="sm" icon={Send} onClick={() => handleSendClick(c)} loading={sendingId === c.id} disabled={audienceCount === 0} title={audienceCount === 0 ? 'Nadie aceptó recibir correos todavía' : undefined}>
                    {sendingId === c.id ? 'Enviando...' : 'Enviar'}
                  </Button>
                )}
                {c.status === 'SCHEDULED' && (
                  <Button size="sm" variant="secondary" onClick={() => onUnschedule(c.id)} loading={unschedulingId === c.id}>
                    Cancelar programación
                  </Button>
                )}
                {c.status === 'SENDING' && (
                  <Button size="sm" variant="secondary" onClick={() => onComplete(c.id)} loading={completingId === c.id}>
                    Marcar como completada
                  </Button>
                )}
                {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => onEdit(c)} aria-label={`Editar campaña ${c.campaignName}`} />
                )}
                {c.status !== 'SENDING' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                    onClick={() => handleDeleteClick(c)}
                    loading={deletingId === c.id}
                    aria-label={`Eliminar campaña ${c.campaignName}`}
                  />
                )}
              </div>
            </div>
          );
        }}
      />
    </Card>
  );
}
