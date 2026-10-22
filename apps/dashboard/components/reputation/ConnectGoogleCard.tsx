import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Card } from '../ui';
import { GoogleIcon } from './GoogleIcon';

const STEPS = [
  { title: 'Busca tu negocio', text: 'Pulsa "Buscar" y elige tu local en la lista.' },
  { title: 'Guarda y sincroniza', text: 'Traemos tus reseñas más recientes de Google.' },
  { title: 'Responde con IA', text: 'La IA escribe la respuesta, tú la apruebas.' },
];

/** Estado "sin Google conectado": explica el valor y los pasos antes de pedir nada. */
export function ConnectGoogleCard({ children }: { children: ReactNode }) {
  return (
    <Card padding="lg" className="space-y-6">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft">
          <GoogleIcon size={24} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-text">Conecta tu Google y responde tus reseñas desde aquí</h2>
          <p className="mt-1 text-sm text-text-muted">
            Trae tus reseñas, la IA te propone la respuesta y tú decides qué publicar. Nada se envía sin tu visto bueno.
          </p>
        </div>
      </header>

      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3 rounded-card bg-background p-4">
            <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text">{step.title}</p>
              <p className="mt-0.5 text-sm text-text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {children}

      <p className="flex items-start gap-2 text-sm text-text-muted">
        <Info size={20} aria-hidden className="mt-0.5 shrink-0" />
        <span>
          Google todavía está aprobando nuestro acceso para publicar por ti. Mientras tanto, copiamos tu respuesta y abrimos Google para que la pegues con un clic.
        </span>
      </p>
    </Card>
  );
}
