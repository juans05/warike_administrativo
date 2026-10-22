'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api-client';
import { toast } from 'sonner';
import { Button, Card, Input, PageHeader, Skeleton } from '../../../components/ui';

interface Settings {
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTiktok: string | null;
  socialX: string | null;
}

const EMPTY: Settings = {
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  socialInstagram: '',
  socialFacebook: '',
  socialTiktok: '',
  socialX: '',
};

type Field = { key: keyof Settings; label: string; type?: string; placeholder?: string };

const CONTACT_FIELDS: Field[] = [
  { key: 'contactEmail', label: 'Correo' },
  { key: 'contactPhone', label: 'Teléfono', type: 'tel' },
  { key: 'contactAddress', label: 'Dirección' },
];

const SOCIAL_FIELDS: Field[] = [
  { key: 'socialInstagram', label: 'Instagram (URL completa)', placeholder: 'https://instagram.com/warique_app' },
  { key: 'socialFacebook', label: 'Facebook (URL completa)', placeholder: 'https://facebook.com/warique' },
  { key: 'socialTiktok', label: 'TikTok (URL completa)', placeholder: 'https://tiktok.com/@warique' },
  { key: 'socialX', label: 'X / Twitter (URL completa)', placeholder: 'https://x.com/warique' },
];

export default function ConfiguracionPage() {
  const [form, setForm] = useState<Settings>(EMPTY);
  const [saved, setSaved] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getPlatformSettings()
      .then((data: Settings) => {
        const loaded = { ...EMPTY, ...data };
        setForm(loaded);
        setSaved(loaded);
      })
      .catch(() => toast.error('Error cargando la configuración'))
      .finally(() => setLoading(false));
  }, []);

  const dirty = (Object.keys(EMPTY) as (keyof Settings)[]).some((key) => (form[key] || '') !== (saved[key] || ''));

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updatePlatformSettings({
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        contactAddress: form.contactAddress || undefined,
        socialInstagram: form.socialInstagram || undefined,
        socialFacebook: form.socialFacebook || undefined,
        socialTiktok: form.socialTiktok || undefined,
        socialX: form.socialX || undefined,
      });
      setSaved(form);
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error('Error guardando la configuración');
    } finally {
      setSaving(false);
    }
  }

  const header = <PageHeader title="Configuración del sitio" subtitle="Datos de contacto y redes sociales que se muestran en la landing pública." />;

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6" aria-busy="true">
        {header}
        {[0, 1].map((i) => (
          <Card key={i} padding="lg" className="space-y-3">
            <Skeleton className="w-32" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </Card>
        ))}
      </div>
    );
  }

  const renderFields = (fields: Field[]) =>
    fields.map(({ key, label, type, placeholder }) => (
      <Input key={key} label={label} type={type ?? 'text'} placeholder={placeholder} value={form[key] || ''} onChange={(e) => update(key, e.target.value)} />
    ));

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {header}

      <Card padding="lg" className="space-y-4">
        <h2 className="text-base font-semibold text-text">Contacto</h2>
        {renderFields(CONTACT_FIELDS)}
      </Card>

      <Card padding="lg" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-text">Redes sociales</h2>
          <p className="mt-0.5 text-sm text-text-muted">Deja el campo vacío para que su ícono no se muestre en la landing.</p>
        </div>
        {renderFields(SOCIAL_FIELDS)}
      </Card>

      {dirty && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-modal">
          <p className="text-sm text-text-muted">Tienes cambios sin guardar.</p>
          <Button type="submit" loading={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
        </div>
      )}
    </form>
  );
}
