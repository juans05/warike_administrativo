'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CalendarCheck2, Check, ChevronLeft } from 'lucide-react';
import { publicAgendaApi } from '../../../lib/api-client';
import { addDays, longDate, shortDate, soles, time12, todayLima } from '../../../lib/agenda';
import { Button, Input } from '../../../components/ui';
import { AssetFields, emptyAsset } from '../../../components/agenda/AssetFields';
import { SlotPicker } from '../../../components/agenda/SlotPicker';
import { Avatar } from '../../../components/agenda/ProfessionalsSheet';

const ANY = 'any';
const DAYS_SHOWN = 14;

/** Reserva pública: servicio → profesional (o cualquiera) → día → hora libre → datos → confirmar. */
export default function ReservarPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [proId, setProId] = useState<string | null>(null);
  const [date, setDate] = useState(todayLima());
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ customerName: '', customerPhone: '' });
  // Veterinaria / taller: qué mascota o vehículo se atiende (se guarda en la ficha del cliente).
  const [asset, setAsset] = useState(emptyAsset());
  const [sending, setSending] = useState(false);
  const [booked, setBooked] = useState<any>(null);

  useEffect(() => {
    publicAgendaApi.info(placeId).then(setInfo).catch(() => setError('Este local no tiene reservas en línea por ahora.'));
  }, [placeId]);
  useEffect(() => {
    if (!serviceId || !proId) return;
    setLoadingSlots(true); setTime(null);
    publicAgendaApi.availability(placeId, serviceId, date, proId === ANY ? null : proId)
      .then((a: any) => setSlots(proId === ANY ? a.any : a.professionals[0]?.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [placeId, serviceId, proId, date]);

  const service = info?.services.find((s: any) => s.id === serviceId);
  const able = info?.professionals.filter((p: any) => !p.serviceIds?.length || p.serviceIds.includes(serviceId)) ?? [];
  const pro = able.find((p: any) => p.id === proId);
  const step = !serviceId ? 1 : !proId ? 2 : !time ? 3 : 4;

  const book = async () => {
    setSending(true); setError('');
    try {
      setBooked(await publicAgendaApi.book(placeId, { serviceId: serviceId!, professionalId: proId === ANY ? null : proId, date, time: time!, ...form, ...(info.assetKind && asset.name.trim() ? { assetName: asset.name, assetData: asset.data } : {}) }));
    } catch (err: any) { setError(err.message); } finally { setSending(false); }
  };

  if (error && !info) return <Shell><p className="text-center text-text">{error}</p></Shell>;
  if (!info) return <Shell><p className="text-center text-text-muted">Cargando...</p></Shell>;

  if (booked) {
    const link = `/reservar/cita/${booked.publicToken}`;
    return (
      <Shell place={info.place}>
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success"><CalendarCheck2 size={28} aria-hidden /></span>
          <h1 className="text-xl font-semibold text-text">¡Tu cita está reservada!</h1>
          <p className="text-text">{booked.serviceName} con {booked.professional?.name}{booked.professional?.station ? ` (${booked.professional.station})` : ''}</p>
          <p className="text-lg font-semibold capitalize text-text">{longDate(booked.date)}, {time12(booked.time)}</p>
          <p className="text-sm text-text-muted">Guarda este enlace para ver o cancelar tu cita:</p>
          <a href={link} className="block break-all text-sm font-medium text-primary-hover underline">{typeof window !== 'undefined' ? window.location.origin : ''}{link}</a>
        </div>
      </Shell>
    );
  }

  return (
    <Shell place={info.place}>
      <ol className="mb-6 flex justify-between text-xs text-text-muted" aria-label="Pasos">
        {['Servicio', 'Profesional', 'Horario', 'Tus datos'].map((s, i) => (
          <li key={s} className={i + 1 <= step ? 'font-semibold text-primary-hover' : ''}>{i + 1}. {s}</li>
        ))}
      </ol>

      {step === 1 && (
        <Section title="¿Qué servicio quieres?">
          {info.services.length === 0 && <p className="text-sm text-text-muted">Este local todavía no publicó sus servicios.</p>}
          {info.services.map((s: any) => (
            <Choice key={s.id} onClick={() => setServiceId(s.id)} title={s.name} subtitle={`${s.durationMin} min · ${soles(s.price)}`} />
          ))}
        </Section>
      )}

      {step === 2 && (
        <Section title="¿Con quién te atiendes?" onBack={() => setServiceId(null)}>
          <Choice onClick={() => setProId(ANY)} title="Cualquiera disponible" subtitle="Te asignamos a quien tenga el horario libre" />
          {able.map((p: any) => (
            <Choice key={p.id} onClick={() => setProId(p.id)} title={p.name} subtitle={p.station ?? ''} avatar={<Avatar name={p.name} photo={p.photoUrl} />} />
          ))}
        </Section>
      )}

      {step >= 3 && (
        <Section title={`${service?.name} · ${proId === ANY ? 'cualquiera' : pro?.name}`} onBack={() => { setProId(null); setTime(null); }}>
          <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Día">
            {Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(todayLima(), i)).map((d) => (
              <button key={d} type="button" role="radio" aria-checked={date === d} onClick={() => setDate(d)}
                className={`min-h-12 shrink-0 rounded-control border px-3 text-sm capitalize ${date === d ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-text'}`}>
                {shortDate(d)}
              </button>
            ))}
          </div>
          <SlotPicker slots={slots} value={time} onChange={setTime} loading={loadingSlots} />
        </Section>
      )}

      {step === 4 && (
        <Section title="Tus datos">
          <Input label="Tu nombre" value={form.customerName} maxLength={120} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <Input label="Tu celular" type="tel" inputMode="tel" placeholder="9XX XXX XXX" value={form.customerPhone} maxLength={20} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
          {info.assetKind && <AssetFields kind={info.assetKind} value={asset} onChange={setAsset} compact />}
          <p className="rounded-control bg-background p-3 text-sm capitalize text-text">{service?.name} · {longDate(date)}, {time12(time!)}</p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" icon={Check} loading={sending} disabled={form.customerName.trim().length < 2 || form.customerPhone.replace(/\D/g, '').length < 7 || (info.assetKind && !asset.name.trim())} onClick={book}>
            Reservar cita
          </Button>
        </Section>
      )}
    </Shell>
  );
}

function Shell({ place, children }: { place?: any; children: React.ReactNode }) {
  return (
    <main className="panel-ui min-h-dvh bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        {place && (
          <header className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {place.logoUrl && <img src={place.logoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <div>
              <p className="text-lg font-semibold text-text">{place.name}</p>
              <p className="text-sm text-text-muted">Reserva tu cita</p>
            </div>
          </header>
        )}
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">{children}</div>
        <p className="text-center text-xs text-text-muted">Reservas con Wuarikes</p>
      </div>
    </main>
  );
}

function Section({ title, onBack, children }: { title: string; onBack?: () => void; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {onBack && <button type="button" onClick={onBack} aria-label="Volver" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-background"><ChevronLeft size={20} aria-hidden /></button>}
        <h1 className="text-base font-semibold text-text">{title}</h1>
      </div>
      {children}
    </section>
  );
}

function Choice({ title, subtitle, avatar, onClick }: { title: string; subtitle?: string; avatar?: React.ReactNode; onClick(): void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-3 rounded-control border border-border bg-surface px-3 py-2 text-left hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      {avatar}
      <span className="min-w-0">
        <span className="block font-medium text-text">{title}</span>
        {subtitle && <span className="block text-sm text-text-muted">{subtitle}</span>}
      </span>
    </button>
  );
}
