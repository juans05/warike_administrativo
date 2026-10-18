'use client';

import React, { useState } from 'react';
import { Megaphone, Plus, X } from 'lucide-react';
import { plazbotApi } from '../../lib/api-client';
import { Badge, Button, Card, Input, Select, StatTile } from '../ui';

export type PlazbotMetrics = {
  totalContacts: number;
  totalConversations: number;
  totalOpportunities: number;
  totalTasks: number;
};

export type PlazbotTemplate = {
  id: string;
  elementName: string;
  languageCode: string;
  category: string;
};

/** Métricas del workspace de PlazBot (solo cuando PlazBot está configurado). */
export function PlazbotMetricsCard({ metrics }: { metrics: PlazbotMetrics }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-text">Métricas del workspace</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Contactos', value: metrics.totalContacts },
          { label: 'Conversaciones', value: metrics.totalConversations },
          { label: 'Oportunidades', value: metrics.totalOpportunities },
          { label: 'Tareas', value: metrics.totalTasks },
        ].map(({ label, value }) => (
          <StatTile key={label} label={label} value={value?.toLocaleString() ?? '—'} />
        ))}
      </div>
    </section>
  );
}

/** Campañas con la cuenta global de PlazBot de Wuarikes: solo admin (el backend también lo exige). */
export function PlazbotCampaignsCard({ templates }: { templates: PlazbotTemplate[] }) {
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: '', templateId: '', contacts: '' });
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignResult, setCampaignResult] = useState('');

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignSending(true); setCampaignResult('');
    try {
      const contacts = campaignForm.contacts.split(',').map(s => s.trim()).filter(Boolean);
      await plazbotApi.createCampaign({ name: campaignForm.name, templateId: campaignForm.templateId, contacts });
      setCampaignResult('Campaña lanzada correctamente.');
      setCampaignForm({ name: '', templateId: '', contacts: '' });
      setShowCampaignForm(false);
    } catch (err: any) {
      setCampaignResult(err.message || 'Error al lanzar la campaña');
    } finally { setCampaignSending(false); }
  };

  const failed = campaignResult.includes('Error');

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text">Campañas de PlazBot</h2>
        {templates.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            icon={showCampaignForm ? X : Plus}
            onClick={() => { setShowCampaignForm(v => !v); setCampaignResult(''); }}
          >
            {showCampaignForm ? 'Cancelar' : 'Nueva campaña'}
          </Button>
        )}
      </div>

      {templates.length === 0 && <p className="text-sm text-text-muted">No hay plantillas aprobadas en el workspace de PlazBot.</p>}

      {campaignResult && (
        <p role="status" className={`rounded-control border px-3 py-2 text-sm font-medium ${failed ? 'border-danger/30 bg-danger/10 text-danger' : 'border-success/30 bg-success/10 text-success'}`}>
          {campaignResult}
        </p>
      )}

      {showCampaignForm && (
        <form onSubmit={handleLaunchCampaign} className="space-y-3 rounded-card border border-border bg-background p-4">
          <Input
            label="Nombre"
            value={campaignForm.name}
            onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Ej: Promo fin de semana"
            required
          />
          <Select
            label="Plantilla"
            value={campaignForm.templateId}
            onChange={e => setCampaignForm(p => ({ ...p, templateId: e.target.value }))}
            required
          >
            <option value="">Seleccionar plantilla...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.elementName} ({t.languageCode.toUpperCase()})</option>
            ))}
          </Select>
          <Input
            label="IDs de contactos"
            hint="Separados por coma."
            value={campaignForm.contacts}
            onChange={e => setCampaignForm(p => ({ ...p, contacts: e.target.value }))}
            placeholder="id_contacto_1, id_contacto_2, ..."
            required
          />
          <Button type="submit" icon={Megaphone} loading={campaignSending} className="w-full">
            {campaignSending ? 'Lanzando...' : 'Lanzar campaña'}
          </Button>
        </form>
      )}

      {templates.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-muted">Plantillas activas</h3>
          <ul className="divide-y divide-border rounded-card border border-border">
            {templates.map(t => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm font-medium text-text">
                  {t.elementName} <span className="ml-1 text-xs text-text-muted">{t.languageCode.toUpperCase()}</span>
                </span>
                <Badge>{t.category}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
