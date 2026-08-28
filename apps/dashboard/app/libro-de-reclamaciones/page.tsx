'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { publicApi } from '../../lib/api-client';

const PROVIDER = {
  razonSocial: 'Wuarikes SAC',
  ruc: '20616350227',
  direccion: 'Micaela Bastidas 231',
};

type ComplaintType = 'reclamo' | 'queja';
type DocumentType = 'DNI' | 'CE' | 'Pasaporte' | 'RUC';

interface FormState {
  type: ComplaintType;
  consumerFullName: string;
  consumerDocumentType: DocumentType;
  consumerDocumentNumber: string;
  consumerAddress: string;
  consumerEmail: string;
  consumerPhone: string;
  contractedGood: string;
  claimedAmount: string;
  detail: string;
  consumerRequest: string;
}

const EMPTY_FORM: FormState = {
  type: 'reclamo',
  consumerFullName: '',
  consumerDocumentType: 'DNI',
  consumerDocumentNumber: '',
  consumerAddress: '',
  consumerEmail: '',
  consumerPhone: '',
  contractedGood: '',
  claimedAmount: '',
  detail: '',
  consumerRequest: '',
};

const inputClass = 'w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-sm outline-none focus:border-[var(--primary)]';
const labelClass = 'text-sm font-semibold text-[var(--text)]';

export default function LibroDeReclamacionesPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folio, setFolio] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { folio } = await publicApi.submitComplaint({
        type: form.type,
        consumerFullName: form.consumerFullName,
        consumerDocumentType: form.consumerDocumentType,
        consumerDocumentNumber: form.consumerDocumentNumber,
        consumerAddress: form.consumerAddress,
        consumerEmail: form.consumerEmail,
        consumerPhone: form.consumerPhone || undefined,
        contractedGood: form.contractedGood,
        claimedAmount: form.claimedAmount ? Number(form.claimedAmount) : undefined,
        detail: form.detail,
        consumerRequest: form.consumerRequest,
      });
      setFolio(folio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar tu reclamo. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (folio) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-10 text-center space-y-4">
          <h1 className="font-warike text-2xl font-bold text-[var(--text)]">¡Registrado!</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Tu {form.type === 'reclamo' ? 'reclamo' : 'queja'} quedó registrado en nuestro Libro de Reclamaciones. Te enviamos una constancia a tu correo.
          </p>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">N.º de folio</p>
            <p className="text-xl font-bold text-[var(--primary)] font-mono">{folio}</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Conforme a la normativa vigente, tenemos hasta 30 días calendario para darte una respuesta.
          </p>
          <Link href="/" className="inline-block mt-2 text-sm font-semibold text-[var(--primary)] hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-6">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="font-warike text-3xl font-bold text-[var(--text)]">Libro de Reclamaciones</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Conforme a lo establecido en el Código de Protección y Defensa del Consumidor.
          </p>
        </header>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Datos del proveedor</p>
          <p className="text-sm text-[var(--text)]"><strong>Razón social:</strong> {PROVIDER.razonSocial}</p>
          <p className="text-sm text-[var(--text)]"><strong>RUC:</strong> {PROVIDER.ruc}</p>
          <p className="text-sm text-[var(--text)]"><strong>Dirección:</strong> {PROVIDER.direccion}</p>
        </section>

        <section className="space-y-3">
          <p className={labelClass}>¿Qué deseas registrar?</p>
          <div className="flex gap-3">
            {(['reclamo', 'queja'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => update('type', option)}
                className={`flex-1 rounded-xl border p-3 text-sm font-semibold capitalize transition-colors ${
                  form.type === option
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Reclamo: disconformidad relacionada al producto o servicio. Queja: disconformidad no relacionada, o malestar respecto a la atención.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClass}>Nombres y apellidos / Razón social</label>
            <input
              required
              value={form.consumerFullName}
              onChange={(e) => update('consumerFullName', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Tipo de documento</label>
            <select
              value={form.consumerDocumentType}
              onChange={(e) => update('consumerDocumentType', e.target.value as DocumentType)}
              className={inputClass}
            >
              <option value="DNI">DNI</option>
              <option value="CE">Carné de extranjería</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="RUC">RUC</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>N.º de documento</label>
            <input
              required
              value={form.consumerDocumentNumber}
              onChange={(e) => update('consumerDocumentNumber', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClass}>Domicilio</label>
            <input
              required
              value={form.consumerAddress}
              onChange={(e) => update('consumerAddress', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Correo electrónico</label>
            <input
              required
              type="email"
              value={form.consumerEmail}
              onChange={(e) => update('consumerEmail', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Teléfono (opcional)</label>
            <input
              value={form.consumerPhone}
              onChange={(e) => update('consumerPhone', e.target.value)}
              className={inputClass}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClass}>Bien o servicio contratado</label>
            <input
              required
              placeholder="Ej: Plan Wuarike Fidelización+ (suscripción mensual)"
              value={form.contractedGood}
              onChange={(e) => update('contractedGood', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Monto reclamado (opcional, S/.)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.claimedAmount}
              onChange={(e) => update('claimedAmount', e.target.value)}
              className={inputClass}
            />
          </div>
        </section>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Detalle del {form.type}</label>
          <textarea
            required
            rows={4}
            value={form.detail}
            onChange={(e) => update('detail', e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Pedido concreto</label>
          <textarea
            required
            rows={3}
            value={form.consumerRequest}
            onChange={(e) => update('consumerRequest', e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[var(--primary)] text-white rounded-xl py-3.5 font-semibold hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50"
        >
          {submitting ? 'Enviando...' : `Registrar ${form.type}`}
        </button>
      </form>
    </div>
  );
}
