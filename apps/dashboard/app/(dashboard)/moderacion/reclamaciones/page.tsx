'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { adminApi } from '../../../../lib/api-client';
import { toast } from 'sonner';
import { EmptyState, InboxLayout, PageHeader } from '../../../../components/ui';
import { ComplaintDetail } from '../../../../components/admin/reclamaciones/ComplaintDetail';
import { ComplaintList, type ComplaintTab } from '../../../../components/admin/reclamaciones/ComplaintList';
import type { Complaint } from '../../../../components/admin/reclamaciones/types';

export default function ReclamacionesPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ComplaintTab>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Error loading complaints:', err);
      toast.error('No se pudieron cargar los reclamos');
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
      setSelectedId(null);
      loadData();
    } catch (err) {
      toast.error('Error registrando la respuesta');
    }
  };

  const pending = complaints.filter((c) => c.status === 'pending');
  const resolved = complaints.filter((c) => c.status === 'resolved');
  const selected = complaints.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Libro de reclamaciones"
        subtitle="Reclamos y quejas recibidos por el formulario público. Debes responder dentro de 15 días hábiles improrrogables (art. 24.1 del Código de Consumo)."
      />
      <InboxLayout
        list={
          <ComplaintList
            complaints={tab === 'pending' ? pending : resolved}
            pendingCount={pending.length}
            resolvedCount={resolved.length}
            tab={tab}
            onTab={(next) => { setTab(next); setSelectedId(null); }}
            loading={loading}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        }
        detail={selected && <ComplaintDetail key={selected.id} complaint={selected} onResolve={resolveComplaint} />}
        emptyDetail={
          <div className="flex h-full items-center justify-center">
            <EmptyState icon={BookOpen} title="Selecciona un reclamo" description="Verás el detalle completo y podrás registrar tu respuesta." />
          </div>
        }
        onCloseDetail={() => setSelectedId(null)}
      />
    </div>
  );
}
