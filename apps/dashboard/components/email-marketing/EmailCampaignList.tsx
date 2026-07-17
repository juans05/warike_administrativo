'use client';

import React from 'react';
import { EmailCampaign, EmailCampaignStatus } from '../../hooks/useEmailCampaigns';

const STATUS_COLOR: Record<EmailCampaignStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  SENDING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<EmailCampaignStatus, string> = {
  DRAFT: 'Borrador', SCHEDULED: 'Programado', SENDING: 'Enviando', COMPLETED: 'Completado', FAILED: 'Fallido',
};

interface EmailCampaignListProps {
  campaigns: EmailCampaign[];
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

export function EmailCampaignList({ campaigns, audienceCount, sendingId, completingId, unschedulingId, deletingId, onSend, onComplete, onUnschedule, onEdit, onDelete, onNew }: EmailCampaignListProps) {
  const handleSendClick = (campaign: EmailCampaign) => {
    const confirmed = window.confirm(
      `¿Enviar "${campaign.campaignName}" a ${audienceCount} cliente${audienceCount === 1 ? '' : 's'}? Esta acción no se puede deshacer.`
    );
    if (confirmed) onSend(campaign.id);
  };

  const handleDeleteClick = (campaign: EmailCampaign) => {
    const confirmed = window.confirm(`¿Eliminar la campaña "${campaign.campaignName}"? Esta acción no se puede deshacer.`);
    if (confirmed) onDelete(campaign.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-800">Campañas de Email</h2>
        <button onClick={onNew} className="px-5 py-2.5 bg-[#F26122] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all">
          + Nueva Campaña
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-16 text-center space-y-3">
          <p className="text-5xl">📧</p>
          <p className="font-black text-gray-700 text-lg">No hay campañas de email aún</p>
          <p className="text-sm text-gray-400">Crea tu primera campaña para llegar a tus clientes por correo</p>
          <button onClick={onNew} className="mt-2 px-6 py-3 bg-[#F26122] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all">
            + Nueva Campaña
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-gray-900 text-sm">{c.campaignName}</h3>
                  <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${STATUS_COLOR[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{c.subject}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold">
                  <span>{c.emailsSent}{c.totalRecipients > 0 ? `/${c.totalRecipients}` : ''} enviados</span>
                  {c.status === 'SCHEDULED' && c.scheduledAt && (
                    <span>· 🕐 Programado para {new Date(c.scheduledAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  )}
                  <span>· {new Date(c.createdAt).toLocaleDateString('es-PE')}</span>
                </div>
              </div>
              <div className="shrink-0 ml-4 flex items-center gap-2">
                {c.status === 'DRAFT' && (
                  <button
                    onClick={() => handleSendClick(c)}
                    disabled={sendingId === c.id}
                    className="px-4 py-2 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    {sendingId === c.id ? 'Enviando...' : '▶ Enviar'}
                  </button>
                )}
                {c.status === 'SCHEDULED' && (
                  <button
                    onClick={() => onUnschedule(c.id)}
                    disabled={unschedulingId === c.id}
                    className="px-3 py-2 border border-gray-200 text-gray-500 text-[10px] font-black rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    {unschedulingId === c.id ? '...' : 'Cancelar programación'}
                  </button>
                )}
                {c.status === 'SENDING' && (
                  <button
                    onClick={() => onComplete(c.id)}
                    disabled={completingId === c.id}
                    className="px-3 py-2 border border-gray-200 text-gray-500 text-[10px] font-black rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    {completingId === c.id ? '...' : 'Marcar como completada'}
                  </button>
                )}
                {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                  <button
                    onClick={() => onEdit(c)}
                    title="Editar campaña"
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    ✏️
                  </button>
                )}
                {c.status !== 'SENDING' && (
                  <button
                    onClick={() => handleDeleteClick(c)}
                    disabled={deletingId === c.id}
                    title="Eliminar campaña"
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    {deletingId === c.id ? '...' : '🗑️'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
