'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { businessApi } from '../lib/api-client';

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
    <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-border space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-text font-warike">Ranking del equipo</h3>
          <p className="text-xs font-bold text-text-muted">Ponle a cada dispositivo el nombre de quien lo usa (toca el nombre) y verás quién consigue más opiniones.</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-black" aria-label="Periodo">
          <option value={7}>7 días</option>
          <option value={30}>30 días</option>
          <option value={90}>90 días</option>
        </select>
      </div>

      <ol className="space-y-3">
        {rows.map((row, i) => (
          <li key={row.id} className="rounded-2xl bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-6 text-center text-sm font-black text-text-muted">{i + 1}</span>
                {editing === row.id ? (
                  <input
                    autoFocus
                    value={draft}
                    maxLength={60}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => rename(row)}
                    onKeyDown={(e) => { if (e.key === 'Enter') rename(row); if (e.key === 'Escape') setEditing(null); }}
                    className="input-premium py-2 text-sm"
                  />
                ) : (
                  <button onClick={() => { setEditing(row.id); setDraft(row.name); }} className="truncate text-left text-sm font-black text-text hover:underline" title="Cambiar nombre">
                    {row.name}
                  </button>
                )}
              </div>
              <p className="shrink-0 text-xs font-bold text-text-muted">
                <b className="text-text">{row.opinions}</b> opiniones · {row.positive} de 4-5 ⭐ · {row.scans} escaneos
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(row.opinions / top) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
