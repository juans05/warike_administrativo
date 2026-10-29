'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { businessApi, teamApi } from '../lib/api-client';
import { Badge, Button, Card, Input, Select, controlStyles } from './ui';

type Row = {
  id: string;
  name: string;
  scans: number;
  opinions: number;
  positive: number;
  teamMemberId: string | null;
  memberName: string | null;
  weeklyGoal: number | null;
  weekOpinions: number;
  weekScans: number;
};

// Un dispositivo por mesero o zona: el ranking y la meta semanal cuentan opiniones (cualquier calificación),
// nunca reseñas de Google ni estrellas (Google prohíbe fijar al personal cuotas de reseñas).
export default function TeamRanking({ placeId }: { placeId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [days, setDays] = useState(30);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [members, setMembers] = useState<{ id: string; fullName: string }[]>([]);
  const [configuring, setConfiguring] = useState<string | null>(null);

  const load = useCallback(() => {
    businessApi.getDeviceRanking(placeId, days).then(setRows).catch(() => setRows([]));
  }, [placeId, days]);
  useEffect(load, [load]);

  // Solo supervisor+ puede listar el equipo; si falla, no se muestra el selector.
  useEffect(() => {
    teamApi.list(placeId).then((r) => setMembers(r?.data ?? [])).catch(() => setMembers([]));
  }, [placeId]);

  if (!rows || rows.length === 0) return null;

  const top = Math.max(1, ...rows.map((r) => r.opinions));
  const leader = rows
    .filter((r) => r.weekOpinions > 0)
    .sort((a, b) => b.weekOpinions - a.weekOpinions || b.weekScans - a.weekScans || a.name.localeCompare(b.name))[0];

  const save = async (row: Row, data: { name?: string; teamMemberId?: string | null; weeklyGoal?: number | null }, errorText: string) => {
    try {
      await businessApi.updateDevice(placeId, row.id, data);
      load();
    } catch (err: any) {
      toast.error(err?.message || errorText);
    }
  };

  const rename = (row: Row) => {
    const name = draft.trim();
    setEditing(null);
    if (!name || name === row.name) return;
    save(row, { name }, 'No se pudo cambiar el nombre');
  };

  const saveGoal = (row: Row, value: string) => {
    const n = value.trim() === '' ? null : Math.round(Number(value));
    if (n !== null && (!Number.isFinite(n) || n < 1 || n > 500)) {
      toast.error('La meta debe estar entre 1 y 500');
      return;
    }
    if (n === row.weeklyGoal) return;
    save(row, { weeklyGoal: n }, 'No se pudo guardar');
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
            <p className="text-sm text-text-muted">
              Asigna cada dispositivo a quien lo usa y ponle una meta semanal. La meta cuenta opiniones, sin importar las estrellas: invita a todos a opinar.
            </p>
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
                    className="min-h-11 truncate rounded-control text-left text-sm font-medium text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    title="Cambiar nombre del dispositivo"
                  >
                    {row.memberName ?? row.name}
                  </button>
                )}
                {leader?.id === row.id && <Badge tone="success">Líder de la semana</Badge>}
              </div>
              <p className="shrink-0 text-sm tabular-nums text-text-muted">
                <b className="text-text">{row.opinions}</b> opiniones · {row.positive} de 4-5 estrellas · {row.scans} escaneos
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(row.opinions / top) * 100}%` }} />
            </div>

            {row.weeklyGoal ? (
              <>
                <p className="mt-3 text-sm tabular-nums text-text-muted">{row.weekOpinions} / {row.weeklyGoal} opiniones esta semana</p>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-success" style={{ width: `${Math.min(100, (row.weekOpinions / row.weeklyGoal) * 100)}%` }} />
                </div>
              </>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              aria-expanded={configuring === row.id}
              onClick={() => setConfiguring(configuring === row.id ? null : row.id)}
            >
              {configuring === row.id ? 'Cerrar' : 'Asignar y meta'}
            </Button>
            {configuring === row.id && (
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {members.length > 0 && (
                  <Select
                    label="Miembro del equipo"
                    value={row.teamMemberId ?? ''}
                    onChange={(e) => save(row, { teamMemberId: e.target.value || null }, 'No se pudo guardar')}
                  >
                    <option value="">Sin asignar</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </Select>
                )}
                <Input
                  label="Meta semanal de opiniones"
                  type="number"
                  min={1}
                  max={500}
                  placeholder="Sin meta"
                  defaultValue={row.weeklyGoal ?? ''}
                  onBlur={(e) => saveGoal(row, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveGoal(row, (e.target as HTMLInputElement).value); }}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
