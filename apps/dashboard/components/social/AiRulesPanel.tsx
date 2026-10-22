'use client';

import { Bot } from 'lucide-react';
import { Button, Card, Select, Switch } from '../ui';
import type { SocialRules } from './api';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';

type ToggleKey = Exclude<keyof SocialRules, 'personality'>;

const TOGGLES: { key: ToggleKey; title: string; desc: string; needsActive?: boolean }[] = [
  {
    key: 'isActive',
    title: 'Respuestas automáticas (comentarios)',
    desc: 'Permite que el bot responda comentarios solo. Si lo apagas, tienes que responder todo a mano.',
  },
  {
    key: 'dmBotEnabled',
    title: 'Agente inteligente (mensajes directos)',
    desc: 'Responde los DM de Instagram como un asistente del local: conoce tu carta digital y tu base de conocimiento (los mismos datos del bot de WhatsApp) y recuerda lo que ya se habló en la conversación. Por defecto apagado: el inbox es más personal que los comentarios.',
  },
  { key: 'replyToQuestions', title: 'Preguntas frecuentes', desc: 'Responde a dudas sobre horarios, ubicación y menú.', needsActive: true },
  { key: 'replyToCompliments', title: 'Agradecimientos', desc: 'Responde automáticamente a elogios y buenos comentarios.', needsActive: true },
  { key: 'redirectComplaints', title: 'Derivar quejas', desc: 'Pide que envíen un mensaje directo (DM) si el comentario es negativo.', needsActive: true },
  { key: 'revealPrices', title: 'Responder con precios', desc: 'Revela precios de la carta en los comentarios si lo solicitan.', needsActive: true },
];

/** Reglas del bot de Instagram: qué responde solo y con qué personalidad. */
export function AiRulesPanel({ rules, onChange, onSave, saving, accountCount }: {
  rules: SocialRules;
  onChange(rules: SocialRules): void;
  onSave(): void;
  saving: boolean;
  accountCount: number;
}) {
  const { customer } = useCustomerLabels();
  return (
    <Card padding="lg" className="max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text">Reglas de la IA</h2>
          <p className="text-sm text-text-muted">Aplican a {accountCount === 1 ? 'tu cuenta vinculada' : `las ${accountCount} cuentas vinculadas`}.</p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {TOGGLES.map((t) => (
          <div key={t.key} className="py-3 first:pt-0">
            <Switch
              label={t.title}
              checked={rules[t.key]}
              disabled={t.needsActive && !rules.isActive}
              onChange={(value) => onChange({ ...rules, [t.key]: value })}
            />
            <p className="text-sm text-text-muted">{t.desc}</p>
          </div>
        ))}
      </div>

      <Select
        label="Personalidad del bot"
        value={rules.personality}
        onChange={(e) => onChange({ ...rules, personality: e.target.value as SocialRules['personality'] })}
      >
        <option value="friendly">Amigable y cercano (Ej: ¡Hola! Claro que sí...)</option>
        <option value="formal">{`Formal y profesional (Ej: Estimado ${customer}...)`}</option>
        <option value="casual">Jovial y moderno (Ej: ¡Qué tal bro!...)</option>
      </Select>

      <Button loading={saving} onClick={onSave}>{saving ? 'Guardando...' : 'Guardar reglas de IA'}</Button>
    </Card>
  );
}
