'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicAgendaApi } from '../../../../lib/api-client';
import { STATUS, longDate, time12 } from '../../../../lib/agenda';
import { Badge, Button } from '../../../../components/ui';

/** "Mi cita": el cliente la ve y puede cancelarla (solo si sigue reservada y aún no empieza). */
export default function MiCitaPage() {
  const { token } = useParams<{ token: string }>();
  const [appt, setAppt] = useState<any>(null);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);

  useEffect(() => { publicAgendaApi.byToken(token).then(setAppt).catch(() => setError('No encontramos esta cita.')); }, [token]);

  const cancel = async () => {
    setCanceling(true); setError('');
    try { setAppt(await publicAgendaApi.cancel(token)); } catch (err: any) { setError(err.message); } finally { setCanceling(false); }
  };
  const canCancel = appt?.status === 'RESERVADA' && new Date(appt.startsAt) > new Date();

  return (
    <main className="panel-ui min-h-dvh bg-background px-4 py-6">
      <div className="mx-auto max-w-md rounded-card border border-border bg-surface p-5 shadow-card">
        {!appt ? (
          <p className="text-center text-text-muted">{error || 'Cargando...'}</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-muted">{appt.place?.name}</p>
            <h1 className="text-xl font-semibold text-text">Tu cita</h1>
            <Badge tone={appt.status === 'RESERVADA' ? 'primary' : appt.status === 'CANCELADA' ? 'neutral' : 'success'}>{STATUS[appt.status]?.label}</Badge>
            <p className="text-text">{appt.serviceName} con {appt.professional?.name}{appt.professional?.station ? ` (${appt.professional.station})` : ''}</p>
            <p className="text-lg font-semibold capitalize text-text">{longDate(appt.date)}, {time12(appt.time)}</p>
            {appt.place?.address && <p className="text-sm text-text-muted">{appt.place.address}</p>}
            {error && <p className="text-sm text-danger">{error}</p>}
            {canCancel && <Button variant="secondary" className="w-full" loading={canceling} onClick={cancel}>Cancelar mi cita</Button>}
          </div>
        )}
      </div>
    </main>
  );
}
