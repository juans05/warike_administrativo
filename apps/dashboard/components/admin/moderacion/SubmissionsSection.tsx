import { Check, PartyPopper, Store, X } from 'lucide-react';
import { Button, DataList, EmptyState } from '../../ui';
import { SectionCard } from '../SectionCard';
import type { PlaceSubmission } from './types';

export function SubmissionsSection({ submissions, onApprove, onReject }: {
  submissions: PlaceSubmission[];
  onApprove(id: string): void;
  onReject(id: string): void;
}) {
  return (
    <SectionCard title="Propuestas pendientes" subtitle={`${submissions.length} locales enviados por usuarios esperan revisión`}>
      <div className="px-4">
        <DataList
          items={submissions}
          empty={<EmptyState icon={PartyPopper} headingLevel="h3" title="No hay propuestas pendientes" description="Todo lo que enviaron los usuarios ya fue revisado." />}
          renderItem={(s) => (
            <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {s.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.coverImageUrl} alt="" className="h-11 w-11 shrink-0 rounded-control border border-border object-cover" />
                ) : (
                  <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
                    <Store size={20} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{s.name}</p>
                  <p className="truncate text-xs text-text-muted">
                    {[s.category?.name, s.district, s.address].filter(Boolean).join(' · ')}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    Enviado por {s.submittedBy?.fullName || '—'}{s.submittedBy?.email && ` · ${s.submittedBy.email}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" icon={Check} onClick={() => onApprove(s.id)}>Aprobar</Button>
                <Button size="sm" variant="secondary" icon={X} className="text-danger" onClick={() => onReject(s.id)}>Rechazar</Button>
              </div>
            </div>
          )}
        />
      </div>
    </SectionCard>
  );
}
