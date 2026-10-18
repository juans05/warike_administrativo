'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';
import { Card, Select, controlStyles } from './ui';

type Row = { id: string; name: string; scans: number; opinions: number; positive: number };

// Un dispositivo por mesero o zona: el ranking cuenta las opiniones que consigue cada uno.
export default function TeamRanking({ placeId }: { placeId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [days, setDays] = useState(30);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const load = useCallback(() => {
    businessApi.getDeviceRanking(placeId, days).then(setRows).catch(() => setRows([]));
  }, [placeId, days]);
  useEffect(load, [load]);

  if (!rows || rows.length === 0) return null;

  const top = Math.max(1, ...rows.map((r) => r.opinions));

  const rename = async (row: Row) => {
    const name = draft.trim();
    setEditing(null);
    if (!name || name === row.name) return;
    try {
      await businessApi.updateDevice(placeId, row.id, { name });
      load();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo cambiar el nombre');
    }
  };

  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text">Ranking del equipo</h3>
            <p className="text-sm text-text-muted">Ponle a cada dispositivo el nombre de quien lo usa (toca el nombre) y verás quién consigue más opiniones.</p>
          </div>
        </div>
        <div className="w-32">
          <Select label="Período" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
          </Select>
        </div>
      </div>

      <ol className="space-y-3">
        {rows.map((row, i) => (
          <li key={row.id} className="rounded-card bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-6 text-center text-sm font-semibold tabular-nums text-text-muted">{i + 1}</span>
                {editing === row.id ? (
                  <input
                    autoFocus
                    value={draft}
                    maxLength={60}
                    aria-label="Nombre del dispositivo"
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => rename(row)}
                    onKeyDown={(e) => { if (e.key === 'Enter') rename(row); if (e.key === 'Escape') setEditing(null); }}
                    className={controlStyles(undefined, 'h-10')}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditing(row.id); setDraft(row.name); }}
                    className="min-h-11 truncate rounded-control text-left text-sm font-medium text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    title="Cambiar nombre"
                  >
                    {row.name}
                  </button>
                )}
              </div>
              <p className="shrink-0 text-sm tabular-nums text-text-muted">
                <b className="text-text">{row.opinions}</b> opiniones · {row.positive} de 4-5 estrellas · {row.scans} escaneos
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(row.opinions / top) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
