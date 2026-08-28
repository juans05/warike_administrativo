'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api-client';
import { SkeletonPage } from '../../../components/SkeletonLoader';
import { toast } from 'sonner';

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

const inputClass = 'w-full bg-[#F7F8FA] rounded-2xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-50';
const labelClass = 'text-xs font-black text-gray-400 uppercase tracking-widest block mb-2';

export default function ConfiguracionPage() {
  const [form, setForm] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getPlatformSettings()
      .then((data: Settings) => setForm({ ...EMPTY, ...data }))
      .catch(() => toast.error('Error cargando la configuración'))
      .finally(() => setLoading(false));
  }, []);

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
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error('Error guardando la configuración');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SkeletonPage type="default" />;

  return (
    <form onSubmit={handleSave} className="space-y-12 pb-20 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Configuración del sitio</h1>
        <p className="text-[#6B7280] font-medium max-w-lg">Datos de contacto y redes sociales que se muestran en la landing pública.</p>
      </header>

      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 space-y-6">
        <h2 className="text-xl font-black text-[#1A1A1A]">Contacto</h2>
        <div>
          <label className={labelClass}>Correo</label>
          <input value={form.contactEmail || ''} onChange={(e) => update('contactEmail', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Teléfono</label>
          <input value={form.contactPhone || ''} onChange={(e) => update('contactPhone', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Dirección</label>
          <input value={form.contactAddress || ''} onChange={(e) => update('contactAddress', e.target.value)} className={inputClass} />
        </div>
      </section>

      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 space-y-6">
        <h2 className="text-xl font-black text-[#1A1A1A]">Redes sociales</h2>
        <p className="text-sm text-gray-500 -mt-4">Deja el campo vacío para que su ícono no se muestre en la landing.</p>
        <div>
          <label className={labelClass}>Instagram (URL completa)</label>
          <input placeholder="https://instagram.com/warique_app" value={form.socialInstagram || ''} onChange={(e) => update('socialInstagram', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Facebook (URL completa)</label>
          <input placeholder="https://facebook.com/warique" value={form.socialFacebook || ''} onChange={(e) => update('socialFacebook', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>TikTok (URL completa)</label>
          <input placeholder="https://tiktok.com/@warique" value={form.socialTiktok || ''} onChange={(e) => update('socialTiktok', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>X / Twitter (URL completa)</label>
          <input placeholder="https://x.com/warique" value={form.socialX || ''} onChange={(e) => update('socialX', e.target.value)} className={inputClass} />
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="bg-[#F26122] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#F26122]/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
