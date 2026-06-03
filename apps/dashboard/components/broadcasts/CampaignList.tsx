'use client';

import React from 'react';
import { Broadcast, BroadcastStatus } from '../../hooks/useBroadcasts';

const STATUS_COLOR: Record<BroadcastStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  SENDING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<BroadcastStatus, string> = {
  DRAFT: 'Borrador', SCHEDULED: 'Programado', SENDING: 'Enviando',
  COMPLETED: 'Completado', FAILED: 'Fallido',
};

interface CampaignListProps {
  broadcasts: Broadcast[];
  onSend: (id: string) => void;
  onNew: () => void;
}

export function CampaignList({ broadcasts, onSend, onNew }: CampaignListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-800">Campañas WhatsApp</h2>
        <button onClick={onNew} className="px-5 py-2.5 bg-[#F26122] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all">
          + Nueva Campaña
        </button>
      </div>

      {broadcasts.length === 0 ? (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-16 text-center space-y-3">
          <p className="text-5xl">📢</p>
          <p className="font-black text-gray-700 text-lg">No hay campañas de WhatsApp aún</p>
          <p className="text-sm text-gray-400">Crea tu primera campaña masiva para llegar a tus clientes</p>
          <button onClick={onNew} className="mt-2 px-6 py-3 bg-[#F26122] text-white text-xs font-black rounded-xl hover:opacity-90 transition-all">
            + Nueva Campaña
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map(b => (
            <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-gray-900 text-sm">{b.campaignName}</h3>
                  <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${STATUS_COLOR[b.status]}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{b.templateBody}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold">
                  <span>{b.messagesSent} enviados</span>
                  {b.whatsappNumber && <span>· {b.whatsappNumber.phoneNumber}</span>}
                  <span>· {new Date(b.createdAt).toLocaleDateString('es-PE')}</span>
                </div>
              </div>
              {b.status === 'DRAFT' && (
                <button
                  onClick={() => onSend(b.id)}
                  className="shrink-0 ml-4 px-4 py-2 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition-all"
                >
                  ▶ Enviar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
