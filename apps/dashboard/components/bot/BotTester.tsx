'use client';

import React, { useRef, useState } from 'react';
import { Bot, Eraser, Send } from 'lucide-react';
import { plazbotApi } from '../../lib/api-client';
import { Button, Card } from '../ui';
import { controlStyles } from '../ui/Field';

type DemoMessage = { role: 'user' | 'bot'; text: string };

/** "Probar bot": simula una conversación con la configuración guardada. */
export function BotTester({ placeId, customerLabel }: { placeId: string; customerLabel: string }) {
  const [demoMessages, setDemoMessages] = useState<DemoMessage[]>([]);
  const [demoInput, setDemoInput] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const demoEndRef = useRef<HTMLDivElement>(null);

  const handleDemoSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = demoInput.trim();
    if (!text || !placeId || demoLoading) return;
    const userMsg: DemoMessage = { role: 'user', text };
    const history = demoMessages.map(m => ({ role: (m.role === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant', content: m.text }));
    setDemoMessages(prev => [...prev, userMsg]);
    setDemoInput('');
    setDemoLoading(true);
    try {
      const res = await plazbotApi.demoChat({ placeId, message: text, history });
      setDemoMessages(prev => [...prev, { role: 'bot', text: res.response || '...' }]);
    } catch {
      setDemoMessages(prev => [...prev, { role: 'bot', text: 'Error al obtener respuesta.' }]);
    } finally {
      setDemoLoading(false);
      setTimeout(() => demoEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  };

  return (
    <Card padding="sm" className="overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div>
          <h2 className="text-base font-semibold text-text">Probar bot</h2>
          <p className="mt-0.5 text-sm text-text-muted">Simula una conversación con la configuración guardada.</p>
        </div>
        {demoMessages.length > 0 && (
          <Button variant="ghost" size="sm" icon={Eraser} onClick={() => setDemoMessages([])}>Limpiar</Button>
        )}
      </div>

      <div className="h-80 space-y-2 overflow-y-auto border-y border-border bg-background px-4 py-3" aria-live="polite">
        {demoMessages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="rounded-full border border-border bg-surface px-4 py-2 text-xs text-text-muted">Escribe un mensaje para probar el bot</p>
          </div>
        )}
        {demoMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-card px-3 py-2 text-sm ${
              msg.role === 'user' ? 'bg-primary text-white' : 'border border-primary/20 bg-primary-soft text-text'
            }`}>
              {msg.role === 'bot' && (
                <span className="mb-0.5 flex items-center gap-1 text-xs font-medium text-text-muted"><Bot size={16} aria-hidden /> Bot</span>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {demoLoading && (
          <div className="flex justify-start" role="status" aria-label="El bot está escribiendo">
            <div className="flex items-center gap-1 rounded-card border border-border bg-surface px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted motion-reduce:animate-none [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted motion-reduce:animate-none [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted motion-reduce:animate-none [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={demoEndRef} />
      </div>

      <form onSubmit={handleDemoSend} className="flex gap-2 px-4 py-3">
        <input
          type="text"
          value={demoInput}
          onChange={e => setDemoInput(e.target.value)}
          placeholder={`Escribe como si fueras un ${customerLabel.toLowerCase()}...`}
          aria-label="Mensaje de prueba"
          disabled={demoLoading}
          className={controlStyles(undefined, 'h-11 min-w-0 flex-1')}
        />
        <Button type="submit" icon={Send} disabled={!demoInput.trim() || demoLoading} aria-label="Enviar" className="w-11 shrink-0 px-0" />
      </form>
    </Card>
  );
}
