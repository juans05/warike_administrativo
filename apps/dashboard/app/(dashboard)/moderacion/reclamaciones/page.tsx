'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../../lib/api-client';
import { SkeletonPage } from '../../../../components/SkeletonLoader';
import { toast } from 'sonner';

interface Complaint {
  id: string;
  folio: string;
  type: 'reclamo' | 'queja';
  status: 'pending' | 'resolved';
  consumerFullName: string;
  consumerDocumentType: string;
  consumerDocumentNumber: string;
  consumerEmail: string;
  consumerPhone: string | null;
  consumerAddress: string;
  contractedGood: string;
  claimedAmount: number | null;
  detail: string;
  consumerRequest: string;
  providerResponse: string | null;
  createdAt: string;
}

function ResolveModal({ complaint, onClose, onConfirm }: { complaint: Complaint; onClose: () => void; onConfirm: (response: string) => void }) {
  const [response, setResponse] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-black text-[#1A1A1A] mb-1">Responder {complaint.folio}</h2>
        <p className="text-sm text-gray-500 mb-4">{complaint.consumerFullName} · {complaint.type === 'reclamo' ? 'Reclamo' : 'Queja'}</p>

        <div className="bg-[#F7F8FA] rounded-2xl p-4 text-sm text-gray-700 mb-4 space-y-2">
          <p><span className="font-black text-gray-400 text-[10px] uppercase tracking-widest block">Bien contratado</span>{complaint.contractedGood}</p>
          <p><span className="font-black text-gray-400 text-[10px] uppercase tracking-widest block">Detalle</span>{complaint.detail}</p>
          <p><span className="font-black text-gray-400 text-[10px] uppercase tracking-widest block">Pedido concreto</span>{complaint.consumerRequest}</p>
        </div>

        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Acciones adoptadas por el proveedor</label>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={4}
          placeholder="Describe la respuesta dada al consumidor y las acciones tomadas."
          className="w-full bg-[#F7F8FA] rounded-2xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-50 resize-none"
        />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(response)}
            disabled={!response.trim()}
            className="px-5 py-3 rounded-2xl text-sm font-bold bg-green-50 text-green-600 disabled:opacity-40"
          >
            Marcar como resuelto
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReclamacionesPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveTarget, setResolveTarget] = useState<Complaint | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Error loading complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resolveComplaint = async (id: string, response: string) => {
    try {
      await adminApi.resolveComplaint(id, response);
      toast.success('Respuesta registrada');
      setResolveTarget(null);
      loadData();
    } catch (err) {
      toast.error('Error registrando la respuesta');
    }
  };

  if (loading) return <SkeletonPage type="table" />;

  const pending = complaints.filter((c) => c.status === 'pending');
  const resolved = complaints.filter((c) => c.status === 'resolved');

  return (
    <div className="space-y-12 pb-20 max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Libro de Reclamaciones</h1>
        <p className="text-[#6B7280] font-medium max-w-lg">Reclamos y quejas recibidos a través del formulario público. Debes responder dentro de 30 días calendario.</p>
      </header>

      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-50">
          <h2 className="text-xl font-black text-[#1A1A1A]">Pendientes de respuesta</h2>
          <p className="text-sm text-gray-500 mt-1">{pending.length} en espera</p>
        </div>
        {pending.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-bold">No hay reclamos pendientes 🎉</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-gray-100">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Consumidor</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pending.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-6 font-bold text-[#1A1A1A] font-mono text-sm">{c.folio}</td>
                    <td className="px-10 py-6">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${c.type === 'reclamo' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        {c.type === 'reclamo' ? 'Reclamo' : 'Queja'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-bold text-gray-700">{c.consumerFullName}</p>
                      <p className="text-xs text-gray-400 font-medium">{c.consumerEmail}</p>
                    </td>
                    <td className="px-10 py-6 text-sm text-gray-500 font-medium">
                      {new Date(c.createdAt).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() => setResolveTarget(c)}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-green-50 text-green-600 hover:bg-green-100"
                      >
                        Responder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {resolved.length > 0 && (
        <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-gray-50">
            <h2 className="text-xl font-black text-[#1A1A1A]">Resueltos</h2>
            <p className="text-sm text-gray-500 mt-1">{resolved.length} respondidos</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-gray-100">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Consumidor</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Respuesta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resolved.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-6 font-bold text-[#1A1A1A] font-mono text-sm">{c.folio}</td>
                    <td className="px-10 py-6 text-sm font-bold text-gray-700">{c.consumerFullName}</td>
                    <td className="px-10 py-6 text-sm text-gray-500">{c.providerResponse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {resolveTarget && (
        <ResolveModal
          complaint={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onConfirm={(response) => resolveComplaint(resolveTarget.id, response)}
        />
      )}
    </div>
  );
}
